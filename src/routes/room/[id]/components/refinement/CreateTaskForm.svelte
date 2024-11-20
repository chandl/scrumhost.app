<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { createStory } from '$lib/scrum/story';

	let { refinementMetadataId }: { refinementMetadataId: string } = $props();

	let newTaskDescription = $state('');
	async function handleCreateTask() {
		await createStory(newTaskDescription, refinementMetadataId);
		newTaskDescription = '';
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Create New Task</CardTitle>
	</CardHeader>
	<CardContent class="flex space-x-2">
		<form class="flex w-full" onsubmit={handleCreateTask}>
			<Input placeholder="Enter task description" bind:value={newTaskDescription} />
		</form>
		<Button on:click={handleCreateTask}>
			<Plus class="mr-2 h-4 w-4" /> Add Task
		</Button>
	</CardContent>
</Card>
