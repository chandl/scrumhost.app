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
	import { initRetroMetadata } from '$lib/scrum/retro';

	import type { RoomType } from '$lib/scrum/types/room';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';

	interface PointValueSelection {
		value: string;
		label: string;
	}
	type CreationStep = 'SELECT_ROOM_TYPE' | 'SET_ROOM_PROPERTIES';

	let { initialStep, initialRoomType }: { initialStep?: CreationStep; initialRoomType?: RoomType } =
		$props();

	const REFINEMENT_POINT_VALUES: PointValueSelection[] = [
		{
			value: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ?',
			label: 'Sequential (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)'
		},
		{
			value: 'XS, S, M, L, XL, XXL, ?',
			label: 'T-Shirt (XS, S, M, L, XL, XXL)'
		},
		{
			value: '0, 1, 2, 3, 5, 8, 13, 21, ?',
			label: 'Fibonacci (1, 2, 3, 5, 8, 13, 21)'
		},
		{
			value: '0, 0.5, 1, 2, 3, 5, 8, 13, 20, ?',
			label: 'Scrum (0, 0.5, 1, 2, 3, 5, 8, 13, 20)'
		}
	];

	let roomCreationStepState = $state('SELECT_ROOM_TYPE') as CreationStep;
	let isOpen = $state(false);
	let userRequestedClose = $state(false);
	let roomType = $state() as RoomType | undefined;
	let effectiveStep = $derived((initialStep ?? roomCreationStepState) as CreationStep);
	let effectiveRoomType = $derived(initialRoomType ?? roomType);
	let effectiveIsOpen = $derived(
		(initialStep != null && !userRequestedClose) || (initialStep == null && isOpen)
	);
	let roomName = $state('');
	let pointValues = $state(REFINEMENT_POINT_VALUES[0]) as PointValueSelection;

	let enableCreateRoomButton = $derived.by(() => {
		const type = effectiveRoomType ?? roomType;
		if (!type || !roomName) {
			return false;
		}
		return !(type === 'REFINEMENT' && !pointValues);
	});

	async function handleCreateRoom() {
		const type = effectiveRoomType ?? roomType;
		if (!type) {
			throw new Error("Can't create room with undefined type");
		}
		const room = await createRoom(roomName, type);
		console.log('Created room: ', room);

		switch (type) {
			case 'REFINEMENT':
				console.log(
					'Created refinementMetadata',
					await initRefinementMetadata(room, pointValues.value)
				);
				break;
			case 'RETROSPECTIVE':
				console.log('Created retrospectiveMetadata', await initRetroMetadata(room));
				break;
			default:
				throw Error('Unknown room type, cannot create metadata');
		}

		goto(`/room/${room.id}`);
	}
</script>

<Dialog
	open={effectiveIsOpen}
	onOpenChange={(open) => {
		isOpen = open;
		if (open) userRequestedClose = false;
		else userRequestedClose = true;
		roomType = undefined;
		roomCreationStepState = 'SELECT_ROOM_TYPE';
		roomName = '';
	}}
>
	<DialogTrigger asChild>
		<Button
			class="w-full py-6 text-lg"
			on:click={() => {
				isOpen = true;
				userRequestedClose = false;
			}}
			>Create Room</Button
		>
	</DialogTrigger>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>Create a New Room</DialogTitle>
			<DialogDescription>
				{#if effectiveStep === 'SELECT_ROOM_TYPE'}
					Select the type of room to create.
				{:else}
					Set up your <strong>{effectiveRoomType?.toLowerCase()}</strong> room details here. Click create
					when you're done.
				{/if}
			</DialogDescription>
		</DialogHeader>

		<div class="grid gap-4 py-4">
			{#if effectiveStep === 'SELECT_ROOM_TYPE'}
				<RadioGroup bind:value={roomType}>
					<div class="flex items-center space-x-2">
						<RadioGroupItem value="REFINEMENT" id="refinement" />
						<Label for="refinement">Backlog Refinement (Planning Poker)</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroupItem value="RETROSPECTIVE" id="retrospective" />
						<Label for="retrospective">Sprint Retrospective</Label>
					</div>
				</RadioGroup>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateRoom();
						isOpen = false;
					}}
					class="grid grid-cols-4 items-center gap-4"
				>
					<Label for="room-name" class="text-right">Room Name</Label>
					<Input
						id="room-name"
						data-testid="room-name-input"
						bind:value={roomName}
						class="col-span-3"
						placeholder="Enter room name"
						autofocus
					/>
				</form>
				{#if effectiveRoomType === 'REFINEMENT'}
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="point-values" class="text-right">Point Values</Label>
						<Select bind:selected={pointValues}>
							<SelectTrigger class="col-span-3" id="point-values">
								<SelectValue placeholder="Select point values" />
							</SelectTrigger>
							<SelectContent>
								{#each REFINEMENT_POINT_VALUES as items}
									<SelectItem value={items.value}>{items.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				{/if}
			{/if}
		</div>
		<DialogFooter>
			{#if effectiveStep === 'SELECT_ROOM_TYPE'}
				<Button
					on:click={() => (roomCreationStepState = 'SET_ROOM_PROPERTIES')}
					disabled={!roomType}>Next</Button
				>
			{:else}
				<Button on:click={handleCreateRoom} disabled={!enableCreateRoomButton}>Create Room</Button>
			{/if}
		</DialogFooter>
	</DialogContent>
</Dialog>
