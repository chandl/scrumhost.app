<script lang="ts">
	import { Check, CornerDownLeft } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import type { Estimate, StoryAction, StorySummary } from '$lib/scrum/types/refinement';
	import VoteSummary from './VoteSummary.svelte';

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

	// { value, votes }
	let voteResults = $derived.by(() => {
		let results = new Map();
		currentVotes.forEach((vote) => {
			if (!results.has(vote.estimate)) {
				results.set(vote.estimate, 0);
			}

			results.set(vote.estimate, results.get(vote.estimate) + 1);
		});

		return results;
	});

	let averageVote = $derived.by(() => {
		let sum = 0;
		let voteCount = 0;

		for (const [vote, count] of voteResults.entries()) {
			if (isNaN(Number(vote))) {
				// Can't average votes if the vote is non-numeric (e.g. T-Shirt Size)
				continue;
			}
			sum += vote * count;
			voteCount += count;
		}
		if (voteCount == 0) {
			return 0;
		}
		return sum / voteCount;
	});

	let mostVotes = $derived.by(() => {
		if (voteResults.size === 0) {
			return []; // Return an empty array if the map is empty
		}

		let maxCount = -Infinity;
		const topVotes: string[] = [];

		for (const [vote, count] of voteResults) {
			if (count > maxCount) {
				maxCount = count;
				topVotes.length = 0; // Clear the array for new max count
				topVotes.push(vote);
			} else if (count === maxCount) {
				topVotes.push(vote);
			}
		}

		return topVotes.sort((a: any, b: any) => a - b); // eslint-disable-line
	});
</script>

<Card class="rounded-lg border border-gray-200 shadow-lg dark:border-gray-800">
	<CardHeader class="rounded-t-lg border-b border-gray-300 bg-gray-100 pb-4 dark:bg-gray-900">
		<CardTitle class="text-lg font-semibold text-gray-800 dark:text-gray-200"
			>Vote Summary</CardTitle
		>
	</CardHeader>
	<CardContent class="flex flex-col items-start px-6">
		<!-- Task Description with Separation -->
		<div
			class="mb-6 w-full rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 shadow-md dark:bg-gray-900"
		>
			<h3 class="text-3xl font-semibold text-gray-800 dark:text-gray-200">
				{activeStoryDetails?.details}
			</h3>
		</div>
		<VoteSummary topVote={mostVotes} {averageVote} />
		<p class="mb-4 text-lg text-gray-600 dark:text-gray-200">Vote Distribution:</p>

		{#each pointValues.filter((val) => currentVotes
				.map((vote) => vote.estimate)
				.includes(val)) as value}
			<div class="mb-4 flex w-full items-center justify-between">
				<span class="text-lg text-gray-700 dark:text-gray-200">{value}</span>
				<div class="mx-4 h-3 w-full max-w-xs rounded-full bg-gray-200">
					<div
						class="h-full rounded-full bg-blue-500"
						style="width: {(currentVotes.filter((vote) => vote.estimate === value).length /
							currentVotes.length) *
							100}%"
					></div>
				</div>
				<span class="text-sm text-gray-500 dark:text-gray-200"
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
				class="mt-2 flex w-full items-center justify-start bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 dark:bg-blue-700 hover:dark:bg-blue-600 sm:w-auto"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'MARK_REVIEWED')}
			>
				<Check class="mr-2 h-5 w-5" />Finish Reviewing
			</Button>

			<!-- Continue Voting Button -->
			<Button
				size="lg"
				variant="outline"
				class="mt-2 w-full border-gray-300 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'START_VOTING')}
			>
				<CornerDownLeft class="mr-2 h-5 w-5" />Continue Voting
			</Button>
		</div>
	</CardContent>
</Card>
