<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CornerDownLeft, Eye, PlayCircle, SkipForward } from 'lucide-svelte';
	import type { StoryAction, StoryStatus, StorySummary } from '$lib/scrum/types';
	import { formatTimeAgo } from '$lib/utils';

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

<ul class="space-y-4">
	{#each tasks as task}
		<li class="border-b pb-4 last:border-b-0 last:pb-0">
			<h3 class="mb-2 text-2xl">{task.details}</h3>
			<span class="text-sm">Updated {formatTimeAgo(new Date(task.updated))}</span>
			<div class="mb-2 flex space-x-2">
				<div class="mt-2 flex space-x-2">
					{#if currentStatus === 'QUEUED'}
						<Button size="sm" on:click={() => onTaskAction(task.id, 'START_VOTING')}>
							<PlayCircle class="mr-2 h-4 w-4" />Start Voting
						</Button>
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'SKIP')}>
							<SkipForward class="mr-2 h-4 w-4" /> Skip
						</Button>
					{:else if currentStatus === 'REVIEWED' || currentStatus === 'SKIPPED'}
						{#if currentStatus === 'REVIEWED'}
							<Button size="sm" on:click={() => onTaskAction(task.id, 'REVIEW_RESULTS')}>
								<Eye class="mr-2 h-4 w-4" /> Review Results
							</Button>
						{/if}
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'REQUEUE')}>
							<CornerDownLeft class="mr-2 h-4 w-4" /> Requeue
						</Button>
					{/if}
				</div>
			</div>
		</li>
	{/each}
</ul>
