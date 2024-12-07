import { goto } from '$app/navigation';
import pb from '$lib/pocketbase/pocketbase';
import type {
	Participant,
	ParticipantRoomDetails,
	Room,
	RoomDetails,
	RoomType
} from '$lib/scrum/types/room';
import { hashString } from '$lib/crypto';
import { setRoomKeyCookie } from '$lib/utils';

export async function joinRoomWithCode(roomCode: string) {
	try {
		const room = await pb.collection('rooms_search').getOne(roomCode);
		console.log('Found room with code:', roomCode, room);
		goto(`/room/${room.room_id}`);
	} catch (err) {
		console.error('Failed to join room', err);
	}
}

export async function getParticipantInRoom(
	userId: string,
	roomId: string
): Promise<Participant | undefined> {
	try {
		return await pb
			.collection('participants')
			.getFirstListItem(`user = "${userId}" && room = "${roomId}"`);
	} catch (err) {
		console.warn('Could not find participant in room', userId, roomId, err);
		return undefined;
	}
}

export async function getUserParticipant(roomId: string): Promise<Participant | undefined> {
	const userId = pb.authStore.model?.id;
	const existingUser = await getParticipantInRoom(userId, roomId);
	if (existingUser) {
		return existingUser;
	}
}

export async function joinRoomAndGetParticipantDetails(
	roomId: string,
	roomKey: string
): Promise<Participant> {
	try {
		const userId = pb.authStore.model?.id;
		const existingUser = await getParticipantInRoom(userId, roomId);
		if (existingUser) {
			return existingUser;
		}

		const roomKeyHash = await hashString(roomKey);

		// Create the participant entry
		const participantData = {
			user: userId,
			room: roomId,
			name: pb.authStore.model?.name
		};
		const newParticipant = await pb.collection('participants').create(participantData, {
			headers: {
				x_room_key: roomKeyHash
			}
		});
		console.log('Room Joined successfully:', newParticipant);
		setRoomKeyCookie(roomId, roomKey);
		// Update Room with new participant
		await pb.collection('rooms').update(
			roomId,
			{
				'participants+': newParticipant.id
			},
			{
				headers: {
					x_room_key: roomKeyHash
				}
			}
		);

		return {
			id: newParticipant.id,
			userId: newParticipant.user,
			name: newParticipant.name
		};
	} catch (err) {
		console.warn('Failed to join room', err);
		throw err;
	}
}

export async function createRoom(roomName: string, roomType: RoomType): Promise<Room> {
	try {
		const passcode = createRoomPasscode();
		const roomData = {
			creator: pb.authStore.model?.id,
			room_name: roomName,
			room_code: createRoomCode(),
			room_type: roomType,
			room_key_hash: await hashString(passcode)
		};

		const newRoom = await pb.collection('rooms').create(roomData);
		console.log(`Room created successfully:`, newRoom);

		// Save the password locally so it can be shared to other users.
		// Just want to keep it away from the server to preserve E2E encryption
		setRoomKeyCookie(newRoom.id, passcode);

		return {
			id: newRoom.id,
			created: newRoom.created,
			room_name: newRoom.room_name,
			room_code: newRoom.room_code,
			room_type: newRoom.room_type,
			participants: newRoom.participants,
			room_key_hash: newRoom.room_key_hash
		};
	} catch (err) {
		console.error('Error creating room:', err);
		throw err;
	}
}

export async function getRoomDetails(roomId: string): Promise<RoomDetails> {
	try {
		const room = await pb.collection('rooms').getOne(roomId, {
			expand: 'participants',
			fields:
				'id,created,room_name,room_code,room_type,' +
				'expand.participants.id,expand.participants.user_id,expand.participants.name'
		});
		console.log('getRoomDetails', room);
		return {
			id: room.id,
			created: room.created,
			room_name: room.room_name,
			room_code: room.room_code,
			room_type: room.room_type,
			participants: room.expand?.participants,
			room_key_hash: room.room_key_hash
		};
	} catch (err) {
		console.error('Failed to get room with id:', roomId);
		throw err;
	}
}

export function subscribeToRoomUpdates(roomId: string, callback: (record: RoomDetails) => void) {
	pb.collection('rooms').subscribe(
		roomId,
		function (e) {
			if (e.action == 'update') {
				const room = e.record;
				callback({
					id: room.id,
					created: room.created,
					room_name: room.room_name,
					room_code: room.room_code,
					room_type: room.room_type,
					participants: room.expand?.participants,
					room_key_hash: room.room_key_hash
				});
			}
		},
		{
			expand: 'participants',
			fields:
				'id,created,room_name,room_code,room_type,' +
				'expand.participants.id,expand.participants.user_id,expand.participants.name'
		}
	);
}

export async function getUserRooms(): Promise<ParticipantRoomDetails[]> {
	const userId = pb.authStore.model?.id;

	try {
		const userRooms = pb.collection('participants').getList(1, 5, {
			filter: `user = "${userId}"`,
			expand: 'room',
			sort: '-created'
		});

		return (await userRooms).items.map((item) => {
			return { time_joined: item.created, ...item.expand?.room };
		});
	} catch (err) {
		console.error('Failed to get rooms for user ', userId, err);
		throw err;
	}
}

function getChars(length: number, numbersOnly: boolean = false) {
	let result = '';
	const characters = numbersOnly ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

function createRoomCode() {
	return `${getChars(3, true)}-${getChars(3, true)}-${getChars(4, true)}`;
}

function createRoomPasscode() {
	return `${getChars(6, false)}`;
}
