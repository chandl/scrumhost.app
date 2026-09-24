<script lang="ts">
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
		if (!newTaskDescription.trim()) return;
		const encryptedTask = await encryptString(roomPassword, newTaskDescription);
		await createStory(encryptedTask, refinementMetadataId);
		newTaskDescription = '';
	}
</script>

<form
	class="flex gap-2"
	onsubmit={(e) => {
		e.preventDefault();
		handleCreateTask();
	}}
>
	<label for="create-task-input" class="sr-only">New story</label>
	<Input
		id="create-task-input"
		data-testid="create-task-input"
		placeholder="Add a story to estimate…"
		autocomplete="off"
		bind:value={newTaskDescription}
	/>
	<Button
		type="submit"
		data-testid="create-task-submit"
		disabled={!newTaskDescription.trim()}
		aria-label="Add story"
		title="Add story"
		class="shrink-0 px-3"
	>
		<Plus aria-hidden="true" />
		<span class="hidden sm:inline lg:hidden xl:inline">Add</span>
	</Button>
</form>
