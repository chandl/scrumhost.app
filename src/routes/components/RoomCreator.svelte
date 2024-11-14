<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import { createRoom } from '$lib/scrum/room';
	import { initRefinementMetadata } from '$lib/scrum/refinement';

	interface SelectionState {
		value: string;
		label: string;
	}

	let isOpen = $state(false);
	let roomName = $state('');
	let pointValues = $state() as SelectionState;

	async function handleCreateRoom() {
		const room = await createRoom(roomName, 'REFINEMENT');
		console.log('Created room: ', room);

		const refinementMetadata = await initRefinementMetadata(room, pointValues.value);
		console.log('Created refinementMetadata', refinementMetadata);

		goto(`/room/${room.id}`);
	}
</script>

<Dialog
	open={isOpen}
	onOpenChange={(open) => {
		isOpen = open;
	}}
>
	<DialogTrigger asChild>
		<Button class="w-full py-6 text-lg" on:click={() => (isOpen = true)}>Create Room</Button>
	</DialogTrigger>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>Create a New Room</DialogTitle>
			<DialogDescription>
				Set up your room details here. Click create when you're done.
			</DialogDescription>
		</DialogHeader>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="room-name" class="text-right">Room Name</Label>
				<Input
					id="room-name"
					bind:value={roomName}
					class="col-span-3"
					placeholder="Enter room name"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="point-values" class="text-right">Point Values</Label>
				<Select bind:selected={pointValues}>
					<SelectTrigger class="col-span-3" id="point-values">
						<SelectValue placeholder="Select point values" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0, 0.5, 1, 2, 3, 5, 8, 13, 20, ?"
							>Scrum (0, 0.5, 1, 2, 3, 5, 8, 13, 20)</SelectItem
						>
						<SelectItem value="0, 1, 2, 3, 5, 8, 13, 21, ?"
							>Fibonacci (1, 2, 3, 5, 8, 13, 21)</SelectItem
						>
						<SelectItem value="0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ?"
							>Sequential (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)</SelectItem
						>
						<SelectItem value="XS, S, M, L, XL, XXL, ?">T-Shirt (XS, S, M, L, XL, XXL)</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
		<DialogFooter>
			<Button on:click={handleCreateRoom} disabled={!roomName || !pointValues}>Create Room</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
