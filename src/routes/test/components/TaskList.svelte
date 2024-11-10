<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Check, CornerDownLeft, PlayCircle, SkipForward } from 'lucide-svelte';

	let {
		tasks,
		onTaskAction,
		currentStatus
	}: { tasks: Task[]; onVote: any; votingEnabled: any; onTaskAction: any; currentStatus: any } =
		$props();

	type TaskStatus = 'queued' | 'reviewed' | 'skipped';

	type Task = {
		id: string;
		description: string;
		votes: Record<string, number | null>;
		status: TaskStatus;
	};
</script>

<ul class="space-y-4">
	{#each tasks as task}
		<li class="border-b pb-4 last:border-b-0 last:pb-0">
			<h3 class="mb-2 text-2xl">{task.description}</h3>
			<div class="mb-2 flex space-x-2">
				<div class="mt-2 flex space-x-2">
					{#if currentStatus === 'queued'}
						<Button size="sm" on:click={() => onTaskAction(task.id, 'start_voting')}>
							<PlayCircle class="mr-2 h-4 w-4" /> Start Voting
						</Button>
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'skip')}>
							<SkipForward class="mr-2 h-4 w-4" /> Skip
						</Button>
					{:else if currentStatus === 'reviewed' || currentStatus === 'skipped'}
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'requeue')}>
							<CornerDownLeft class="mr-2 h-4 w-4" /> Requeue
						</Button>
					{/if}
				</div>
			</div>
		</li>
	{/each}
</ul>
