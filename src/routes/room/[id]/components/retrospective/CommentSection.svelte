<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import type { RetroItem } from '$lib/scrum/types/retro_types';
	import X from 'lucide-svelte/icons/x';

	let {
		retroItem,
		participantId,
		onAddComment,
		onDeleteComment
	}: {
		retroItem: RetroItem;
		participantId: string;
		onAddComment: (content: string) => void;
		onDeleteComment: (id: string) => void;
	} = $props();

	let newComment: string = $state('');

	const handleAddComment = () => {
		if (newComment.trim()) {
			onAddComment(newComment.trim());
			newComment = '';
		}
	};
</script>

<div class="mt-2 space-y-2">
	<h4 class="text-sm font-semibold">Comments</h4>
	{#each retroItem.comments as comment}
		<div class="flex items-center rounded-md bg-muted p-2 text-sm dark:bg-gray-900">
			<div>
				<p>{comment.content}</p>
			</div>
			{#if participantId === comment.author}
				<div class="ml-auto">
					<Button
						variant="ghost"
						size="sm"
						on:click={() => onDeleteComment(comment.id)}
						class="h-8 px-2 text-destructive dark:text-red-500"
					>
						<X class="h-4 w-4" />
					</Button>
				</div>
			{/if}
		</div>
	{/each}
	<form
		class="flex space-x-2"
		onsubmit={(event) => {
			event.preventDefault();
			handleAddComment();
		}}
	>
		<Input placeholder="Add a comment" bind:value={newComment} class="text-sm" />
		<Button size="sm" on:click={handleAddComment}>Add</Button>
	</form>
</div>
