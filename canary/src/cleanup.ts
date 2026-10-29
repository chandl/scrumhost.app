import PocketBase from 'pocketbase';
import { positiveDurationMs } from './duration';
import { newClient } from './pbClient';

export interface CleanupConfig {
	apiUrl: string;
	namePrefix: string;
	adminEmail: string;
	adminPassword: string;
	maxAge: number;
	interval: number;
}

function env(key: string, fallback: string): string {
	const value = process.env[key];
	return value && value.length > 0 ? value : fallback;
}

function requireEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`${key} is required`);
	}
	return value;
}

export function loadCleanupConfig(): CleanupConfig {
	return {
		apiUrl: env('CANARY_API_URL', 'https://api.scrumhost.app').replace(/\/+$/, ''),
		namePrefix: env('CANARY_NAME_PREFIX', 'canary'),
		adminEmail: requireEnv('CANARY_ADMIN_EMAIL'),
		adminPassword: requireEnv('CANARY_ADMIN_PASSWORD'),
		// Canary checks run every CANARY_INTERVAL (default 2m); keep the default
		// well clear of that so an in-flight check's rooms/users are never
		// mid-cleanup when the check tries to write to them.
		maxAge: positiveDurationMs(env('CANARY_CLEANUP_MAX_AGE', '30m'), 'CANARY_CLEANUP_MAX_AGE'),
		interval: positiveDurationMs(env('CANARY_CLEANUP_INTERVAL', '1h'), 'CANARY_CLEANUP_INTERVAL')
	};
}

function pbFilterString(value: string): string {
	return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function deleteWhere(pb: PocketBase, collection: string, filter: string): Promise<number> {
	const records = await pb.collection(collection).getFullList({ filter });
	for (const record of records) {
		await pb.collection(collection).delete(record.id);
	}
	return records.length;
}

/**
 * Deletes a canary-created room and everything hanging off it. None of the
 * schema's relations cascade (schema/pb_schema.json keeps cascadeDelete off
 * for every collection so a stray delete can never take down real user
 * data), so each child collection has to be torn down explicitly, children
 * before parents.
 */
async function cleanupRoom(
	pb: PocketBase,
	room: { id: string; room_type: string }
): Promise<void> {
	await deleteWhere(pb, 'participants', `room=${pbFilterString(room.id)}`);

	if (room.room_type === 'REFINEMENT') {
		const metadatas = await pb
			.collection('refinement_metadata')
			.getFullList({ filter: `parent_room=${pbFilterString(room.id)}` });
		for (const metadata of metadatas) {
			const stories = await pb
				.collection('stories')
				.getFullList({ filter: `refinement_metadata=${pbFilterString(metadata.id)}` });
			for (const story of stories) {
				await deleteWhere(pb, 'story_estimates', `story=${pbFilterString(story.id)}`);
				await pb.collection('stories').delete(story.id);
			}
			await pb.collection('refinement_metadata').delete(metadata.id);
		}
	} else {
		const metadatas = await pb
			.collection('retro_metadata')
			.getFullList({ filter: `parent_room=${pbFilterString(room.id)}` });
		for (const metadata of metadatas) {
			const items = await pb
				.collection('retro_items')
				.getFullList({ filter: `retro_metadata=${pbFilterString(metadata.id)}` });
			for (const item of items) {
				await deleteWhere(pb, 'retro_comments', `item=${pbFilterString(item.id)}`);
				await deleteWhere(pb, 'retro_votes', `item=${pbFilterString(item.id)}`);
				await pb.collection('retro_items').delete(item.id);
			}
			await pb.collection('retro_metadata').delete(metadata.id);
		}
	}

	await pb.collection('rooms').delete(room.id);
}

export async function runCleanup(cfg: CleanupConfig): Promise<{ rooms: number; users: number }> {
	const pb = newClient(cfg.apiUrl);
	await pb.collection('_superusers').authWithPassword(cfg.adminEmail, cfg.adminPassword);

	const cutoff = new Date(Date.now() - cfg.maxAge).toISOString().replace('T', ' ');
	const filter = `room_name ~ ${pbFilterString(cfg.namePrefix)} && created < ${pbFilterString(cutoff)}`;
	const rooms = await pb.collection('rooms').getFullList({ filter, fields: 'id,room_type' });
	for (const room of rooms) {
		await cleanupRoom(pb, { id: room.id, room_type: room.room_type });
	}

	// Users are purged independently of rooms: a signup can fail before its
	// room is created (leaving an orphaned user with no room to key off), so
	// this can't rely on the room sweep above to have caught everything.
	const userFilter = `name ~ ${pbFilterString(cfg.namePrefix)} && created < ${pbFilterString(cutoff)}`;
	const users = await deleteWhere(pb, 'users', userFilter);

	return { rooms: rooms.length, users };
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLoop(cfg: CleanupConfig): Promise<void> {
	let stopped = false;
	const shutdown = () => {
		console.log('canary cleanup shutting down');
		stopped = true;
	};
	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	while (!stopped) {
		const startedAt = Date.now();
		try {
			const { rooms, users } = await runCleanup(cfg);
			console.log(
				`canary cleanup run completed rooms=${rooms} users=${users} latency_ms=${Date.now() - startedAt}`
			);
		} catch (err) {
			console.log(`canary cleanup run failed error=${JSON.stringify(String(err))}`);
		}
		await sleep(cfg.interval);
	}
}

function main(): void {
	const cfg = loadCleanupConfig();
	runLoop(cfg).catch((err) => {
		console.error(err);
		process.exit(1);
	});
}

if (require.main === module) {
	main();
}
