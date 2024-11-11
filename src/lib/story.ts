import pb from '$lib/pocketbase';

export async function createStory(details: string, roomId: string) {
	const data = {
		room: roomId,
		details: details,
		story_status: 'QUEUED'
	};

	const record = await pb.collection('stories').create(data);
	console.log('Created story:', record);

	// add to room record
	await pb.collection('rooms').update(roomId, {
		'stories+': record.id
	});
	return record;
}

export type StoryStatus = 'QUEUED' | 'REVIEWED' | 'SKIPPED';

export type StoryAction = 'START_VOTING' | 'MARK_REVIEWED' | 'SKIP' | 'REQUEUE';

export interface Story {
	id: string;
	room: string;
	details: string;
	story_status: StoryStatus;
	created: string;
	story_estimates: string[];
}

export async function getStoryById(storyId: string): Promise<Story> {
	const story = await pb.collection('stories').getOne(storyId);
	console.log('Got story by id', storyId, story);
	return {
		id: story.id,
		room: story.room,
		details: story.details,
		story_status: story.story_status,
		created: story.created,
		story_estimates: story.story_estimates
	};
}

export async function getStoriesInRoom(roomId: string): Promise<Story[]> {
	// TODO just look at the 'stories' field in room
	try {
		const storiesInRoom = pb.collection('stories').getList(1, 50, {
			filter: `room = "${roomId}"`,
			sort: 'story_status,-created'
		});

		return (await storiesInRoom).items.map((record) => {
			return {
				id: record.id,
				room: record.room,
				details: record.details,
				story_status: record.story_status,
				created: record.created,
				story_estimates: record.story_estimates
			};
		});
	} catch (err) {
		console.error('Failed to get stories for room ', roomId, err);
		throw err;
	}
}

export function subscribeToStoryUpdates(storyId: string, callback: (record: Story) => void) {
	pb.collection('stories').subscribe(storyId, function (e) {
		if (e.action === 'update') {
			console.log('Story Update Subscription Hit:', e);
			callback({
				id: e.record.id,
				room: e.record.room,
				details: e.record.details,
				story_status: e.record.story_status,
				created: e.record.created,
				story_estimates: e.record.story_estimates
			});
		}
	});
}

export async function setStoryStatus(storyId: string, story_status: StoryStatus) {
	try {
		const storyData = await getStoryById(storyId);
		const record = await pb
			.collection('stories')
			.update(storyId, { ...storyData, story_status: story_status });
		console.log(`Set story ${storyId} status to ${status}`, record);
	} catch (err) {
		console.error('Failed to set story status', err);
		throw err;
	}
}

export async function setStoryCompleted(storyId: string, completed: boolean) {
	try {
		const storyData = await getStoryById(storyId);
		const record = await pb
			.collection('stories')
			.update(storyId, { ...storyData, completed: completed });
		console.log(`Set story ${storyId} completed to ${completed}`, record);
	} catch (err) {
		console.error('Failed to set active story in room', err);
		throw err;
	}
}

export function unsubscribeToStoryUpdates() {
	pb.collection('stories').unsubscribe();
}
