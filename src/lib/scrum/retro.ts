import type { Room } from '$lib/scrum/types/room';
import pb from '$lib/pocketbase/pocketbase';
import { joinRoomAndGetParticipantDetails } from '$lib/scrum/room';
import type {
	RetroComment,
	RetroItem,
	RetroItemCategory,
	RetroMetadata,
	RetroVote
} from '$lib/scrum/types/retro_types';

export async function triggerMetadataRefresh(metadataId: string) {
	await pb.collection('retro_metadata').update(metadataId, {});
}

export async function initRetroMetadata(parentRoom: Room): Promise<RetroMetadata> {
	const participant = await joinRoomAndGetParticipantDetails(parentRoom.id);

	const metadata = await pb.collection('retro_metadata').create({
		parent_room: parentRoom.id,
		host: participant.id,
		items: []
	});

	return {
		id: metadata.id,
		parent_room: metadata.parent_room,
		host: metadata.host,
		items: metadata.items
	};
}

export async function getRetroMetadata(parentRoomId: string): Promise<RetroMetadata> {
	const metadata = await pb
		.collection('retro_metadata')
		.getFirstListItem(`parent_room = "${parentRoomId}"`, {
			expand: 'items,items.comments,items.votes'
		});

	console.log('METADATA', metadata);

	return {
		id: metadata.id,
		parent_room: metadata.parent_room,
		items: parseItemsResponse(metadata.expand?.items || []),
		host: metadata.host
	};
}

export function subscribeToRetroMetadata(
	metadataId: string,
	callback: (metadata: RetroMetadata) => void
) {
	pb.collection('retro_metadata').subscribe(
		metadataId,
		function (e) {
			if (e.action === 'update') {
				console.log('Retro Metadata Subscription Hit:', e);

				const metadata = e.record;
				callback({
					id: metadata.id,
					parent_room: metadata.parent_room,
					items: parseItemsResponse(metadata.expand?.items || []),
					host: metadata.host
				});
			}
		},
		{
			expand: 'items,items.comments,items.votes'
		}
	);
}

function parseItemsResponse(itemsResponse: any[]): RetroItem[] {
	return itemsResponse.map((item) => {
		return {
			id: item.id,
			author: item.author,
			content: item.content,
			category: item.category,
			votes: parseVotesResponse(item.expand?.votes || []),
			comments: parseCommentsResponse(item.expand?.comments || [])
		};
	});
}

function parseVotesResponse(votesResponse: any[]): RetroVote[] {
	return votesResponse.map((vote) => {
		return {
			id: vote.id,
			voter: vote.voter
		};
	});
}

function parseCommentsResponse(commentsResponse: any[]): RetroComment[] {
	return commentsResponse.map((comment) => {
		return {
			id: comment.id,
			content: comment.comment,
			author: comment.author
		};
	});
}

export async function createRetroItem(
	metadataId: string,
	content: string,
	category: RetroItemCategory,
	author: string
): Promise<RetroItem> {
	const createdItem = await pb.collection('retro_items').create({
		content: content,
		category: category,
		author: author
	});

	await pb.collection('retro_metadata').update(metadataId, {
		'items+': createdItem.id
	});

	return {
		id: createdItem.id,
		author: createdItem.author,
		content: createdItem.content,
		category: createdItem.category,
		votes: [],
		comments: []
	};
}

export async function deleteRetroItem(id: string) {
	await pb.collection('retro_items').delete(id);
}

export async function upvoteRetroItem(itemId: string, userId: string) {
	const vote = await pb.collection('retro_votes').create({
		item: itemId,
		voter: userId
	});
	console.log('Created vote', vote);

	await pb.collection('retro_items').update(itemId, {
		'votes+': vote.id
	});
}

export async function deleteRetroItemUpvote(itemId: string, voteId: string) {
	await pb.collection('retro_votes').delete(voteId);
	await pb.collection('retro_items').update(itemId, {
		'votes-': voteId
	});
}

export async function createRetroItemComment(
	itemId: string,
	comment: string,
	author: string
): Promise<RetroComment> {
	const createdComment = await pb.collection('retro_comments').create({
		item: itemId,
		author: author,
		comment: comment
	});

	console.log('Created comment', createdComment);

	await pb.collection('retro_items').update(itemId, {
		'comments+': createdComment.id
	});

	return {
		id: createdComment.id,
		content: createdComment.comment,
		author: createdComment.author
	};
}

export async function deleteRetroItemComment(itemId: string, commentId: string) {
	await pb.collection('retro_comments').delete(commentId);

	await pb.collection('retro_items').update(itemId, {
		'comments-': commentId
	});
}
