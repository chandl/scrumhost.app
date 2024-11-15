export type Comment = {
	id: string;
	content: string;
	author: string;
};

export type RetroItemCategory = 'WENT_WELL' | 'TO_IMPROVE' | 'ACTION_ITEMS';

export type RetroItem = {
	id: string;
	content: string;
	category: RetroItemCategory;
	votes: string[];
	comments: Comment[];
};
