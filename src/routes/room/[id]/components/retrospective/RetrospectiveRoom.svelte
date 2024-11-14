<script lang="ts">
	import type { Participant, RoomDetails } from '$lib/scrum/types/room';

	let {
		parentRoom,
		participants,
		userParticipant
	}: {
		parentRoom: RoomDetails | undefined;
		participants: Participant[];
		userParticipant: Participant | undefined;
	} = $props();
</script>

HELLO WORLD!
