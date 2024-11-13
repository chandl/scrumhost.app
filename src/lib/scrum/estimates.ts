import pb from '$lib/pocketbase/pocketbase';
import type { Estimate } from '$lib/scrum/types';

export async function getEstimateByStoryAndUser(storyId: string, userId: string) {
	// you can also fetch all records at once via getFullList
	try {
		const userStoryEstimate = await pb
			.collection('story_estimates')
			.getFirstListItem(`story = "${storyId}" && user = "${userId}"`);
		return userStoryEstimate;
	} catch (err) {
		console.warn('Unable to find current user story estimate', err);
	}
}

export async function deleteEstimates(storyId: string, currentEstimates: Estimate[]) {
	for (const est of currentEstimates) {
		console.log('Deleting estimate', est.id);
		await pb.collection('story_estimates').delete(est.id);
	}

	const estimateIds = currentEstimates.map((est) => est.id);
	console.log('Updating story to remove estimates', storyId);
	await pb.collection('stories').update(storyId, {
		'story_estimates-': estimateIds
	});
}

export async function createOrUpdateEstimate(
	participantId: string,
	storyId: string,
	vote: string
): Promise<Estimate> {
	try {
		const userId = pb.authStore.model?.id;

		const existingEstimate = await getEstimateByStoryAndUser(storyId, userId);

		let newEstimate;
		if (existingEstimate) {
			console.log('Found existing Estimate', existingEstimate);
			newEstimate = await pb.collection('story_estimates').update(existingEstimate.id, {
				...existingEstimate,
				estimate: vote
			});

			console.log('Updated existing estimate', newEstimate);
		} else {
			// Create new estimate
			newEstimate = await pb.collection('story_estimates').create({
				story: storyId,
				estimate: vote,
				user: userId,
				participant: participantId
			});
			console.log('Created new estimate:', newEstimate);
		}

		// Make the update on the story itself too
		await pb.collection('stories').update(storyId, {
			'story_estimates+': newEstimate.id
		});

		return {
			id: newEstimate.id,
			storyId: newEstimate.expand?.story,
			estimate: newEstimate.expand?.estimate,
			user: newEstimate.expand?.user,
			participant: newEstimate.expand?.participant
		};
	} catch (err) {
		console.error('Could not create estimate', err);
		throw err;
	}
}
