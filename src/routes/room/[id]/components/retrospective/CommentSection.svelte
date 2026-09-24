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

<div class="mt-3 animate-rise-in space-y-2 border-t pt-3">
	<h4 class="sr-only">Comments</h4>
	{#each retroItem.comments as comment (comment.id)}
		<div class="flex items-start gap-2 rounded-md bg-muted px-2.5 py-2 text-sm">
			<p class="min-w-0 flex-1 break-words leading-snug">{comment.content}</p>
			{#if participantId === comment.author}
				<Button
					variant="ghost"
					size="icon"
					on:click={() => onDeleteComment(comment.id)}
					class="-my-1 -mr-1 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
					aria-label="Delete comment"
					title="Delete comment"
				>
					<X />
				</Button>
			{/if}
		</div>
	{/each}
	<form
		class="flex gap-2"
		onsubmit={(event) => {
			event.preventDefault();
			handleAddComment();
		}}
	>
		<label for="comment-{retroItem.id}" class="sr-only">Add a comment</label>
		<Input
			id="comment-{retroItem.id}"
			data-testid="retro-comment-input"
			placeholder="Add a comment…"
			autocomplete="off"
			bind:value={newComment}
			class="h-9"
		/>
		<Button data-testid="retro-comment-submit" type="submit" size="sm" variant="secondary"
			>Add</Button
		>
	</form>
</div>
