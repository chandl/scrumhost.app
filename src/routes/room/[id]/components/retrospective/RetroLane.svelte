<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Icon, Merge } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { RetroItem } from '$lib/scrum/types/retrospective';
	import RetroItemCard from './RetroItemCard.svelte';

	let {
		title,
		icon,
		items,
		onAddItem,
		onUpvote,
		onDelete,
		onMerge,
		onAddComment,
		onDeleteComment
	}: {
		title: string;
		icon: any;
		items: RetroItem[];

		onAddItem: (content: string) => void;
		onUpvote: (id: string) => void;
		onDelete: (id: string) => void;
		onMerge: (ids: string[]) => void;
		onAddComment: (id: string, content: string) => void;
		onDeleteComment: (id: string) => void;
	} = $props();

	let newItem: string = $state('');
	let selectedItems: string[] = $state([]);

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
</script>

<Card class="flex flex-col">
	<CardHeader class="pb-2">
		<CardTitle class="flex items-center justify-between text-lg">
			<div class="flex items-center">
				<Icon class="mr-2 h-5 w-5"><svelte:component this={icon}></svelte:component></Icon>
				{title}
			</div>
			{#if selectedItems.length > 1}
				<Button size="sm" on:click={handleMerge}>
					<Merge class="mr-2 h-4 w-4" />
					Merge ({selectedItems.length})
				</Button>
			{/if}
		</CardTitle>
	</CardHeader>
	<CardContent class="flex flex-grow flex-col space-y-2 pt-0">
		<form class="mt-2 flex space-x-2" onsubmit={handleAddItem}>
			<Input placeholder="Enter new item" bind:value={newItem} class="text-sm" />
			<Button size="sm" on:click={handleAddItem}>Add</Button>
		</form>
		<div class="flex-grow overflow-auto">
			{#each items as item}
				<RetroItemCard
					{item}
					{onUpvote}
					{onDelete}
					onSelect={handleSelectItem}
					isSelected={selectedItems.includes(item.id)}
					{onAddComment}
					{onDeleteComment}
				/>
			{/each}
		</div>
	</CardContent>
</Card>
