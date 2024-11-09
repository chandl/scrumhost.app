import pb from '$lib/pocketbase';

export async function createStory(details: string, roomId: string) {
	const data = {
		room: roomId,
		details: details,
		completed: false,
		final_estimate: null,
		estimation_time: null
	};

	const record = await pb.collection('stories').create(data);
	console.log('Created story:', record);
	return record;
}

export interface Story {
	id: string;
	room: string;
	details: string;
	completed: boolean;
	final_estimate: string;
	estimation_time: string;
	created: string;
}

export async function getStoriesInRoom(roomId: string): Promise<Story[]> {
	try {
		const storiesInRoom = pb.collection('stories').getList(1, 50, {
			filter: `room = "${roomId}"`,
			sort: '-created'
		});

		return (await storiesInRoom).items.map((record) => {
			return {
				id: record.id,
				room: record.room,
				details: record.details,
				completed: record.completed,
				final_estimate: record.final_estimate,
				estimation_time: record.estimation_time,
				created: record.created
			};
		});
	} catch (err) {
		console.error('Failed to get stories for room ', roomId, err);
		throw err;
	}
}

export function subscribeToNewStories(roomId: string, callback: (record: Story) => void) {
	// TODO create specific view for this that only shows user's stories
	pb.collection('stories').subscribe('*', function (e) {
		if (e.action === 'create' && e.record.room == roomId) {
			console.log('Story Subscription Hit:', e);
			callback({
				id: e.record.id,
				room: e.record.room,
				details: e.record.details,
				completed: e.record.completed,
				final_estimate: e.record.final_estimate,
				estimation_time: e.record.estimation_time,
				created: e.record.created
			});
		}
	});
}
