<script lang="ts">
	import { env } from '$env/dynamic/public';
	const PUBLIC_ENABLE_BACKLOG_MERGE_TASKS = env.PUBLIC_ENABLE_BACKLOG_MERGE_TASKS ?? 'false';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { ChevronUp, MessageSquare, Trash2 } from 'lucide-svelte';
	import type { RetroItem } from '$lib/scrum/types/retro_types';
	import CommentSection from './CommentSection.svelte';

	let {
		item,
		isSelected,
		participantId,
		onSelect,
		onUpvote,
		onDeleteUpvote,
		onDelete,
		onAddComment,
		onDeleteComment
	}: {
		item: RetroItem;
		isSelected: boolean;
		participantId: string;
		onSelect: (id: string) => void;
		onUpvote: (id: string) => void;
		onDeleteUpvote: (itemId: string, voteId: string) => void;
		onDelete: (id: string) => void;
		onAddComment: (id: string, content: string) => void;
		onDeleteComment: (itemId: string, commentId: string) => void;
	} = $props();

	let showComments = $state(false);
	let myVote = $derived(item.votes.find((vote) => vote.voter === participantId));

	function toggleUpvote() {
		if (myVote) onDeleteUpvote(item.id, myVote.id || 'UNKNOWN');
		else onUpvote(item.id);
	}
</script>

<div
	class="rounded-lg border bg-background/60 p-3 transition-colors duration-150 hover:border-foreground/15 {isSelected
		? 'border-primary'
		: ''}"
	data-testid="retro-item-card"
>
	<div class="flex items-start gap-2">
		{#if PUBLIC_ENABLE_BACKLOG_MERGE_TASKS === 'true'}
			<Checkbox
				id={`select-${item.id}`}
				class="mt-1"
				checked={isSelected}
				onCheckedChange={() => onSelect(item.id)}
			/>
			<label for={`select-${item.id}`} class="min-w-0 flex-1 break-words text-[15px] leading-snug"
				>{item.content}</label
			>
		{:else}
			<p class="min-w-0 flex-1 break-words text-[15px] leading-snug">{item.content}</p>
		{/if}
	</div>

	<div class="-mb-1 -ml-1.5 mt-2 flex items-center gap-1">
		<Button
			variant="ghost"
			size="sm"
			class="h-8 gap-1 px-2 tabular-nums {myVote
				? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
				: ''}"
			aria-pressed={!!myVote}
			aria-label="{myVote ? 'Remove your vote' : 'Upvote'} ({item.votes.length})"
			title={myVote ? 'Remove your vote' : 'Upvote'}
			on:click={toggleUpvote}
		>
			<ChevronUp aria-hidden="true" />
			{item.votes.length}
		</Button>
		<Button
			data-testid="retro-item-comment-toggle"
			variant="ghost"
			size="sm"
			class="h-8 gap-1 px-2 tabular-nums {showComments ? 'bg-muted text-foreground' : ''}"
			aria-expanded={showComments}
			aria-label="Comments ({item.comments.length})"
			title="Comments"
			on:click={() => (showComments = !showComments)}
		>
			<MessageSquare aria-hidden="true" />
			{item.comments.length}
		</Button>
		{#if participantId === item.author}
			<Button
				variant="ghost"
				size="icon"
				class="ml-auto h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
				aria-label="Delete item"
				title="Delete item"
				on:click={() => onDelete(item.id)}
			>
				<Trash2 />
			</Button>
		{/if}
	</div>

	{#if showComments}
		<CommentSection
			retroItem={item}
			onAddComment={(content) => onAddComment(item.id, content)}
			onDeleteComment={(commentId) => onDeleteComment(item.id, commentId)}
			{participantId}
		/>
	{/if}
</div>
