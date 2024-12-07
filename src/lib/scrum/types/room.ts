export interface Room {
	id: string;
	created: string;
	room_name: string;
	room_code: string;
	room_type: RoomType;
	room_key?: string;
	room_key_hash: string;
	participants: string[];
}

export interface RoomDetails extends Omit<Room, 'participants'> {
	participants: Participant[];
}

export type RoomType = 'REFINEMENT' | 'RETROSPECTIVE';

export interface ParticipantRoomDetails extends Room {
	time_joined: string;
}

export interface Participant {
	id: string;
	userId: string;
	name: string;
}
