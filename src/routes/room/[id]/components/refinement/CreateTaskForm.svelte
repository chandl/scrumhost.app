<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { createStory } from '$lib/scrum/story';
	import { encryptString } from '$lib/crypto';

	let {
		refinementMetadataId,
		roomPassword
	}: { refinementMetadataId: string; roomPassword: string } = $props();

	let newTaskDescription = $state('');
	async function handleCreateTask() {
		const encryptedTask = await encryptString(roomPassword, newTaskDescription);
		await createStory(encryptedTask, refinementMetadataId);
		newTaskDescription = '';
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Create New Task</CardTitle>
	</CardHeader>
	<CardContent class="flex space-x-2">
		<form class="flex w-full" onsubmit={handleCreateTask}>
			<Input data-testid="create-task-input" placeholder="Enter task description" bind:value={newTaskDescription} />
		</form>
		<Button data-testid="create-task-submit" on:click={handleCreateTask}>
			<Plus class="mr-2 h-4 w-4" /> Add Task
		</Button>
	</CardContent>
</Card>
