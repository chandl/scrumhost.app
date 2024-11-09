import pb from '$lib/pocketbase';

export async function joinRoomWithCode(roomCode: string) {
	try {
		const room = await pb.collection('rooms').getFirstListItem(`room_code = "${roomCode}"`);
		console.log('Found room with code:', roomCode, room);

		await joinRoom(room.id);
	} catch (err) {
		console.error('Failed to join room', err);
	}
}

export async function joinRoom(roomId: string) {
	const userId = pb.authStore.model?.id;
	// Create the participant entry
	const participantData = {
		user: userId,
		room: roomId
	};
	const newParticipant = await pb.collection('participants').create(participantData);
	console.log('Room Joined successfully:', newParticipant);
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
}

export interface Participant {
	id: string;
	name: string;
}

export function subscribeToRoomUpdates(roomId: string, callback: (record: RoomDetails) => void) {
	pb.collection('rooms').subscribe(roomId, function (e) {
		if (e.action == 'update' && e.record.id == roomId) {
			console.log('Room Update: ', e);
			callback({
				id: e.record.id,
				created: e.record.created,
				room_name: e.record.room_name,
				room_code: e.record.room_code,
				active_story_id: e.record.active_story,
				is_voting_period: e.record.is_voting_period,
				point_values: e.record.point_values
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
			point_values: room.point_values
		};
	} catch (err) {
		console.error('Failed to get room with id:', roomId);
		throw err;
	}
}

export async function getRoomParticipants(roomId: string): Promise<Participant[]> {
	try {
		const roomParticipants = pb.collection('participants').getList(1, 50, {
			filter: `room = "${roomId}"`,
			expand: 'user',
			fields: 'expand.user.id,expand.user.username',
			sort: '-created'
		});

		return (await roomParticipants).items.map((participant) => {
			return {
				id: participant.expand?.user.id,
				name: participant.expand?.user.username
			};
		});
	} catch (err) {
		console.error('Failed to get participants for room ', roomId, err);
		throw err;
	}
}

export async function getUserRooms(): Promise<Room[]> {
	const userId = pb.authStore.model?.id;

	try {
		const userRooms = pb.collection('participants').getList(1, 10, {
			filter: `user = "${userId}"`,
			expand: 'room',
			sort: '-created'
		});

		return (await userRooms).items.map((item) => item.expand?.room);
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
