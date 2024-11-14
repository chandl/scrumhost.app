<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { createStory } from '$lib/scrum/story';

	let { roomId }: { roomId: string } = $props();

	let newTaskDescription = $state('');
	async function handleCreateTask() {
		await createStory(newTaskDescription, roomId);
		newTaskDescription = '';
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Create New Task</CardTitle>
	</CardHeader>
	<CardContent class="flex space-x-2">
		<Input placeholder="Enter task description" bind:value={newTaskDescription} />
		<Button on:click={handleCreateTask}>
			<Plus class="mr-2 h-4 w-4" /> Add Task
		</Button>
	</CardContent>
</Card>
