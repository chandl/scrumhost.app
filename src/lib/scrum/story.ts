import pb from '$lib/pocketbase/pocketbase';
import type { StoryDetails, StoryStatus, StoryWithEstimates } from '$lib/scrum/types';

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

export async function getStoryById(storyId: string): Promise<StoryDetails> {
	const story = await pb.collection('stories').getOne(storyId);
	console.log('Got story by id', storyId, story);
	return {
		id: story.id,
		room: story.room,
		details: story.details,
		story_status: story.story_status,
		created: story.created,
		story_estimates: story.story_estimates,
		updated: story.updated
	};
}

export async function getStoryWithEstimatesById(storyId: string): Promise<StoryWithEstimates> {
	try {
		const response = await pb.collection('stories').getOne(storyId, {
			expand: 'story_estimates',
			fields:
				'id,details,story_status,' +
				'expand.story_estimates.id,expand.story_estimates.participant,expand.story_estimates.user,' +
				'expand.story_estimates.estimate'
		});

		return {
			id: response.id,
			details: response.details,
			story_status: response.story_status,
			story_estimates: response.expand?.story_estimates,
			updated: response.updated
		};
	} catch (err) {
		console.error('Failed to get story with estimates', err);
		throw err;
	}
}

export function subscribeToStoryUpdates(
	storyId: string,
	callback: (record: StoryWithEstimates) => void
) {
	pb.collection('stories').subscribe(
		storyId,
		function (e) {
			if (e.action === 'update') {
				console.log('Story Update Subscription Hit:', e);
				callback({
					id: e.record.id,
					details: e.record.details,
					story_status: e.record.story_status,
					story_estimates: e.record.expand?.story_estimates,
					updated: e.record.updated
				});
			}
		},
		{
			expand: 'story_estimates',
			fields:
				'id,details,story_status,' +
				'expand.story_estimates.id,expand.story_estimates.participant,expand.story_estimates.user,' +
				'expand.story_estimates.estimate'
		}
	);
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

export function unsubscribeToStoryUpdates() {
	pb.collection('stories').unsubscribe();
}
