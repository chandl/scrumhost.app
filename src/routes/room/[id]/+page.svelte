<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import {
		getRoom,
		getRoomParticipants,
		setActiveStory,
		setVotingFlag,
		subscribeToRoomUpdates,
		type RoomDetails
	} from '$lib/room';
	import { createStory, getStoriesInRoom, subscribeToNewStories, type Story } from '$lib/story';
	import { onMount } from 'svelte';

	const roomId = $page.params.id;
	let room: RoomDetails;
	let participants: any[];
	let stories: Story[];
	let activeStoryDetails: Story;

	function handleCreateStory() {
		createStory('Story Details Example', roomId);
	}

	function handleSetActiveStory(storyId: string) {
		setActiveStory(roomId, storyId);
	}

	function handleSetVotingFlag() {
		if (!room) {
			return;
		}
		// Flip the flag
		setVotingFlag(roomId, !room.is_voting_period);
	}

	function setActiveStoryDetails(room: RoomDetails) {
		if (!room.active_story_id) {
			return;
		}

		// Don't set active details if we can't find the story
		let details = stories.find((story) => story.id == room.active_story_id);
		if (details) {
			activeStoryDetails = details;
		}
	}

	onMount(async () => {
		room = await getRoom(roomId);
		stories = await getStoriesInRoom(roomId);

		setActiveStoryDetails(room);

		subscribeToRoomUpdates(roomId, (record) => {
			console.log('Room Update Received', record);
			room = record;
			setActiveStoryDetails(room);
		});

		subscribeToNewStories(roomId, (record) => {
			console.log('New Story Received:', record);
			stories = [record, ...stories];
		});

		participants = await getRoomParticipants(roomId);
		console.log('Participants', participants);
	});
</script>

<strong><a href="/">Home</a></strong>
<br />
<h1>Room Name: {room?.room_name}</h1>
<h1>Room Created: {room?.created}</h1>
<h1>Room Code: {room?.room_code}</h1>
<h1>Active Story: {activeStoryDetails?.details} - {activeStoryDetails?.id}</h1>
<h1>Point Values: {room?.point_values}</h1>
<h1>Voting Now: {room?.is_voting_period}</h1>

<Button on:click={handleSetVotingFlag}>Flip Voting Flag</Button>

<Button on:click={handleCreateStory}>Create Story</Button>
<br />

<h1>Participants</h1>
<ul>
	{#each participants as participant}
		<li>
			<strong>Name: {participant.name} - ID: {participant.id}</strong>
		</li>
	{/each}
</ul>

<h1>Stories</h1>
<ul>
	{#each stories as story}
		<li>
			<strong>{story.details}</strong> - Completed: {story.completed} - {story.created} - {story.final_estimate}
			<Button on:click={() => handleSetActiveStory(story.id)}>Set Active</Button>
		</li>
	{/each}
</ul>
