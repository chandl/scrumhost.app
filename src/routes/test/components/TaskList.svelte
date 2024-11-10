<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Check, SkipForward } from 'lucide-svelte';

	let {
		tasks,
		onVote,
		votingEnabled,
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
	type PointValue = 1 | 2 | 3 | 5 | 8 | 13 | 21;

	const pointValues: PointValue[] = [1, 2, 3, 5, 8, 13, 21];
</script>

<ul class="space-y-4">
	{#each tasks as task}
		<li class="border-b pb-4 last:border-b-0 last:pb-0">
			<h3 class="mb-2 font-semibold">{task.description}</h3>
			<div class="mb-2 flex space-x-2">
				{#each pointValues as value}
					<Button
						variant={Object.values(task.votes).includes(value) ? 'default' : 'outline'}
						size="sm"
						on:click={() => onVote(task.id, value)}
						disabled={!votingEnabled || task.status !== 'queued'}
					>
						{value}
					</Button>
				{/each}

				{#if !votingEnabled && task.status === 'queued'}
					<div class="mt-2">
						Votes: {Object.values(task.votes).filter(Boolean).join(', ') || 'No votes yet'}
					</div>
				{/if}

				<div class="mt-2 flex space-x-2">
					{#if currentStatus === 'queued'}
						<Button size="sm" on:click={() => onTaskAction(task.id, 'review')}>
							<Check class="mr-2 h-4 w-4" /> Mark as Reviewed
						</Button>
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'skip')}>
							<SkipForward class="mr-2 h-4 w-4" /> Skip
						</Button>
					{:else if currentStatus === 'reviewed' || currentStatus === 'skipped'}
						<Button size="sm" variant="outline" on:click={() => onTaskAction(task.id, 'requeue')}>
							Requeue
						</Button>
					{/if}
				</div>
			</div>
		</li>
	{/each}
</ul>
