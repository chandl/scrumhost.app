<script lang="ts">
	import ReviewingCard from './ReviewingCard.svelte';
	import VotingCard from './VotingCard.svelte';
	import CreateTaskForm from './CreateTaskForm.svelte';
	import ParticipantList from './ParticipantList.svelte';
	import TaskTabs from './TaskTabs.svelte';
	import type {
		Estimate,
		Participant,
		RoomState,
		RoomSummary,
		StoryAction,
		StorySummary
	} from '$lib/scrum/types';
	import {
		getStoryWithEstimatesById,
		setStoryStatus,
		subscribeToStoryUpdates,
		unsubscribeToStoryUpdates
	} from '$lib/scrum/story';
	import { setActiveStory, setRoomState } from '$lib/scrum/room';
	import { deleteEstimates } from '$lib/scrum/estimates';

	let {
		room,
		participants,
		userParticipant
	}: {
		room: RoomSummary | undefined;
		participants: Participant[];
		userParticipant: Participant | undefined;
	} = $props();

	let stories: StorySummary[] = $derived.by(() => {
		if (!room || !room.stories) {
			return [];
		}
		// Sort the stories by updated time
		return [...room.stories].sort(
			(a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
		);
	});

	let activeStoryDetails: StorySummary | undefined = $derived.by(() => {
		if (!room?.active_story_id) {
			return undefined;
		}
		return stories.find((story) => story.id == room?.active_story_id);
	});

	let currentVotes: Estimate[] = $state([]);
	let showOtherParticipantVotes: boolean = $derived(room?.room_status === 'REVIEWING');
	let roomId = $derived(room?.id || '');

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

	async function updateRoomState(roomState: RoomState) {
		await setRoomState(roomId, roomState);
	}

	async function handleTaskAction(taskId: string, taskAction: StoryAction) {
		if (taskAction == 'START_VOTING') {
			// TODO check if voting enabled
			await setStoryStatus(taskId, 'QUEUED');
			await setActiveStory(roomId, taskId);
			await updateRoomState('VOTING');
		} else if (taskAction === 'REQUEUE') {
			// TODO only allow this if it's not in QUEUED state
			await setStoryStatus(taskId, 'QUEUED');

			if (room?.active_story_id == taskId) {
				// Stop voting
				await setActiveStory(roomId, null);
				await setRoomState(roomId, 'IDLE');
			} else {
				// Trigger room refresh if re-queueing 'skipped' task
				await setActiveStory(roomId, room?.active_story_id || null);
			}
		} else if (taskAction === 'MARK_REVIEWED') {
			if (room?.active_story_id == taskId) {
				await setStoryStatus(taskId, 'REVIEWED');

				// Stop voting
				await setActiveStory(roomId, null);
				await setRoomState(roomId, 'IDLE');
			}
		} else if (taskAction === 'SKIP') {
			await setStoryStatus(taskId, 'SKIPPED');

			if (room?.active_story_id == taskId) {
				// Stop voting
				await setActiveStory(roomId, null);
				await setRoomState(roomId, 'IDLE');
			} else {
				// Trigger room refresh if skipping 'queued' task
				await setActiveStory(roomId, room?.active_story_id || null);
			}
		} else if (taskAction === 'REVIEW_RESULTS') {
			await setActiveStory(roomId, taskId);
			await setRoomState(roomId, 'REVIEWING');
		} else if (taskAction === 'CLEAR_VOTES') {
			console.log('Clearing all votes for task', taskId);
			await deleteEstimates(taskId, currentVotes);
		}
	}

	const pointValues: string[] = $derived(room?.point_values.split(',') || []);
</script>

<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
	<div class="space-y-8 md:col-span-2">
		<!-- Vote and Review Votes -->
		<div>
			{#if room?.room_status === 'REVIEWING'}
				<!-- New Section: Voting Summary -->
				<ReviewingCard
					{activeStoryDetails}
					{currentVotes}
					{pointValues}
					onTaskAction={handleTaskAction}
				/>
			{:else if room?.room_status === 'VOTING'}
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
			<CreateTaskForm {roomId} />
			<TaskTabs {stories} activeStoryId={activeStoryDetails?.id} onTaskAction={handleTaskAction} />
		</div>
	</div>

	<div class="mt-6">
		<ParticipantList
			currentUser={userParticipant}
			{participants}
			{currentVotes}
			{showOtherParticipantVotes}
		/>
	</div>
</div>
