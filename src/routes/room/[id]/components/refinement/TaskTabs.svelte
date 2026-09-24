<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import TaskList from './TaskList.svelte';
	import type { StoryAction, StorySummary } from '$lib/scrum/types/refinement';

	let {
		stories,
		activeStoryId,
		onTaskAction
	}: {
		stories: StorySummary[];
		activeStoryId: string | undefined;
		onTaskAction: (taskId: string, taskAction: StoryAction) => void;
	} = $props();

	let queuedTasks: StorySummary[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'QUEUED' && story.id != activeStoryId)
	);

	let reviewedTasks: StorySummary[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'REVIEWED')
	);

	let skippedTasks: StorySummary[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'SKIPPED')
	);

	let currentTab = $state('queued');

	const countClass =
		'min-w-5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground';
</script>

<Tabs bind:value={currentTab}>
	<TabsList class="grid w-full grid-cols-3">
		<TabsTrigger value="queued"
			>Queued <span class={countClass}>{queuedTasks?.length}</span></TabsTrigger
		>
		<TabsTrigger value="reviewed"
			>Done <span class={countClass}>{reviewedTasks?.length}</span></TabsTrigger
		>
		<TabsTrigger value="skipped"
			>Skipped <span class={countClass}>{skippedTasks?.length}</span></TabsTrigger
		>
	</TabsList>
	<TabsContent value="queued">
		{#if queuedTasks.length === 0}
			<p class="px-1 py-6 text-center text-sm text-muted-foreground">
				The queue is empty. Add a story above.
			</p>
		{/if}
		<TaskList tasks={queuedTasks} {onTaskAction} currentStatus="QUEUED" />
	</TabsContent>
	<TabsContent value="reviewed">
		{#if reviewedTasks.length === 0}
			<p class="px-1 py-6 text-center text-sm text-muted-foreground">
				Estimated stories will appear here.
			</p>
		{/if}
		<TaskList tasks={reviewedTasks} {onTaskAction} currentStatus="REVIEWED" />
	</TabsContent>
	<TabsContent value="skipped">
		{#if skippedTasks.length === 0}
			<p class="px-1 py-6 text-center text-sm text-muted-foreground">
				Skipped stories will appear here.
			</p>
		{/if}
		<TaskList tasks={skippedTasks} {onTaskAction} currentStatus="SKIPPED" />
	</TabsContent>
</Tabs>
