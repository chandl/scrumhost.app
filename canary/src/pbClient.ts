import EventSource from 'eventsource';
import PocketBase from 'pocketbase';
import { hashString } from './crypto';

// pocketbase's realtime subscriptions use browser EventSource; polyfill it for Node.
(globalThis as unknown as { EventSource: typeof EventSource }).EventSource = EventSource;

export function newClient(apiUrl: string): PocketBase {
	return new PocketBase(apiUrl);
}

function generateUsername(name: string): string {
	return `${name.replace(/[^a-zA-Z]/g, '')}-${randomSuffix()}`;
}

function randomSuffix(): string {
	return Math.random().toString(36).slice(2, 10);
}

function generatePassword(length: number): string {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
	let password = '';
	for (let i = 0; i < length; i++) {
		password += chars[Math.floor(Math.random() * chars.length)];
	}
	return password;
}

/** Mirrors src/lib/scrum/user.ts signup(): creates an anonymous user and logs in. */
export async function signup(pb: PocketBase, name: string): Promise<void> {
	const username = generateUsername(name);
	const password = generatePassword(16);
	await pb.collection('users').create({
		username,
		name,
		password,
		passwordConfirm: password
	});
	await pb.collection('users').authWithPassword(username, password);
}

function chars(length: number, numbersOnly = false): string {
	const alphabet = numbersOnly ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
	}
	return result;
}

function createRoomCode(): string {
	return `${chars(3, true)}-${chars(3, true)}-${chars(4, true)}`;
}

function createRoomPasscode(): string {
	return chars(6, false);
}

export interface CreatedRoom {
	id: string;
	roomCode: string;
	passcode: string;
	roomKeyHash: string;
}

/** Mirrors src/lib/scrum/room.ts createRoom(), minus the browser-only cookie side effect. */
export async function createRoom(
	pb: PocketBase,
	roomName: string,
	roomType: 'REFINEMENT' | 'RETROSPECTIVE'
): Promise<CreatedRoom> {
	const passcode = createRoomPasscode();
	const roomKeyHash = await hashString(passcode);
	const room = await pb.collection('rooms').create({
		creator: pb.authStore.model?.id,
		room_name: roomName,
		room_code: createRoomCode(),
		room_type: roomType,
		room_key_hash: roomKeyHash
	});
	return { id: room.id, roomCode: room.room_code, passcode, roomKeyHash };
}

export interface JoinedParticipant {
	id: string;
	userId: string;
	name: string;
}

/** Mirrors src/lib/scrum/room.ts joinRoomAndGetParticipantDetails(). */
export async function joinRoom(
	pb: PocketBase,
	roomId: string,
	passcode: string
): Promise<JoinedParticipant> {
	const roomKeyHash = await hashString(passcode);
	const participant = await pb.collection('participants').create(
		{
			user: pb.authStore.model?.id,
			room: roomId,
			name: pb.authStore.model?.name
		},
		{ headers: { x_room_key: roomKeyHash } }
	);
	await pb
		.collection('rooms')
		.update(roomId, { 'participants+': participant.id }, { headers: { x_room_key: roomKeyHash } });
	return { id: participant.id, userId: participant.user, name: participant.name };
}

/** Looks a room up by its shareable code, mirroring the /join flow's rooms_search lookup. */
export async function findRoomByCode(pb: PocketBase, roomCode: string): Promise<string> {
	const record = await pb.collection('rooms_search').getOne(roomCode);
	return record.room_id;
}
