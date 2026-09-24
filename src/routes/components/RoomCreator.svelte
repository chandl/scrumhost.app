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
	import { ArrowLeft, MessagesSquare, Plus, VoteIcon } from 'lucide-svelte';

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
			label: 'Sequential · 0–10'
		},
		{
			value: 'XS, S, M, L, XL, XXL, ?',
			label: 'T-shirt sizes · XS–XXL'
		},
		{
			value: '0, 1, 2, 3, 5, 8, 13, 21, ?',
			label: 'Fibonacci · 1, 2, 3, 5, 8, 13, 21'
		},
		{
			value: '0, 0.5, 1, 2, 3, 5, 8, 13, 20, ?',
			label: 'Modified Fibonacci · 0, ½, 1, 2, 3, 5, 8, 13, 20'
		}
	];

	let roomCreationStepState = $state('SELECT_ROOM_TYPE') as CreationStep;
	let isOpen = $state(false);
	let userRequestedClose = $state(false);
	let roomType = $state('') as RoomType | undefined;
	let effectiveStep = $derived((initialStep ?? roomCreationStepState) as CreationStep);
	let effectiveRoomType = $derived(initialRoomType ?? roomType);
	let effectiveIsOpen = $derived(
		(initialStep != null && !userRequestedClose) || (initialStep == null && isOpen)
	);
	let roomName = $state('');
	let pointValuesKey = $state(REFINEMENT_POINT_VALUES[0].value);
	let pointValues = $derived(
		REFINEMENT_POINT_VALUES.find((item) => item.value === pointValuesKey)
	) as PointValueSelection;

	let enableCreateRoomButton = $derived.by(() => {
		const type = effectiveRoomType ?? roomType;
		if (!type || !roomName) {
			return false;
		}
		return !(type === 'REFINEMENT' && !pointValues);
	});

	const ROOM_TYPE_OPTIONS = [
		{
			value: 'REFINEMENT',
			id: 'refinement',
			label: 'Backlog Refinement (Planning Poker)',
			description: 'Estimate stories together. Votes stay hidden until you reveal them.',
			icon: VoteIcon
		},
		{
			value: 'RETROSPECTIVE',
			id: 'retrospective',
			label: 'Sprint Retrospective',
			description: 'Share what went well, what to improve, and agree on action items.',
			icon: MessagesSquare
		}
	] as const;

	const FRIENDLY_ROOM_TYPE: Record<RoomType, string> = {
		REFINEMENT: 'backlog refinement',
		RETROSPECTIVE: 'retrospective'
	};

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
		roomType = '' as RoomType | undefined;
		roomCreationStepState = 'SELECT_ROOM_TYPE';
		roomName = '';
	}}
>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button size="lg" class="w-full" {...props}><Plus aria-hidden="true" />Create Room</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<div
				class="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"
				aria-hidden="true"
			>
				<span class="flex gap-1">
					<span class="h-1.5 w-6 rounded-full bg-primary"></span>
					<span
						class="h-1.5 w-6 rounded-full transition-colors duration-200 {effectiveStep ===
						'SELECT_ROOM_TYPE'
							? 'bg-muted-foreground/25'
							: 'bg-primary'}"
					></span>
				</span>
				Step {effectiveStep === 'SELECT_ROOM_TYPE' ? 1 : 2} of 2
			</div>
			<DialogTitle>Create a New Room</DialogTitle>
			<DialogDescription>
				{#if effectiveStep === 'SELECT_ROOM_TYPE'}
					Select the type of room to create.
				{:else}
					Set up your <strong class="font-medium text-foreground"
						>{effectiveRoomType ? FRIENDLY_ROOM_TYPE[effectiveRoomType] : ''}</strong
					> room details here. Click create when you're done.
				{/if}
			</DialogDescription>
		</DialogHeader>

		{#if effectiveStep === 'SELECT_ROOM_TYPE'}
			<RadioGroup bind:value={roomType} class="gap-3" aria-label="Room type">
				{#each ROOM_TYPE_OPTIONS as option (option.value)}
					<label
						for={option.id}
						class="flex cursor-pointer items-start gap-4 rounded-xl border bg-card p-4 transition-colors duration-150 hover:border-foreground/20 hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
					>
						<span
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<option.icon class="h-5 w-5" aria-hidden="true" />
						</span>
						<span class="min-w-0 flex-1">
							<span id="{option.id}-label" class="block font-medium">{option.label}</span>
							<span id="{option.id}-desc" class="mt-0.5 block text-sm text-muted-foreground">
								{option.description}
							</span>
						</span>
						<RadioGroupItem
							value={option.value}
							id={option.id}
							class="mt-0.5 focus-visible:ring-0 focus-visible:ring-offset-0"
							aria-labelledby="{option.id}-label"
							aria-describedby="{option.id}-desc"
						/>
					</label>
				{/each}
			</RadioGroup>
		{:else}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					if (!enableCreateRoomButton) return;
					handleCreateRoom();
					isOpen = false;
				}}
				class="grid gap-5"
			>
				<div class="grid gap-2">
					<Label for="room-name">Room name</Label>
					<Input
						id="room-name"
						data-testid="room-name-input"
						bind:value={roomName}
						placeholder="e.g. Sprint 42 refinement"
						autocomplete="off"
						autofocus
					/>
				</div>
				{#if effectiveRoomType === 'REFINEMENT'}
					<div class="grid gap-2">
						<Label for="point-values">Point scale</Label>
						<Select type="single" bind:value={pointValuesKey}>
							<SelectTrigger id="point-values">
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
			</form>
		{/if}

		<DialogFooter class="sm:justify-between">
			{#if effectiveStep === 'SELECT_ROOM_TYPE'}
				<span class="hidden sm:block"></span>
				<Button
					on:click={() => (roomCreationStepState = 'SET_ROOM_PROPERTIES')}
					disabled={!roomType}>Next</Button
				>
			{:else}
				{#if initialStep == null}
					<Button variant="ghost" on:click={() => (roomCreationStepState = 'SELECT_ROOM_TYPE')}>
						<ArrowLeft aria-hidden="true" />Back
					</Button>
				{:else}
					<span class="hidden sm:block"></span>
				{/if}
				<Button on:click={handleCreateRoom} disabled={!enableCreateRoomButton}>Create Room</Button>
			{/if}
		</DialogFooter>
	</DialogContent>
</Dialog>
