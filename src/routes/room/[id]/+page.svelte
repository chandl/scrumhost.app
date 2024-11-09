<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { createStory, subscribeToNewStories } from '$lib/story';
	import { onMount } from 'svelte';

	const roomId = $page.params.id;

	function handleCreateStory() {
		createStory('Story Details Example', roomId);
	}

	onMount(async () => {
		subscribeToNewStories(roomId, (record) => {
			console.log('subscription hit!', record);
		});
	});
</script>

<strong><a href="/">Home</a></strong>
<br />
<h1>Room Page for {roomId}</h1>

<Button on:click={handleCreateStory}>Create Story</Button>
