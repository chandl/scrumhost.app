import pb from '$lib/pocketbase/pocketbase';

import type { StoryStatus, StoryWithEstimates } from '$lib/scrum/types/refinement';

export async function createStory(details: string, refinementMetadataId: string) {
	const data = {
		refinement_metadata: refinementMetadataId,
		details: details,
		story_status: 'QUEUED',
		author: pb.authStore.model?.id
	};

	const record = await pb.collection('stories').create(data);
	console.log('Created story:', record);

	// add to room record
	await pb.collection('refinement_metadata').update(refinementMetadataId, {
		'stories+': record.id
	});
	return record;
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
		const record = await pb.collection('stories').update(storyId, { story_status: story_status });
		console.log(`Set story ${storyId} status to ${story_status}`, record);
	} catch (err) {
		console.error('Failed to set story status', err);
		throw err;
	}
}

export function unsubscribeToStoryUpdates() {
	pb.collection('stories').unsubscribe();
}
