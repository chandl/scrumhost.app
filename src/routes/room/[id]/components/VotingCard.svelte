<script lang="ts">
	import { ClipboardCheck, CornerDownLeft, Eraser } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import Progress from '../../../../lib/components/ui/progress/progress.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type {
		Estimate,
		Participant,
		RoomState,
		StoryAction,
		StorySummary
	} from '$lib/scrum/types';
	import { createOrUpdateEstimate } from '$lib/scrum/estimates';

	let {
		roomStatus,
		activeStoryDetails,
		currentVotes,
		participants,
		userParticipant,
		pointValues,
		onTaskAction
	}: {
		roomStatus: RoomState;
		activeStoryDetails: StorySummary | undefined;
		currentVotes: Estimate[];
		participants: Participant[];
		userParticipant: Participant | undefined;
		pointValues: string[];
		onTaskAction: (taskId: string, taskAction: StoryAction) => void;
	} = $props();

	let voteProgress = $derived(((currentVotes?.length || 0) / participants.length) * 100);
	let userVoteValue: string | undefined = $derived(
		!currentVotes
			? undefined
			: currentVotes.find((vote) => vote.participant === userParticipant?.id)?.estimate
	);
	let votingEnabled: boolean = $derived.by(() => roomStatus == 'VOTING');

	async function handleVote(vote: string) {
		console.log(`Voting for story ${activeStoryDetails?.id} with vote ${vote}`);
		await createOrUpdateEstimate(userParticipant?.id || '', activeStoryDetails?.id || '', vote);
	}
</script>

<Card class="mt-6 rounded-lg border border-gray-200 shadow-lg">
	<!-- Card Header (Toolbar style) -->
	<CardHeader class="rounded-t-lg border-b border-gray-300 bg-gray-100 pb-4">
		<CardTitle class="text-lg font-semibold text-gray-800">Vote for Active Task</CardTitle>
	</CardHeader>

	<CardContent class="flex flex-col items-start px-6 py-4">
		<!-- Task Description with Separation -->
		<div class="mb-6 w-full rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 shadow-md">
			<h3 class="text-3xl font-semibold text-gray-800">{activeStoryDetails?.details}</h3>
		</div>

		<!-- Instruction Paragraph -->
		<p class="mb-8 text-lg text-gray-600">Please select an estimate for this task:</p>

		<!-- Voting Buttons Section -->
		<div class="mb-8 flex flex-wrap justify-center gap-3">
			{#each pointValues as value}
				<Button
					variant={userVoteValue === value ? 'default' : 'outline'}
					class="h-12 w-40 font-medium"
					on:click={() => handleVote(value)}
					disabled={!votingEnabled || activeStoryDetails?.story_status !== 'QUEUED'}
				>
					{value}
				</Button>
			{/each}
		</div>

		<!-- Progress Bar for Voting -->
		<div class=" w-full">
			<!-- Voting Progress Text -->
			<p class="mt-2 text-xl font-semibold text-gray-700">
				Vote Progress: <span class="text-blue-600">{voteProgress.toFixed(0)}%</span>
			</p>
			<Progress value={voteProgress} class="h-3 w-full bg-gray-200"></Progress>
		</div>

		<!-- Side-by-Side Action Buttons Section -->
		<div class="mt-6 flex w-full flex-wrap space-x-2">
			<!-- Mark as Reviewed Button -->
			<Button
				size="lg"
				disabled={(currentVotes?.length || 0) === 0}
				class="mt-2 bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 "
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'REVIEW_RESULTS')}
			>
				<ClipboardCheck class="mr-2 h-5 w-5" /> Start Reviewing
			</Button>

			<!-- Clear Votes Button -->
			<Button
				size="lg"
				variant="outline"
				disabled={(currentVotes?.length || 0) === 0}
				class="mt-2 border-gray-300 text-gray-700 hover:bg-gray-100"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'CLEAR_VOTES')}
			>
				<Eraser class="mr-2 h-5 w-5" /> Clear Votes
			</Button>

			<!-- Put Back in Queue Button -->
			<Button
				size="lg"
				variant="outline"
				class="mt-2 border-gray-300 text-gray-700 hover:bg-gray-100"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'REQUEUE')}
			>
				<CornerDownLeft class="mr-2 h-5 w-5" /> Re-Queue
			</Button>
		</div>
	</CardContent>
</Card>
