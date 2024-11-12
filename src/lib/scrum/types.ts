export interface Room {
	id: string;
	created: string;
	room_name: string;
	room_code: string;
	active_story_id: string;
	room_status: RoomState;
	point_values: string;
}

export type RoomState = 'IDLE' | 'VOTING' | 'REVIEWING';

export interface RoomDetails extends Room {
	stories: string[];
	participants: string[];
}

export interface RoomSummary extends Room {
	stories: StorySummary[];
	participants: Participant[];
}

export interface ParticipantRoomDetails extends RoomDetails {
	time_joined: string;
}

export interface Participant {
	id: string;
	userId: string;
	name: string;
}

export interface Estimate {
	id: string;
	storyId: string;
	estimate: string;
	user: string;
}

export type StoryStatus = 'QUEUED' | 'REVIEWED' | 'SKIPPED';
export type StoryAction = 'START_VOTING' | 'MARK_REVIEWED' | 'SKIP' | 'REQUEUE';

export interface StorySummary {
	id: string;
	details: string;
	story_status: StoryStatus;
}

export interface StoryDetails {
	id: string;
	room: string;
	details: string;
	story_status: StoryStatus;
	created: string;
	story_estimates: string[];
}
