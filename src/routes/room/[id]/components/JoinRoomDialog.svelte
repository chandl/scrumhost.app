<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';

	let isOpen = $state(true);
	let roomPassword = $state('');

	let { handleJoinRoom }: { handleJoinRoom: (password: string) => void } = $props();
</script>

<Dialog
	open={isOpen}
	onOpenChange={(open) => {
		isOpen = open;
	}}
>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>Join Room</DialogTitle>
			<DialogDescription>Enter the room password.</DialogDescription>
		</DialogHeader>
		<div class="grid gap-2 py-2">
			<form
				class="flex"
				onsubmit={(e) => {
					e.preventDefault();
					handleJoinRoom(roomPassword);
					isOpen = false;
				}}
			>
				<Input
					id="room-password"
					data-testid="join-room-password"
					bind:value={roomPassword}
					class="col-span-3"
					placeholder="Enter room password"
					autofocus
				/>
			</form>
		</div>
		<DialogFooter>
			<Button on:click={() => handleJoinRoom(roomPassword)}>Join Room</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
