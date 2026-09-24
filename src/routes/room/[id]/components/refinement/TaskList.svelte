<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CornerDownLeft, Eye, Play, SkipForward } from 'lucide-svelte';
	import { formatTimeAgo } from '$lib/utils';
	import type { StoryAction, StoryStatus, StorySummary } from '$lib/scrum/types/refinement';
	import { fade } from 'svelte/transition';

	let {
		tasks,
		onTaskAction,
		currentStatus
	}: {
		tasks: StorySummary[];
		onTaskAction: (taskId: string, taskAction: StoryAction) => void;
		currentStatus: StoryStatus;
	} = $props();
</script>

<ul class="space-y-2" data-testid="task-list">
	{#each tasks as task (task.id)}
		<li
			class="rounded-lg border bg-background/60 p-3 transition-colors hover:border-foreground/15"
			data-testid="story-card"
			in:fade={{ duration: 150 }}
		>
			<h3 class="break-words text-[15px] font-medium leading-snug tracking-normal">
				{task.details}
			</h3>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Updated {formatTimeAgo(new Date(task.updated))}
			</p>
			<div class="mt-2.5 flex flex-wrap gap-2">
				{#if currentStatus === 'QUEUED'}
					<Button
						data-testid="start-voting"
						size="sm"
						on:click={() => onTaskAction(task.id, 'START_VOTING')}
					>
						<Play aria-hidden="true" />Start voting
					</Button>
					<Button size="sm" variant="ghost" on:click={() => onTaskAction(task.id, 'SKIP')}>
						<SkipForward aria-hidden="true" />Skip
					</Button>
				{:else if currentStatus === 'REVIEWED' || currentStatus === 'SKIPPED'}
					{#if currentStatus === 'REVIEWED'}
						<Button
							size="sm"
							variant="outline"
							on:click={() => onTaskAction(task.id, 'REVIEW_RESULTS')}
						>
							<Eye aria-hidden="true" />See results
						</Button>
					{/if}
					<Button size="sm" variant="ghost" on:click={() => onTaskAction(task.id, 'REQUEUE')}>
						<CornerDownLeft aria-hidden="true" />Back to queue
					</Button>
				{/if}
			</div>
		</li>
	{/each}
</ul>
