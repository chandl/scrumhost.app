<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { createOrUpdateEstimate } from '$lib/estimates';

	let { pointValues, currentStory }: { pointValues: string; currentStory: string } = $props();
	let pointOptions = $derived(pointValues?.split(','));

	let votes = $state();

	function castVote(vote: string) {
		console.log(`Voting for story ${currentStory} with vote ${vote}`);
		createOrUpdateEstimate(currentStory, vote);
	}
</script>

<h1>VOTE on Active Story: {currentStory} - Options:</h1>

{#each pointOptions as option}
	<Button on:click={() => castVote(option)}>{option}</Button>
{/each}
