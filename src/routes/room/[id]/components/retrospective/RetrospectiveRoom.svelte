<script lang="ts">
	import type { Participant } from '$lib/scrum/types/room';
	import { page } from '$app/stores';

	import RetroLane from './RetroLane.svelte';
	import { ArrowUpCircle, ListTodo, ThumbsUp } from 'lucide-svelte';
	import type { RetroItem, RetroItemCategory, RetroMetadata } from '$lib/scrum/types/retro_types';
	import ParticipantList from '../refinement/ParticipantList.svelte';
	import {
		createRetroItem,
		createRetroItemComment,
		deleteRetroItem,
		deleteRetroItemComment,
		deleteRetroItemUpvote,
		getRetroMetadata,
		subscribeToRetroMetadata,
		triggerMetadataRefresh,
		upvoteRetroItem
	} from '$lib/scrum/retro';
	import { onMount } from 'svelte';

	let {
		participants,
		userParticipant,
		roomPassword
	}: {
		participants: Participant[];
		userParticipant: Participant | undefined;
		roomPassword: string;
	} = $props();

	const parentRoomId = $page.params.id;

	let participantId: string = $derived(userParticipant?.id || 'UNKNOWN');
	let retroMetadata: RetroMetadata | undefined = $state();
	let metadataId: string = $derived(retroMetadata?.id || 'UNKNOWN');
	let retroItems: RetroItem[] = $derived(retroMetadata?.items || []);

	let wentWellItems: RetroItem[] = $derived(
		retroItems.filter((item) => item.category === 'WENT_WELL')
	);
	let toImproveItems: RetroItem[] = $derived(
		retroItems.filter((item) => item.category === 'TO_IMPROVE')
	);
	let actionItems: RetroItem[] = $derived(
		retroItems.filter((item) => item.category === 'ACTION_ITEMS')
	);

	const addRetroItem = (category: RetroItemCategory) => async (content: string) => {
		console.log('Adding new item to category', category, content);
		const item = await createRetroItem(metadataId, content, category, participantId);
		console.log('Created new item', item, 'in category', category);
	};

	const upvoteItem = async (id: string) => {
		console.log('Upvoting retro item with id', id);
		await upvoteRetroItem(id, participantId);
		await triggerMetadataRefresh(metadataId);
	};

	const deleteUpvote = async (itemId: string, voteId: string) => {
		console.log('Deleting upvote on retro item with id', voteId);

		await deleteRetroItemUpvote(itemId, voteId);
		await triggerMetadataRefresh(metadataId);
	};

	const deleteItem = async (id: string) => {
		console.log('Deleting retro item with id', id);
		await deleteRetroItem(id);
	};

	const addComment = async (id: string, content: string) => {
		console.log('Creating new comment', content, id);
		await createRetroItemComment(id, content, userParticipant?.id || 'UNKNOWN');
		await triggerMetadataRefresh(metadataId);
	};

	const deleteComment = async (itemId: string, commentId: string) => {
		console.log('Deleting comment', commentId, 'on item', itemId);
		await deleteRetroItemComment(itemId, commentId);
		await triggerMetadataRefresh(metadataId);
	};

	const mergeItems = (category: RetroItem['category']) => (ids: string[]) => {
		// TODO implement
		console.log('onMerge called', category, ids);
	};

	onMount(async () => {
		retroMetadata = await getRetroMetadata(parentRoomId);
		console.log('Initialized room with retro metadata', retroMetadata);

		subscribeToRetroMetadata(retroMetadata.id, (updatedMetadata) => {
			console.log('Received metadata update', updatedMetadata);
			retroMetadata = updatedMetadata;
		});
	});
</script>

<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
	<div class="space-y-4 md:col-span-2">
		<RetroLane
			title="What Went Well"
			items={wentWellItems}
			icon={ThumbsUp}
			onAddItem={addRetroItem('WENT_WELL')}
			onUpvote={upvoteItem}
			onDeleteUpvote={deleteUpvote}
			onDelete={deleteItem}
			onMerge={mergeItems('WENT_WELL')}
			onAddComment={addComment}
			onDeleteComment={deleteComment}
			{participantId}
		/>
		<RetroLane
			title="What Could Be Improved"
			items={toImproveItems}
			icon={ArrowUpCircle}
			onAddItem={addRetroItem('TO_IMPROVE')}
			onUpvote={upvoteItem}
			onDeleteUpvote={deleteUpvote}
			onDelete={deleteItem}
			onMerge={mergeItems('TO_IMPROVE')}
			onAddComment={addComment}
			onDeleteComment={deleteComment}
			{participantId}
		/>
		<RetroLane
			title="Action Items"
			items={actionItems}
			icon={ListTodo}
			onAddItem={addRetroItem('ACTION_ITEMS')}
			onUpvote={upvoteItem}
			onDeleteUpvote={deleteUpvote}
			onDelete={deleteItem}
			onMerge={mergeItems('ACTION_ITEMS')}
			onAddComment={addComment}
			onDeleteComment={deleteComment}
			{participantId}
		/>
	</div>

	<div>
		<ParticipantList
			currentUser={userParticipant}
			{participants}
			showOtherParticipantVotes={false}
			currentVotes={[]}
			{roomPassword}
		/>
	</div>
</div>
