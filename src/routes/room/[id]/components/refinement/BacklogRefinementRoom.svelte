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
	import { ListPlus } from 'lucide-svelte';

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
		if (parentRoomId) refinementMetadata = await getRefinementMetadataDetails(parentRoomId);
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

<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<!-- Current story: front and center -->
	<section aria-label="Current story" class="min-w-0">
		{#if refinementMetadata?.room_status === 'REVIEWING'}
			<ReviewingCard
				{activeStoryDetails}
				{currentVotes}
				{pointValues}
				totalParticipants={participants.length}
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
		{:else}
			<div
				class="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
				>
					<ListPlus class="h-6 w-6" aria-hidden="true" />
				</div>
				<h2 class="text-lg">No story is being estimated</h2>
				<p class="mt-1 max-w-sm text-foreground-secondary">
					Add stories to the queue, then press <span class="font-medium text-foreground"
						>Start voting</span
					> on the one you want to estimate.
				</p>
			</div>
		{/if}
	</section>

	<aside class="min-w-0 space-y-4">
		<section class="rounded-xl border bg-card p-4 shadow-soft" aria-labelledby="stories-heading">
			<h2 id="stories-heading" class="mb-3 text-base">Stories</h2>
			<CreateTaskForm {refinementMetadataId} {roomPassword} />
			<div class="mt-4">
				<TaskTabs
					{stories}
					activeStoryId={activeStoryDetails?.id}
					onTaskAction={handleTaskAction}
				/>
			</div>
		</section>

		<ParticipantList
			currentUser={userParticipant}
			{participants}
			{currentVotes}
			{showOtherParticipantVotes}
			{roomPassword}
			trackVotes={refinementMetadata?.room_status === 'VOTING' ||
				refinementMetadata?.room_status === 'REVIEWING'}
		/>
	</aside>
</div>
