<script lang="ts">
	import { Check, RotateCcw } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import type { Estimate, StoryAction, StorySummary } from '$lib/scrum/types/refinement';
	import VoteSummary from './VoteSummary.svelte';

	let {
		activeStoryDetails,
		currentVotes,
		pointValues,
		totalParticipants,
		onTaskAction
	}: {
		activeStoryDetails: StorySummary | undefined;
		currentVotes: Estimate[];
		pointValues: string[];
		totalParticipants?: number;
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

	let hasNumericVotes = $derived(currentVotes.some((vote) => !isNaN(Number(vote.estimate))));
	// Everyone (2+ people) picked the same card
	let isConsensus = $derived(currentVotes.length > 1 && voteResults.size === 1);

	// Distribution rows in point-scale order, only for values that received votes
	let distribution = $derived.by(() => {
		const maxCount = Math.max(1, ...voteResults.values());
		return pointValues
			.filter((val) => voteResults.has(val))
			.map((value) => {
				const count: number = voteResults.get(value);
				return {
					value: value.trim(),
					count,
					percent: (count / currentVotes.length) * 100,
					width: (count / maxCount) * 100,
					isTop: mostVotes.includes(value)
				};
			});
	});
</script>

<Card class="overflow-hidden" data-testid="vote-summary">
	<div
		class="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-5 py-3 text-sm sm:px-8"
	>
		<h2 class="text-sm font-semibold tracking-normal">Vote Summary</h2>
		<span class="tabular-nums text-foreground-secondary">
			{currentVotes.length}
			{currentVotes.length === 1 ? 'vote' : 'votes'}{totalParticipants
				? ` from ${totalParticipants} ${totalParticipants === 1 ? 'person' : 'people'}`
				: ''}
		</span>
	</div>

	<div class="p-5 sm:p-8">
		<p class="text-sm font-medium text-muted-foreground">Current story</p>
		<h3
			class="mt-1 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl"
		>
			{activeStoryDetails?.details}
		</h3>

		<div class="mt-8">
			<VoteSummary
				topVote={mostVotes.map((vote: string) => vote.trim())}
				averageVote={hasNumericVotes ? averageVote : undefined}
				consensus={isConsensus}
			/>
		</div>

		<div class="mt-8">
			<h4 class="mb-3 text-sm font-medium text-foreground-secondary">How people voted</h4>
			<ul class="space-y-2.5">
				{#each distribution as row, index (row.value)}
					<li class="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3">
						<span
							class="text-right text-lg font-semibold tabular-nums {row.isTop
								? 'text-primary'
								: 'text-foreground'}">{row.value}</span
						>
						<div class="h-7 overflow-hidden rounded-md bg-muted">
							<div
								class="h-full origin-left animate-bar-in rounded-md {row.isTop
									? 'bg-primary'
									: 'bg-foreground/25'}"
								style="width: {row.width}%; animation-delay: {80 + index * 40}ms"
							></div>
						</div>
						<span class="w-20 text-sm tabular-nums text-muted-foreground">
							{row.count}
							{row.count === 1 ? 'vote' : 'votes'}
							<span class="sr-only">({row.percent.toFixed(0)}%)</span>
						</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="mt-8 flex flex-col gap-2 border-t pt-6 sm:flex-row">
			<Button
				size="lg"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'MARK_REVIEWED')}
			>
				<Check aria-hidden="true" />Mark as done
			</Button>
			<Button
				size="lg"
				variant="outline"
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'START_VOTING')}
			>
				<RotateCcw aria-hidden="true" />Vote again
			</Button>
		</div>
	</div>
</Card>
