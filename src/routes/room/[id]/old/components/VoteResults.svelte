<script lang="ts">
	import { getEstimateById, getEstimatesByStory } from '$lib/scrum/estimates';
	import { subscribeToStoryUpdates, unsubscribeToStoryUpdates } from '$lib/scrum/story';
	import type { Estimate, Participant, StoryDetails } from '$lib/scrum/types';

	let { currentStory, participants }: { currentStory: string; participants: Participant[] } =
		$props();

	let currentEstimates: Estimate[] = $state([]);

	async function updateEstimates(currentStory: string) {
		currentEstimates = await getEstimatesByStory(currentStory);
	}

	function handleStoryUpdates(update: StoryDetails) {
		console.log('story update', update);
		// Removing estimates that need to be removed
		const to_remove_ids = new Set();
		currentEstimates.forEach((currEst) => {
			if (!update.story_estimates.find((newEst) => newEst == currEst.id)) {
				to_remove_ids.add(currEst.id);
			}
		});

		// Remove the estimates that should be removed
		currentEstimates = currentEstimates.filter((est) => !to_remove_ids.has(est.id));

		// Adding new estimates now
		update.story_estimates.forEach(async (updatedEst) => {
			if (!currentEstimates.find((currEst) => currEst.id == updatedEst)) {
				const newEstimate = await getEstimateById(updatedEst);
				currentEstimates = [newEstimate, ...currentEstimates];
			}
		});
	}

	$effect(() => {
		unsubscribeToStoryUpdates();
		updateEstimates(currentStory);
		if (currentStory) {
			subscribeToStoryUpdates(currentStory, (update) => {
				handleStoryUpdates(update);
			});
		}
	});

	function getParticipantName(userId: string) {
		console.log('participants', participants, 'user', userId);
		return participants?.find((person) => person.userId == userId)?.name;
	}
</script>

<h1>Vote Results</h1>

<ul>
	{#each currentEstimates as estimate}
		<li>
			Participant: {getParticipantName(estimate?.user)} - Vote: {estimate?.estimate}
		</li>
	{/each}
</ul>
