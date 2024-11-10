import { goto } from '$app/navigation';
import pb from '$lib/pocketbase';

export async function joinRoomWithCode(roomCode: string) {
	try {
		const room = await pb.collection('rooms').getFirstListItem(`room_code = "${roomCode}"`);
		console.log('Found room with code:', roomCode, room);

		await joinRoom(room.id);
		goto(`/room/${room.id}`);
	} catch (err) {
		console.error('Failed to join room', err);
	}
}

export async function doesParticipantExistInRoom(userId: string, roomId: string): Promise<boolean> {
	try {
		const participant = await pb
			.collection('participants')
			.getFirstListItem(`user = "${userId}" && room = "${roomId}"`);
		if (participant) {
			return true;
		}
	} catch (err) {
		console.warn('Could not find participant in room', userId, roomId, err);
	}
	return false;
}

export async function joinRoom(roomId: string) {
	try {
		const userId = pb.authStore.model?.id;
		if (!(await doesParticipantExistInRoom(userId, roomId))) {
			// Create the participant entry
			const participantData = {
				user: userId,
				room: roomId,
				name: pb.authStore.model?.name
			};
			const newParticipant = await pb.collection('participants').create(participantData);
			console.log('Room Joined successfully:', newParticipant);
		}
	} catch (err) {
		console.warn('Failed to join room', err);
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
			is_voting_period: false,
			active_story: null
		};

		const newRoom = await pb.collection('rooms').create(roomData);
		console.log(`Room created successfully:`, newRoom);

		await joinRoom(newRoom.id);

		return newRoom.id;
	} catch (err) {
		console.error('Error creating room:', err);
		throw err;
	}
}

export interface Room {
	id: string;
	created: string;
	room_name: string;
	room_code: string;
}

export interface RoomDetails extends Room {
	active_story_id: string;
	is_voting_period: boolean;
	point_values: string;
	stories: string[];
	participants: string[];
}


export interface ParticipantRoomDetails extends RoomDetails {
	time_joined: string;
}

export interface Participant {
	id: string;
	userId: string;
	name: string;
}

export function subscribeToRoomUpdates(roomId: string, callback: (record: RoomDetails) => void) {
	pb.collection('rooms').subscribe(roomId, function (e) {
		if (e.action == 'update') {
			console.log('Room Update: ', e);
			callback({
				id: e.record.id,
				created: e.record.created,
				room_name: e.record.room_name,
				room_code: e.record.room_code,
				active_story_id: e.record.active_story,
				is_voting_period: e.record.is_voting_period,
				point_values: e.record.point_values,
				stories: e.record.stories,
				participants: e.record.participants
			});
		}
	});
}

export function subscribeToNewParticipants(
	roomId: string,
	callback: (record: Participant) => void
) {
	// TODO utilize room's 'participants' relation instead
	pb.collection('participants').subscribe('*', function (e) {
		if (e.action === 'create' && e.record.room == roomId) {
			console.log('Participant Subscription Hit:', e);
			callback({
				id: e.record.id,
				userId: e.record.user,
				name: e.record.name
			});
		}
	});
}

export async function setVotingFlag(roomId: string, enableVoting: boolean) {
	try {
		const currentRoomData = await getRoom(roomId);
		const record = await pb
			.collection('rooms')
			.update(roomId, { ...currentRoomData, is_voting_period: enableVoting });
		console.log(`Set room ${roomId} voting flag to ${enableVoting}`, record);
	} catch (err) {
		console.error('Failed to set active story in room', err);
		throw err;
	}
}

export async function setActiveStory(roomId: string, storyId: string) {
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
		console.log('Got room:', room);
		return {
			id: room.id,
			created: room.created,
			room_name: room.room_name,
			room_code: room.room_code,
			active_story_id: room.active_story,
			is_voting_period: room.is_voting_period,
			point_values: room.point_values,
			stories: room.stories,
			participants: room.participants
		};
	} catch (err) {
		console.error('Failed to get room with id:', roomId);
		throw err;
	}
}

export async function getRoomParticipants(roomId: string): Promise<Participant[]> {
	// TODO use room's 'participants' list instead
	try {
		const roomParticipants = pb.collection('participants').getList(1, 50, {
			filter: `room = "${roomId}"`,
			sort: '-created'
		});

		return (await roomParticipants).items.map((participant) => {
			return {
				id: participant.id,
				userId: participant.user,
				name: participant.name
			};
		});
	} catch (err) {
		console.error('Failed to get participants for room ', roomId, err);
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

		return (await userRooms).items.map((item) => {return {time_joined: item.created, ...item.expand?.room}});
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
