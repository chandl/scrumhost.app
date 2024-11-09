import pb from '$lib/pocketbase';

export async function createStory(details: string, roomId: string) {
	const data = {
		room: roomId,
		details: details,
		completed: false
	};

	const record = await pb.collection('stories').create(data);
	console.log('Created story:', record);

	// add to room record
	await pb.collection('rooms').update(roomId, {
		'stories+': record.id
	});
	return record;
}

export interface Story {
	id: string;
	room: string;
	details: string;
	completed: boolean;
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
		completed: story.completed,
		created: story.created,
		story_estimates: story.story_estimates
	};
}

export async function getStoriesInRoom(roomId: string): Promise<Story[]> {
	// TODO just look at the 'stories' field in room
	try {
		const storiesInRoom = pb.collection('stories').getList(1, 50, {
			filter: `room = "${roomId}"`,
			sort: 'completed,-created'
		});

		return (await storiesInRoom).items.map((record) => {
			return {
				id: record.id,
				room: record.room,
				details: record.details,
				completed: record.completed,
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
				completed: e.record.completed,
				created: e.record.created,
				story_estimates: e.record.story_estimates
			});
		}
	});
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
