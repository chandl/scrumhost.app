import type { Config } from '../config';
import { randomToken } from '../crypto';
import { createRoom, joinRoom, newClient, signup } from '../pbClient';
import { waitFor } from '../types';

/**
 * Exercises the retrospective contract: two identities share a room, one
 * posts an item and the other upvotes and comments on it, and each side
 * must observe the other's writes through the retro_metadata realtime
 * subscription -- the same channel the retro board UI relies on.
 */
export async function runRetroApiCheck(cfg: Config): Promise<void> {
	const token = randomToken();
	const pbA = newClient(cfg.apiUrl);
	const pbB = newClient(cfg.apiUrl);

	await signup(pbA, `${cfg.namePrefix}-retro-a-${token}`);
	await signup(pbB, `${cfg.namePrefix}-retro-b-${token}`);

	const room = await createRoom(pbA, `${cfg.namePrefix} retro ${token}`, 'RETROSPECTIVE');
	const participantA = await joinRoom(pbA, room.id, room.passcode);
	const participantB = await joinRoom(pbB, room.id, room.passcode);

	const retroMetadata = await pbA.collection('retro_metadata').create({
		parent_room: room.id,
		host: participantA.id,
		items: []
	});

	// subscribe() resolves only once the subscription is registered with the
	// server, so it must be awaited before A's write or the event can be missed.
	let bObservedItemCount = 0;
	await pbB.collection('retro_metadata').subscribe(
		retroMetadata.id,
		(e) => {
			if (e.action === 'update') {
				bObservedItemCount = (e.record.items ?? []).length;
			}
		},
		{ fields: 'id,items' }
	);

	try {
		const itemText = `canary retro item ${token}`;
		const item = await pbA.collection('retro_items').create({
			content: itemText,
			category: 'WENT_WELL',
			author: participantA.id,
			retro_metadata: retroMetadata.id
		});
		await pbA.collection('retro_metadata').update(retroMetadata.id, { 'items+': item.id });

		await waitFor(
			() => bObservedItemCount >= 1,
			8000,
			150,
			"retro metadata realtime update reflecting A's new item"
		);

		const vote = await pbB.collection('retro_votes').create({
			item: item.id,
			voter: participantB.id
		});
		await pbB.collection('retro_items').update(item.id, { 'votes+': vote.id });

		const comment = await pbB.collection('retro_comments').create({
			item: item.id,
			author: participantB.id,
			comment: `canary comment ${token}`
		});
		await pbB.collection('retro_items').update(item.id, { 'comments+': comment.id });

		const finalItem = await pbA.collection('retro_items').getOne(item.id, {
			expand: 'votes,comments',
			fields: 'id,content,expand.votes.id,expand.comments.comment'
		});
		if (finalItem.content !== itemText) {
			throw new Error(
				`retro item content = ${JSON.stringify(finalItem.content)}, want ${JSON.stringify(itemText)}`
			);
		}
		if ((finalItem.expand?.votes ?? []).length < 1) {
			throw new Error("retro item is missing B's upvote");
		}
		if ((finalItem.expand?.comments ?? []).length < 1) {
			throw new Error("retro item is missing B's comment");
		}
	} finally {
		await pbB.collection('retro_metadata').unsubscribe();
	}
}
