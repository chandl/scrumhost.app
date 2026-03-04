<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Merge, SortDesc } from 'lucide-svelte';
	import type { Icon } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { RetroItem } from '$lib/scrum/types/retro_types';
	import RetroItemCard from './RetroItemCard.svelte';
	import type { ComponentType } from 'svelte';
	import { mode } from 'mode-watcher';

	let {
		title,
		icon,
		items,
		participantId,
		testId,
		onAddItem,
		onUpvote,
		onDeleteUpvote,
		onDelete,
		onMerge,
		onAddComment,
		onDeleteComment
	}: {
		title: string;
		icon: ComponentType<Icon>;
		items: RetroItem[];
		participantId: string;
		testId?: string;

		onAddItem: (content: string) => void;
		onUpvote: (id: string) => void;
		onDeleteUpvote: (itemId: string, voteId: string) => void;
		onDelete: (id: string) => void;
		onMerge: (ids: string[]) => void;
		onAddComment: (id: string, content: string) => void;
		onDeleteComment: (itemId: string, commentId: string) => void;
	} = $props();

	let newItem: string = $state('');
	let selectedItems: string[] = $state([]);
	let sortItemsByVote: boolean = $state(false);

	let sortedItems = $derived.by(() => {
		if (sortItemsByVote) {
			return [...items].sort((a, b) => b.votes.length - a.votes.length);
		}
		return [...items];
	});

	const handleAddItem = () => {
		if (newItem.trim()) {
			onAddItem(newItem.trim());
			newItem = '';
		}
	};

	const handleSelectItem = (id: string) => {
		if (selectedItems.includes(id)) {
			selectedItems = selectedItems.filter((item) => item !== id);
		} else {
			selectedItems = [...selectedItems, id];
		}
	};

	const handleMerge = () => {
		onMerge(selectedItems);
		selectedItems = [];
	};

	const IconComponent = $derived(icon);
</script>

<Card class="flex flex-col" data-testid={testId}>
	<CardHeader class="pb-2">
		<CardTitle class="flex items-center justify-between text-lg">
			<div class="flex items-center">
				<IconComponent class="mr-2 h-5 w-5" />
				{title}
			</div>

			<div class="ml-auto flex items-center">
				{#if selectedItems.length > 1}
					<Button size="sm" on:click={handleMerge}>
						<Merge class="mr-2 h-4 w-4" />
						Merge ({selectedItems.length})
					</Button>
				{/if}
				<SortDesc
					onclick={() => (sortItemsByVote = !sortItemsByVote)}
					class={`ml-2 transition-colors duration-200 ${
						sortItemsByVote
							? 'text-blue-500 hover:text-red-500'
							: $mode == 'light'
								? 'text-black hover:text-blue-500'
								: 'text-gray-200 hover:text-blue-500'
					}`}
					style="color: ${sortItemsByVote
						? 'rgb(59, 130, 246)'
						: $mode === 'light'
							? 'black'
							: 'white'};"
				/>
			</div>
		</CardTitle>
	</CardHeader>
	<CardContent class="flex flex-grow flex-col space-y-2 pt-0">
		<form
			class="mt-2 flex space-x-2"
			onsubmit={(event) => {
				event.preventDefault();
				handleAddItem();
			}}
		>
			<Input
				data-testid="retro-lane-add-input"
				placeholder="Enter new item"
				bind:value={newItem}
				class="text-sm"
			/>
			<Button data-testid="retro-lane-add-submit" size="sm" on:click={handleAddItem}>Add</Button>
		</form>
		<div class="flex-grow overflow-auto">
			{#each sortedItems as item}
				<RetroItemCard
					{item}
					{onUpvote}
					{onDeleteUpvote}
					{onDelete}
					onSelect={handleSelectItem}
					isSelected={selectedItems.includes(item.id)}
					{onAddComment}
					{onDeleteComment}
					{participantId}
				/>
			{/each}
		</div>
	</CardContent>
</Card>
