import { goto } from '$app/navigation';
import pb from '$lib/pocketbase/pocketbase';
import type {
	Participant,
	ParticipantRoomDetails,
	RoomDetails,
	RoomState,
	RoomSummary
} from '$lib/scrum/types';

export async function joinRoomWithCode(roomCode: string) {
	try {
		const room = await pb.collection('rooms').getFirstListItem(`room_code = "${roomCode}"`);
		console.log('Found room with code:', roomCode, room);
		goto(`/room/${room.id}`);
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

export async function joinRoomAndGetParticipantDetails(roomId: string): Promise<Participant> {
	try {
		const userId = pb.authStore.model?.id;
		const existingUser = await getParticipantInRoom(userId, roomId);
		if (existingUser) {
			return existingUser;
		}
		// Create the participant entry
		const participantData = {
			user: userId,
			room: roomId,
			name: pb.authStore.model?.name
		};
		const newParticipant = await pb.collection('participants').create(participantData);
		console.log('Room Joined successfully:', newParticipant);
		// Update Room with new participant
		await pb.collection('rooms').update(roomId, {
			'participants+': newParticipant.id
		});

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

export async function createRoom(room_name: string, point_values: string) {
	// room code
	// point values
	try {
		const roomData = {
			host: pb.authStore.model?.id,
			room_name: room_name,
			room_code: createRoomCode(),
			point_values: point_values,
			room_status: 'IDLE',
			active_story: null
		};

		const newRoom = await pb.collection('rooms').create(roomData);
		console.log(`Room created successfully:`, newRoom);

		await joinRoomAndGetParticipantDetails(newRoom.id);

		return newRoom.id;
	} catch (err) {
		console.error('Error creating room:', err);
		throw err;
	}
}

export function subscribeToRoomUpdates(roomId: string, callback: (record: RoomSummary) => void) {
	pb.collection('rooms').subscribe(
		roomId,
		function (e) {
			if (e.action == 'update') {
				callback({
					id: e.record.id,
					created: e.record.created,
					room_name: e.record.room_name,
					room_code: e.record.room_code,
					active_story_id: e.record.active_story,
					room_status: e.record.room_status,
					point_values: e.record.point_values,
					stories: e.record.expand?.stories,
					participants: e.record.expand?.participants
				});
			}
		},
		{
			expand: 'stories,participants',
			fields:
				'id,created,room_name,room_code,active_story,' +
				'room_status,point_values,participants,expand.stories.id,expand.stories.details,expand.stories.story_status,expand.stories.updated, ' +
				'expand.participants.id,expand.participants.user_id,expand.participants.name'
		}
	);
}

export async function setRoomState(roomId: string, roomState: RoomState) {
	try {
		const currentRoomData = await getRoom(roomId);
		const record = await pb
			.collection('rooms')
			.update(roomId, { ...currentRoomData, room_status: roomState });
		console.log(`Set room ${roomId} state to ${roomState}`, record);
	} catch (err) {
		console.error('Failed to set room state', err);
		throw err;
	}
}

export async function setVotingFlag(roomId: string, enableVoting: boolean) {
	try {
		const currentRoomData = await getRoom(roomId);
		const record = await pb
			.collection('rooms')
			.update(roomId, { ...currentRoomData, room_status: enableVoting ? 'VOTING' : 'IDLE' });
		console.log(`Set room ${roomId} voting flag to ${enableVoting}`, record);
	} catch (err) {
		console.error('Failed to set active story in room', err);
		throw err;
	}
}

export async function setActiveStory(roomId: string, storyId: string | null) {
	try {
		const currentRoomData = await getRoom(roomId);
		const record = await pb
			.collection('rooms')
			.update(roomId, { ...currentRoomData, active_story: storyId });
		console.log(`Set room ${roomId} active story to ${storyId}`, record);
	} catch (err) {
		console.error('Failed to set active story in room', err);
		throw err;
	}
}

export async function getRoom(roomId: string): Promise<RoomDetails> {
	try {
		const room = await pb.collection('rooms').getOne(roomId);
		return {
			id: room.id,
			created: room.created,
			room_name: room.room_name,
			room_code: room.room_code,
			active_story_id: room.active_story,
			room_status: room.room_status,
			point_values: room.point_values,
			stories: room.stories,
			participants: room.participants
		};
	} catch (err) {
		console.error('Failed to get room with id:', roomId);
		throw err;
	}
}

export async function getRoomSummary(roomId: string): Promise<RoomSummary> {
	try {
		const room = await pb.collection('rooms').getOne(roomId, {
			expand: 'stories,participants',
			fields:
				'id,created,room_name,room_code,active_story,' +
				'room_status,point_values,participants,expand.stories.id,' +
				'expand.stories.details,expand.stories.story_status,expand.stories.updated,' +
				'expand.participants.id,expand.participants.user_id,expand.participants.name'
		});

		return {
			id: room.id,
			created: room.created,
			room_name: room.room_name,
			room_code: room.room_code,
			active_story_id: room.active_story,
			room_status: room.room_status,
			point_values: room.point_values,
			stories: room.expand?.stories,
			participants: room.expand?.participants
		};
	} catch (err) {
		console.error('Failed to get room with id:', roomId);
		throw err;
	}
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

function getChars(length: number) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

function createRoomCode() {
	return `${getChars(3)}-${getChars(3)}`;
}
