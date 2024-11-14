export interface Estimate {
	id: string;
	storyId: string;
	estimate: string;
	user: string;
	participant: string;
}

export type StoryStatus = 'QUEUED' | 'REVIEWED' | 'SKIPPED';
export type StoryAction =
	| 'START_VOTING'
	| 'MARK_REVIEWED'
	| 'SKIP'
	| 'REQUEUE'
	| 'REVIEW_RESULTS'
	| 'CLEAR_VOTES';

export interface StorySummary {
	id: string;
	details: string;
	story_status: StoryStatus;
	updated: string;
}

export interface StoryDetails extends StorySummary {
	refinement_metadata: string;
	created: string;
	story_estimates: string[];
}

export interface StoryWithEstimates extends StorySummary {
	id: string;
	details: string;
	story_estimates: Estimate[];
}

export interface RefinementMetadata {
	id: string;
	point_values: string;
	active_story: string;
	room_status: RefinementRoomStatus;
	parent_room: string;
	host: string;
	stories: StorySummary[];
}

export interface RefinementMetadataDetails extends Omit<RefinementMetadata, 'stories'> {
	stories: StorySummary[];
}

export type RefinementRoomStatus = 'IDLE' | 'VOTING' | 'REVIEWING';
