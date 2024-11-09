import pb from '$lib/pocketbase';

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

		// Create the participant entry
		const participantData = {
			user: pb.authStore.model?.id,
			room: newRoom.id
		};
		const newParticipant = await pb.collection('participants').create(participantData);
		console.log('Participant created successfully:', newParticipant);
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
