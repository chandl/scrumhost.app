<script lang="ts">
	import { PUBLIC_ENABLE_BACKLOG_MERGE_TASKS } from '$env/static/public';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { ChevronUp, MessageSquare } from 'lucide-svelte';
	import type { RetroItem } from '$lib/scrum/types/retrospective';
	import CommentSection from './CommentSection.svelte';
	import X from 'lucide-svelte/icons/x';

	let {
		item,
		isSelected,
		onSelect,
		onUpvote,
		onDelete,
		onAddComment,
		onDeleteComment
	}: {
		item: RetroItem;
		isSelected: boolean;
		onSelect: (id: string) => void;
		onUpvote: (id: string) => void;
		onDelete: (id: string) => void;
		onAddComment: (id: string, content: string) => void;
		onDeleteComment: (id: string) => void;
	} = $props();

	let showComments = $state(false);
</script>

<Card class="mb-2">
	<CardContent class="space-y-2 p-3">
		<div class="flex items-center justify-between">
			<div class="mr-2 flex flex-grow items-center space-x-2">
				{#if PUBLIC_ENABLE_BACKLOG_MERGE_TASKS === 'true'}
					<Checkbox
						id={`select-${item.id}`}
						checked={isSelected}
						onCheckedChange={() => onSelect(item.id)}
					/>
				{/if}
				<label for={`select-${item.id}`} class="text-sm">{item.content}</label>
			</div>
			<div class="flex items-center space-x-1">
				<Button variant="ghost" size="sm" on:click={() => onUpvote(item.id)} class="h-8 px-2">
					<ChevronUp class="mr-1 h-4 w-4" />
					{item.votes.length}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					on:click={() => (showComments = !showComments)}
					class="h-8 px-2"
				>
					<MessageSquare class="mr-1 h-4 w-4" />
					{item.comments.length}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					on:click={() => onDelete(item.id)}
					class="h-8 px-2 text-destructive"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>
		</div>
		{#if showComments}
			<CommentSection
				retroItem={item}
				onAddComment={(content) => onAddComment(item.id, content)}
				{onDeleteComment}
			/>
		{/if}
	</CardContent>
</Card>
