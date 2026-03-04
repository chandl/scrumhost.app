<script lang="ts">
	import { env } from '$env/dynamic/public';
	const PUBLIC_ENABLE_BACKLOG_MERGE_TASKS = env.PUBLIC_ENABLE_BACKLOG_MERGE_TASKS ?? 'false';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { ChevronUp, MessageSquare } from 'lucide-svelte';
	import type { RetroItem } from '$lib/scrum/types/retro_types';
	import CommentSection from './CommentSection.svelte';
	import X from 'lucide-svelte/icons/x';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

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
</script>

<Card class="mb-2" data-testid="retro-item-card">
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
				{#if !item.votes.find((vote) => vote.voter === participantId)}
					<Button
						variant="ghost"
						size="sm"
						on:click={() => onUpvote(item.id)}
						class="h-8 px-2 transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-400"
					>
						<ChevronUp class="mr-1 h-4 w-4" />
						{item.votes.length}
					</Button>
				{:else}
					<Button
						variant="ghost"
						size="sm"
						on:click={() =>
							onDeleteUpvote(
								item.id,
								item.votes.find((vote) => vote.voter === participantId)?.id || 'UNKNOWN'
							)}
						class="h-8 bg-blue-100 px-2 transition-colors duration-200 hover:bg-red-100 dark:bg-blue-400 dark:hover:bg-red-400"
					>
						<ChevronDown class="mr-1 h-4 w-4" />
						{item.votes.length}
					</Button>
				{/if}
				<Button
					data-testid="retro-item-comment-toggle"
					variant="ghost"
					size="sm"
					on:click={() => (showComments = !showComments)}
					class="h-8 px-2 transition-colors duration-200"
				>
					<MessageSquare class="mr-1 h-4 w-4" />
					{item.comments.length}
				</Button>
				{#if participantId === item.author}
					<Button
						variant="ghost"
						size="sm"
						on:click={() => onDelete(item.id)}
						class="h-8 px-2 text-destructive dark:text-red-500"
					>
						<X class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		</div>
		{#if showComments}
			<CommentSection
				retroItem={item}
				onAddComment={(content) => onAddComment(item.id, content)}
				onDeleteComment={(commentId) => onDeleteComment(item.id, commentId)}
				{participantId}
			/>
		{/if}
	</CardContent>
</Card>
