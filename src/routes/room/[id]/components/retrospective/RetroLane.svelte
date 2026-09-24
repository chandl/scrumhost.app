<script lang="ts">
	import { ArrowDownWideNarrow, Merge, Plus } from 'lucide-svelte';
	import type { Icon } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { RetroItem } from '$lib/scrum/types/retro_types';
	import RetroItemCard from './RetroItemCard.svelte';
	import type { ComponentType } from 'svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	let {
		title,
		icon,
		tone = 'primary',
		placeholder = 'Add an item…',
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
		/** Soft tint used only in the lane header */
		tone?: 'success' | 'warning' | 'primary';
		placeholder?: string;
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

	const toneClasses = {
		success: { header: 'bg-success/[0.07]', chip: 'bg-success/15 text-success' },
		warning: { header: 'bg-warning/[0.08]', chip: 'bg-warning/15 text-warning' },
		primary: { header: 'bg-primary/[0.07]', chip: 'bg-primary/15 text-primary' }
	};

	const inputId = $derived(`${testId ?? title}-add`);
</script>

<section
	class="flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft"
	data-testid={testId}
	aria-label={title}
>
	<header class="flex items-center gap-2.5 border-b px-4 py-3 {toneClasses[tone].header}">
		<span
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {toneClasses[tone].chip}"
		>
			<IconComponent class="h-4 w-4" aria-hidden="true" />
		</span>
		<h2 class="text-base">{title}</h2>
		<span class="text-sm tabular-nums text-muted-foreground">{items.length}</span>

		<div class="ml-auto flex items-center gap-1">
			{#if selectedItems.length > 1}
				<Button size="sm" on:click={handleMerge}>
					<Merge aria-hidden="true" />
					Merge ({selectedItems.length})
				</Button>
			{/if}
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 {sortItemsByVote
					? 'bg-card text-primary shadow-soft hover:text-primary'
					: ''}"
				aria-pressed={sortItemsByVote}
				aria-label="Sort by votes"
				title={sortItemsByVote ? 'Sorted by votes' : 'Sort by votes'}
				on:click={() => (sortItemsByVote = !sortItemsByVote)}
			>
				<ArrowDownWideNarrow />
			</Button>
		</div>
	</header>

	<div class="flex flex-grow flex-col gap-3 p-3">
		<form
			class="flex gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				handleAddItem();
			}}
		>
			<label for={inputId} class="sr-only">Add to {title}</label>
			<Input
				id={inputId}
				data-testid="retro-lane-add-input"
				{placeholder}
				autocomplete="off"
				bind:value={newItem}
			/>
			<Button
				type="submit"
				data-testid="retro-lane-add-submit"
				variant="secondary"
				class="shrink-0 px-3"
				aria-label="Add item"
				title="Add item"
			>
				<Plus aria-hidden="true" /><span class="hidden sm:inline lg:hidden xl:inline">Add</span>
			</Button>
		</form>

		{#if sortedItems.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
		{/if}

		<ul class="space-y-2">
			{#each sortedItems as item (item.id)}
				<li animate:flip={{ duration: 200 }} in:fade={{ duration: 150 }}>
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
				</li>
			{/each}
		</ul>
	</div>
</section>
