<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
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

	let currentTab = $state('');
</script>

<Tabs bind:value={currentTab}>
	<TabsList class="grid w-full grid-cols-3">
		<TabsTrigger value="queued">Queued ({queuedTasks?.length})</TabsTrigger>
		<TabsTrigger value="reviewed">Reviewed ({reviewedTasks?.length})</TabsTrigger>
		<TabsTrigger value="skipped">Skipped ({skippedTasks?.length})</TabsTrigger>
	</TabsList>
	<TabsContent value="queued">
		<Card>
			<CardHeader>
				<CardTitle>Queued Tasks</CardTitle>
			</CardHeader>
			<CardContent>
				{#if queuedTasks.length === 0}
					<p class="text-sm italic text-gray-700">Create a new task above.</p>
				{/if}
				<TaskList tasks={queuedTasks} {onTaskAction} currentStatus="QUEUED" />
			</CardContent>
		</Card>
	</TabsContent>
	<TabsContent value="reviewed">
		<Card>
			<CardHeader>
				<CardTitle>Reviewed Tasks</CardTitle>
			</CardHeader>
			<CardContent>
				{#if reviewedTasks.length === 0}
					<p class="text-sm italic text-gray-700">Previously reviewed tasks will appear here.</p>
				{/if}
				<TaskList tasks={reviewedTasks} {onTaskAction} currentStatus="REVIEWED" />
			</CardContent>
		</Card>
	</TabsContent>
	<TabsContent value="skipped">
		<Card>
			<CardHeader>
				<CardTitle>Skipped Tasks</CardTitle>
			</CardHeader>
			<CardContent>
				{#if skippedTasks.length === 0}
					<p class="text-sm italic text-gray-700">Any skipped tasks will appear here.</p>
				{/if}
				<TaskList tasks={skippedTasks} {onTaskAction} currentStatus="SKIPPED" />
			</CardContent>
		</Card>
	</TabsContent>
</Tabs>
