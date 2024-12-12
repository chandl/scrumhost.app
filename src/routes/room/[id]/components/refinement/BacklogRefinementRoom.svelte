<script lang="ts">
	import ReviewingCard from './ReviewingCard.svelte';
	import VotingCard from './VotingCard.svelte';
	import CreateTaskForm from './CreateTaskForm.svelte';
	import ParticipantList from './ParticipantList.svelte';
	import TaskTabs from './TaskTabs.svelte';
	import { page } from '$app/stores';
	import {
		getStoryWithEstimatesById,
		setStoryStatus,
		subscribeToStoryUpdates,
		unsubscribeToStoryUpdates
	} from '$lib/scrum/story';
	import { deleteEstimates } from '$lib/scrum/estimates';
	import { onMount } from 'svelte';
	import {
		getRefinementMetadataDetails,
		setActiveStory,
		setRefinementMetadataStatus,
		subscribeToRefinementMetadataUpdates
	} from '$lib/scrum/refinement';
	import type {
		Estimate,
		RefinementMetadataDetails,
		RefinementRoomStatus,
		StoryAction,
		StorySummary
	} from '$lib/scrum/types/refinement';
	import type { Participant, RoomDetails } from '$lib/scrum/types/room';
	import { decryptString } from '$lib/crypto';

	let {
		parentRoom,
		participants,
		userParticipant,
		roomPassword
	}: {
		parentRoom: RoomDetails | undefined;
		participants: Participant[];
		userParticipant: Participant | undefined;
		roomPassword: string;
	} = $props();

	const parentRoomId = $page.params.id;
	let refinementMetadata: RefinementMetadataDetails | undefined = $state();
	let refinementMetadataId: string = $derived(refinementMetadata?.id || 'UNKNOWN');

	let stories: StorySummary[] = $state([]);

	// eslint-disable-next-line
	// @ts-ignore
	$effect(async () => {
		if (!parentRoom || !refinementMetadata?.stories) {
			return [];
		}
		// Sort the stories by updated time
		const sorted = [...refinementMetadata.stories].sort(
			(a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
		);
		const decryptedStories: StorySummary[] = [];
		for (const story of sorted) {
			const decryptedDetails = await decryptString(roomPassword, story.details);
			decryptedStories.push({
				...story,
				details: decryptedDetails
			});
		}
		stories = decryptedStories;
	});
	let activeStoryDetails: StorySummary | undefined = $derived.by(() => {
		if (!refinementMetadata?.active_story) {
			return undefined;
		}
		console.log('ACTIVE STORY UPDATED', refinementMetadata?.active_story);
		return stories.find((story) => story.id == refinementMetadata?.active_story);
	});

	let currentVotes: Estimate[] = $state([]);
	let showOtherParticipantVotes: boolean = $derived(
		refinementMetadata?.room_status === 'REVIEWING'
	);

	onMount(async () => {
		refinementMetadata = await getRefinementMetadataDetails(parentRoomId);
		console.log('Initializing refinement metadata to', refinementMetadata);
		subscribeToRefinementMetadataUpdates(refinementMetadataId, (updatedMetadata) => {
			console.log('Received updated refinement metadata:', updatedMetadata);
			refinementMetadata = updatedMetadata;
		});
	});

	// eslint-disable-next-line
	// @ts-ignore
	$effect(async () => {
		if (activeStoryDetails == undefined) {
			console.log('Unsubscribing to all story updates');
			unsubscribeToStoryUpdates();
			currentVotes = [];
		} else {
			let storyWithVotes = await getStoryWithEstimatesById(activeStoryDetails.id);
			console.log('Set currentVotes to', storyWithVotes.story_estimates);
			currentVotes = storyWithVotes.story_estimates;

			console.log('Subscribing to story updates for', activeStoryDetails.id);
			subscribeToStoryUpdates(activeStoryDetails.id, (storyWithEstimates) => {
				currentVotes = storyWithEstimates.story_estimates;
				console.log('Set currentVotes to', storyWithEstimates.story_estimates);
			});
		}
	});

	async function updateRoomState(roomState: RefinementRoomStatus) {
		await setRefinementMetadataStatus(refinementMetadataId, roomState);
	}

	async function handleTaskAction(taskId: string, taskAction: StoryAction) {
		if (taskAction == 'START_VOTING') {
			// TODO check if voting enabled
			await setStoryStatus(taskId, 'QUEUED');
			await setActiveStory(refinementMetadataId, taskId);
			await updateRoomState('VOTING');
		} else if (taskAction === 'REQUEUE') {
			// TODO only allow this if it's not in QUEUED state
			await setStoryStatus(taskId, 'QUEUED');

			if (refinementMetadata?.active_story == taskId) {
				// Stop voting
				await setActiveStory(refinementMetadataId, null);
				await setRefinementMetadataStatus(refinementMetadataId, 'IDLE');
			} else {
				// Trigger room refresh if re-queueing 'skipped' task
				await setActiveStory(refinementMetadataId, refinementMetadata?.active_story || null);
			}
		} else if (taskAction === 'MARK_REVIEWED') {
			if (refinementMetadata?.active_story == taskId) {
				await setStoryStatus(taskId, 'REVIEWED');

				// Stop voting
				await setActiveStory(refinementMetadataId, null);
				await setRefinementMetadataStatus(refinementMetadataId, 'IDLE');
			}
		} else if (taskAction === 'SKIP') {
			await setStoryStatus(taskId, 'SKIPPED');

			if (refinementMetadata?.active_story == taskId) {
				// Stop voting
				await setActiveStory(refinementMetadataId, null);
				await setRefinementMetadataStatus(refinementMetadataId, 'IDLE');
			} else {
				// Trigger room refresh if skipping 'queued' task
				await setActiveStory(refinementMetadataId, refinementMetadata?.active_story || null);
			}
		} else if (taskAction === 'REVIEW_RESULTS') {
			await setActiveStory(refinementMetadataId, taskId);
			await setRefinementMetadataStatus(refinementMetadataId, 'REVIEWING');
		} else if (taskAction === 'CLEAR_VOTES') {
			console.log('Clearing all votes for task', taskId);
			await deleteEstimates(taskId, currentVotes);
		}
	}
	const pointValues: string[] = $derived(refinementMetadata?.point_values.split(',') || []);
</script>

<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
	<div class=" md:col-span-2">
		<!-- Vote and Review Votes -->
		<div class="mb-4">
			{#if refinementMetadata?.room_status === 'REVIEWING'}
				<!-- New Section: Voting Summary -->
				<ReviewingCard
					{activeStoryDetails}
					{currentVotes}
					{pointValues}
					onTaskAction={handleTaskAction}
				/>
			{:else if refinementMetadata?.room_status === 'VOTING'}
				<VotingCard
					roomStatus={'VOTING'}
					{activeStoryDetails}
					{currentVotes}
					{participants}
					{userParticipant}
					{pointValues}
					onTaskAction={handleTaskAction}
				/>
			{/if}
		</div>

		<!-- Create and List Tasks -->
		<div>
			<CreateTaskForm {refinementMetadataId} {roomPassword} />
			<TaskTabs {stories} activeStoryId={activeStoryDetails?.id} onTaskAction={handleTaskAction} />
		</div>
	</div>

	<div>
		<ParticipantList
			currentUser={userParticipant}
			{participants}
			{currentVotes}
			{showOtherParticipantVotes}
			{roomPassword}
		/>
	</div>
</div>
