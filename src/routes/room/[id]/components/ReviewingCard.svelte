<script lang="ts">
	import { Check, CornerDownLeft } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Estimate, StoryAction, StorySummary } from '$lib/scrum/types/refinement';

	let {
		activeStoryDetails,
		currentVotes,
		pointValues,
		onTaskAction
	}: {
		activeStoryDetails: StorySummary | undefined;
		currentVotes: Estimate[];

		pointValues: string[];
		onTaskAction: (taskId: string, taskAction: StoryAction) => void;
	} = $props();
</script>

<Card class="rounded-lg border border-gray-200 shadow-lg">
	<CardHeader class="rounded-t-lg border-b border-gray-300 bg-gray-100 pb-4">
		<CardTitle class="text-lg font-semibold text-gray-800">Vote Summary</CardTitle>
	</CardHeader>
	<CardContent class="flex flex-col items-start px-6">
		<!-- Task Description with Separation -->
		<div class="mb-6 w-full rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 shadow-md">
			<h3 class="text-3xl font-semibold text-gray-800">{activeStoryDetails?.details}</h3>
		</div>
		<p class="mb-4 text-lg text-gray-600">Vote Distribution:</p>

		{#each pointValues.filter((val) => currentVotes
				.map((vote) => vote.estimate)
				.includes(val)) as value}
			<div class="mb-4 flex w-full items-center justify-between">
				<span class="text-lg text-gray-700">{value}</span>
				<div class="mx-4 h-3 w-full max-w-xs rounded-full bg-gray-200">
					<div
						class="h-full rounded-full bg-blue-500"
						style="width: {(currentVotes.filter((vote) => vote.estimate === value).length /
							currentVotes.length) *
							100}%"
					></div>
				</div>
				<span class="text-sm text-gray-500"
					>{currentVotes.filter((vote) => vote.estimate === value).length} vote(s) - {(
						(currentVotes.filter((vote) => vote.estimate === value).length / currentVotes.length) *
						100
					).toFixed(0)}%</span
				>
			</div>
		{/each}

		<!-- Side-by-Side Action Buttons Section -->
		<div class="mt-6 flex w-full flex-wrap space-x-2">
			<!-- Mark as Reviewed Button -->
			<Button
				size="lg"
				class="mt-2 flex w-full items-center justify-start bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 sm:w-auto"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'MARK_REVIEWED')}
			>
				<Check class="mr-2 h-5 w-5" />Finish Reviewing
			</Button>

			<!-- Continue Voting Button -->
			<Button
				size="lg"
				variant="outline"
				class="mt-2 w-full border-gray-300 text-gray-700 hover:bg-gray-100 sm:w-auto"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'START_VOTING')}
			>
				<CornerDownLeft class="mr-2 h-5 w-5" />Continue Voting
			</Button>
		</div>
	</CardContent>
</Card>
