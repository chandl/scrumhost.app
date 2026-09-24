<script lang="ts">
	import { CornerDownLeft, Eraser, Eye } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import Progress from '../../../../../lib/components/ui/progress/progress.svelte';
	import { Button } from '$lib/components/ui/button';
	import { createOrUpdateEstimate } from '$lib/scrum/estimates';
	import type {
		Estimate,
		RefinementRoomStatus,
		StoryAction,
		StorySummary
	} from '$lib/scrum/types/refinement';
	import type { Participant } from '$lib/scrum/types/room';

	let {
		roomStatus,
		activeStoryDetails,
		currentVotes,
		participants,
		userParticipant,
		pointValues,
		onTaskAction
	}: {
		roomStatus: RefinementRoomStatus;
		activeStoryDetails: StorySummary | undefined;
		currentVotes: Estimate[];
		participants: Participant[];
		userParticipant: Participant | undefined;
		pointValues: string[];
		onTaskAction: (taskId: string, taskAction: StoryAction) => void;
	} = $props();

	let votedCount = $derived(currentVotes?.length || 0);
	let voteProgress = $derived((votedCount / Math.max(participants.length, 1)) * 100);
	// Optimistic vote shown immediately while the server round trips complete
	let pendingVote: { storyId: string | undefined; value: string } | undefined = $state();
	let serverVoteValue: string | undefined = $derived(
		!currentVotes
			? undefined
			: currentVotes.find((vote) => vote.participant === userParticipant?.id)?.estimate
	);
	let userVoteValue: string | undefined = $derived(
		pendingVote && pendingVote.storyId === activeStoryDetails?.id
			? pendingVote.value
			: serverVoteValue
	);
	let votingEnabled: boolean = $derived.by(() => roomStatus == 'VOTING');

	let votingDisabled = $derived(!votingEnabled || activeStoryDetails?.story_status !== 'QUEUED');

	// Keyboard voting: arrow keys move between cards, number/"?" keys vote directly.
	let voteButtons: HTMLButtonElement[] = $state([]);

	function handleCardKeydown(event: KeyboardEvent, index: number) {
		const last = pointValues.length - 1;
		let next: number | undefined;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
			next = index === last ? 0 : index + 1;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
			next = index === 0 ? last : index - 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = last;
		if (next !== undefined) {
			event.preventDefault();
			voteButtons[next]?.focus();
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (votingDisabled || event.metaKey || event.ctrlKey || event.altKey) return;
		const target = event.target as HTMLElement | null;
		if (
			target?.closest(
				'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="alertdialog"], [role="tablist"]'
			)
		) {
			return;
		}
		const index = pointValues.findIndex((value) => value.trim() === event.key);
		if (index === -1) return;
		event.preventDefault();
		handleVote(pointValues[index]);
		voteButtons[index]?.focus();
	}

	async function handleVote(vote: string) {
		console.log(`Voting for story ${activeStoryDetails?.id} with vote ${vote}`);
		const storyId = activeStoryDetails?.id;
		pendingVote = { storyId, value: vote };
		try {
			await createOrUpdateEstimate(userParticipant?.id || '', storyId || '', vote);
		} catch (err) {
			console.error('Vote failed, reverting', err);
		} finally {
			// Fall back to server state (the realtime update reflects the saved vote)
			if (pendingVote?.value === vote && pendingVote.storyId === storyId) pendingVote = undefined;
		}
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<Card class="overflow-hidden">
	<div
		class="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-5 py-3 text-sm sm:px-8"
	>
		<span class="inline-flex items-center gap-2 font-medium text-primary">
			<span class="h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
			Voting now
		</span>
		<span class="tabular-nums text-foreground-secondary" aria-live="polite">
			<span class="font-semibold text-foreground">{votedCount}</span> of {participants.length} voted
		</span>
	</div>

	<div class="p-5 sm:p-8">
		<p class="text-sm font-medium text-muted-foreground">Current story</p>
		<h2
			class="mt-1 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl"
		>
			{activeStoryDetails?.details}
		</h2>

		<Progress
			value={voteProgress}
			class="mt-6"
			aria-label="{votedCount} of {participants.length} voted"
		/>

		<div class="mt-8">
			<p id="vote-instructions" class="mb-3 text-sm text-foreground-secondary">
				Pick your estimate. Nobody sees it until the votes are revealed.
			</p>
			<div
				class="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] sm:gap-3"
				role="group"
				aria-describedby="vote-instructions"
				aria-label="Your estimate"
				data-testid="voting-buttons"
			>
				{#each pointValues as value, index}
					{@const selected = userVoteValue === value}
					<button
						bind:this={voteButtons[index]}
						type="button"
						data-testid={'vote-' + String(value).trim()}
						aria-pressed={selected}
						class="flex aspect-[4/5] min-h-16 items-center justify-center rounded-xl border-2 bg-card text-2xl font-semibold tabular-nums transition-[transform,border-color,background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:text-3xl {selected
							? '-translate-y-1 border-primary bg-primary/[0.07] text-primary shadow-lift'
							: 'border-border text-foreground hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-soft'}"
						onclick={() => handleVote(value)}
						onkeydown={(e) => handleCardKeydown(e, index)}
						disabled={votingDisabled}
					>
						{value.trim()}
					</button>
				{/each}
			</div>
			<p class="mt-3 hidden text-xs text-muted-foreground coarse:hidden sm:block">
				Tip: press a number key to vote, or use the arrow keys.
			</p>
		</div>

		<div class="mt-8 flex flex-col gap-2 border-t pt-6 sm:flex-row sm:flex-wrap sm:items-center">
			<Button
				data-testid="start-reviewing"
				size="lg"
				disabled={votedCount === 0}
				on:click={() => onTaskAction(activeStoryDetails?.id || '', 'REVIEW_RESULTS')}
			>
				<Eye aria-hidden="true" />Reveal votes
			</Button>
			<div class="flex gap-2 sm:ml-auto">
				<Button
					variant="ghost"
					class="flex-1 sm:flex-none"
					disabled={votedCount === 0}
					on:click={() => onTaskAction(activeStoryDetails?.id || '', 'CLEAR_VOTES')}
				>
					<Eraser aria-hidden="true" />Clear votes
				</Button>
				<Button
					variant="ghost"
					class="flex-1 sm:flex-none"
					on:click={() => onTaskAction(activeStoryDetails?.id || '', 'REQUEUE')}
				>
					<CornerDownLeft aria-hidden="true" />Back to queue
				</Button>
			</div>
		</div>
	</div>
</Card>
