import pb from '$lib/pocketbase';

export interface Estimate {
	id: string;
	storyId: string;
	estimate: string;
	user: string;
}

export async function getEstimateById(estimateId: string): Promise<Estimate> {
	const estimate = await pb.collection('story_estimates').getOne(estimateId);
	console.log('Got estimate by id', estimateId, estimate);
	return {
		id: estimate.id,
		storyId: estimate.story,
		estimate: estimate.estimate,
		user: estimate.user
	};
}

export async function getEstimatesByStory(storyId: string): Promise<Estimate[]> {
	// you can also fetch all records at once via getFullList
	try {
		const storyEstimates = await pb.collection('story_estimates').getFullList({
			filter: `story = "${storyId}"`,
			sort: '-created'
		});
		return storyEstimates.map((estimate) => {
			return {
				id: estimate.id,
				storyId: estimate.story,
				estimate: estimate.estimate,
				user: estimate.user
			};
		});
	} catch (err) {
		console.warn('Unable to find any story estimates', err);
		throw err;
	}
}

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

export async function createOrUpdateEstimate(storyId: string, vote: string): Promise<Estimate> {
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

			// TODO this causes bugs
			// Remove the estimate for a sec to force refresh on the client
			await pb.collection('stories').update(storyId, {
				'story_estimates-': newEstimate.id
			});
			console.log('Updated existing estimate', newEstimate);
		} else {
			// Create new estimate
			newEstimate = await pb.collection('story_estimates').create({
				story: storyId,
				estimate: vote,
				user: userId
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
			user: newEstimate.expand?.user
		};
	} catch (err) {
		console.error('Could not create estimate', err);
		throw err;
	}
}
