<script lang="ts">
	import type { Participant, RoomDetails } from '$lib/scrum/types/room';
	import RetroParticipantList from './RetroParticipantList.svelte';
	import RetroLane from './RetroLane.svelte';
	import { ArrowUpCircle, ListTodo, ThumbsUp } from 'lucide-svelte';
	import type { RetroItem, RetroItemCategory } from '$lib/scrum/types/retrospective';
	import ParticipantList from '../refinement/ParticipantList.svelte';

	let {
		parentRoom,
		participants,
		userParticipant
	}: {
		parentRoom: RoomDetails | undefined;
		participants: Participant[];
		userParticipant: Participant | undefined;
	} = $props();

	let retroItems: RetroItem[] = $state(
		[
			{
				id: '123',
				content: 'string',
				category: 'WENT_WELL',
				votes: [],
				comments: [
					{
						id: 'string',
						content: 'string',
						author: 'string'
					}
				]
			},
			{
				id: '1234',
				content: 'string2',
				category: 'WENT_WELL',
				votes: ['up1', 'up2', 'up3'],
				comments: [
					{
						id: 'string',
						content: 'string',
						author: 'author'
					},
					{
						id: 'string',
						content: 'strin2g',
						author: 'author'
					}
				]
			},
			{
				id: '12345',
				content: 'string3',
				category: 'WENT_WELL',
				votes: [],
				comments: [
					{
						id: 'string',
						content: 'string',
						author: 'string'
					}
				]
			},
			{
				id: '123456',
				content:
					'We should do something during the sprint because when we do not then things happen',
				category: 'WENT_WELL',
				votes: ['up1', 'up2'],
				comments: [
					{
						id: 'string',
						content: 'string',
						author: 'author'
					}
				]
			}
		].sort((a, b) => b.votes.length - a.votes.length)
	);

	let wentWellItems: RetroItem[] = $derived(
		retroItems.filter((item) => item.category === 'WENT_WELL')
	);
	let toImproveItems: RetroItem[] = $derived(
		retroItems.filter((item) => item.category === 'TO_IMPROVE')
	);
	let actionItems: RetroItem[] = $derived(
		retroItems.filter((item) => item.category === 'ACTION_ITEMS')
	);

	const addRetroItem = (category: RetroItemCategory) => (content: string) => {
		console.log('Adding new item to category', category, content);
		const newItem: RetroItem = {
			id: Date.now().toString(),
			content,
			category,
			votes: [],
			comments: []
		};
		// TODO create retroItem in DB
		console.log('newItem', newItem);
	};

	const upvoteItem = (id: string) => {};

	const deleteItem = (id: string) => {};

	const addComment = (id: string) => {};

	const mergeItems = (category: RetroItem['category']) => (ids: string[]) => {
		const itemsToMerge = retroItems.filter((item) => ids.includes(item.id));
		const mergedContent = itemsToMerge.map((item) => item.content).join(' | ');

		//const totalVotes = itemsToMerge.reduce((sum, item) => sum + item.votes.length, 0)
		const allComments = itemsToMerge.flatMap((item) => item.comments);

		const newItem: RetroItem = {
			id: Date.now().toString(),
			content: mergedContent,
			category,
			votes: [],
			comments: allComments
		};

		console.log('Merged item: ', newItem);

		// TODO update merge item
	};
</script>

<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
	<div class="space-y-8 md:col-span-2">
		<RetroLane
			title="What Went Well"
			items={wentWellItems}
			icon={ThumbsUp}
			onAddItem={addRetroItem('WENT_WELL')}
			onUpvote={upvoteItem}
			onDelete={deleteItem}
			onMerge={mergeItems('WENT_WELL')}
			onAddComment={addComment}
		/>
		<RetroLane
			title="What Could Be Improved"
			items={toImproveItems}
			icon={ArrowUpCircle}
			onAddItem={addRetroItem('TO_IMPROVE')}
			onUpvote={upvoteItem}
			onDelete={deleteItem}
			onMerge={mergeItems('TO_IMPROVE')}
			onAddComment={addComment}
		/>
		<RetroLane
			title="Action Items"
			items={actionItems}
			icon={ListTodo}
			onAddItem={addRetroItem('ACTION_ITEMS')}
			onUpvote={upvoteItem}
			onDelete={deleteItem}
			onMerge={mergeItems('ACTION_ITEMS')}
			onAddComment={addComment}
		/>
	</div>

	<div>
		<ParticipantList
			currentUser={userParticipant}
			{participants}
			showOtherParticipantVotes={false}
			currentVotes={[]}
		/>
	</div>
</div>
