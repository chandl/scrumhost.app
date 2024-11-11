<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Story, StoryAction } from '$lib/story';
	import { Check, CornerDownLeft, PlayCircle, SkipForward } from 'lucide-svelte';

	let {
		tasks,
		onTaskAction,
		currentStatus
	}: {
		tasks: Story[];
		onVote: any;
		votingEnabled: any;
		onTaskAction: (taskId: string, taskAction: StoryAction) => void;
		currentStatus: any;
	} = $props();
</script>

<ul class="space-y-4">
	{#each tasks as task}
		<li class="border-b pb-4 last:border-b-0 last:pb-0">
			<h3 class="mb-2 text-2xl">{task.details}</h3>
			<div class="mb-2 flex space-x-2">
				<div class="mt-2 flex space-x-2">
					{#if currentStatus === 'queued'}
						<Button size="sm" on:click={() => onTaskAction(task.id, 'START_VOTING')}>
							<PlayCircle class="mr-2 h-4 w-4" />Start Voting
						</Button>
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'SKIP')}>
							<SkipForward class="mr-2 h-4 w-4" /> Skip
						</Button>
					{:else if currentStatus === 'reviewed' || currentStatus === 'skipped'}
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'REQUEUE')}>
							<CornerDownLeft class="mr-2 h-4 w-4" /> Requeue
						</Button>
					{/if}
				</div>
			</div>
		</li>
	{/each}
</ul>
