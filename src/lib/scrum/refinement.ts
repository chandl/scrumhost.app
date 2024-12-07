import pb from '$lib/pocketbase/pocketbase';
import { joinRoomAndGetParticipantDetails } from '$lib/scrum/room';
import type {
	RefinementMetadata,
	RefinementMetadataDetails,
	RefinementRoomStatus
} from '$lib/scrum/types/refinement';
import type { Room } from '$lib/scrum/types/room';
import { getRoomKeyCookie } from '$lib/utils';

export async function initRefinementMetadata(
	parentRoom: Room,
	pointValues: string
): Promise<RefinementMetadata> {
	try {
		const participant = await joinRoomAndGetParticipantDetails(
			parentRoom.id,
			getRoomKeyCookie(parentRoom.id)
		);
		const refinementRoomData = {
			point_values: pointValues,
			active_story: null,
			room_status: 'IDLE',
			host: participant.id,
			parent_room: parentRoom.id
		};

		const refinementMetadata = await pb
			.collection('refinement_metadata')
			.create(refinementRoomData);

		return {
			id: refinementMetadata.id,
			point_values: refinementMetadata.point_values,
			active_story: refinementMetadata.active_story,
			room_status: refinementMetadata.room_status,
			parent_room: refinementMetadata.parent_room,
			host: refinementMetadata.host,
			stories: refinementMetadata.stories
		};
	} catch (err) {
		console.error('Error initializing refinement room:', err);
		throw err;
	}
}

export async function getRefinementMetadataDetails(
	parentRoomId: string
): Promise<RefinementMetadataDetails> {
	console.log('Get details with', parentRoomId);
	const metadata = await pb
		.collection('refinement_metadata')
		.getFirstListItem(`parent_room = "${parentRoomId}"`, {
			expand: 'stories',
			fields:
				'id,point_values,room_status,parent_room,host,active_story,' +
				'expand.stories.id,expand.stories.details,expand.stories.story_status,expand.stories.updated'
		});
	console.log('Found metadata', metadata);

	return {
		id: metadata.id,
		point_values: metadata.point_values,
		active_story: metadata.active_story,
		room_status: metadata.room_status,
		parent_room: metadata.parent_room,
		host: metadata.host,
		stories: metadata.expand?.stories
	};
}

export function subscribeToRefinementMetadataUpdates(
	metadataId: string,
	callback: (record: RefinementMetadataDetails) => void
) {
	pb.collection('refinement_metadata').subscribe(
		metadataId,
		function (e) {
			const metadata = e.record;
			if (e.action == 'update') {
				console.log('SEEN UPDATED MDATA', metadata);
				callback({
					id: metadata.id,
					point_values: metadata.point_values,
					active_story: metadata.active_story,
					room_status: metadata.room_status,
					parent_room: metadata.parent_room,
					host: metadata.host,
					stories: metadata.expand?.stories
				});
			}
		},
		{
			expand: 'stories',
			fields:
				'id,point_values,room_status,parent_room,host,active_story,' +
				'expand.stories.id,expand.stories.details,expand.stories.story_status,expand.stories.updated'
		}
	);
}

export async function setRefinementMetadataStatus(
	metadataId: string,
	metadataState: RefinementRoomStatus
) {
	try {
		const record = await pb
			.collection('refinement_metadata')
			.update(metadataId, { room_status: metadataState });
		console.log(`Set Metadata ${metadataId} state to ${metadataState}`, record);
	} catch (err) {
		console.error('Failed to set metadata state', err);
		throw err;
	}
}

export async function setActiveStory(metadataId: string, storyId: string | null) {
	try {
		const record = await pb
			.collection('refinement_metadata')
			.update(metadataId, { active_story: storyId });
		console.log(`Set metadata ${metadataId} active story to ${storyId}`, record);
	} catch (err) {
		console.error('Failed to set active story in room', err);
		throw err;
	}
}
