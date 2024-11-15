export type RetroMetadata = {
	id: string;
	parent_room: string;
	items: RetroItem[];
	host: string;
};

export type RetroVote = {
	id: string;
	voter: string;
};

export type RetroComment = {
	id: string;
	content: string;
	author: string;
};

export type RetroItemCategory = 'WENT_WELL' | 'TO_IMPROVE' | 'ACTION_ITEMS';

export type RetroItem = {
	id: string;
	author: string;
	content: string;
	category: RetroItemCategory;
	votes: RetroVote[];
	comments: RetroComment[];
};
