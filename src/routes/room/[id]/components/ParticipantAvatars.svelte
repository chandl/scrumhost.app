<script lang="ts">
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import type { Participant } from '$lib/scrum/types/room';

	// Compact presence stack for the room header (the full list lives in ParticipantList)
	let {
		participants,
		currentUserId,
		max = 5
	}: { participants: Participant[]; currentUserId?: string; max?: number } = $props();

	let visible = $derived(participants.slice(0, max));
	let overflow = $derived(Math.max(0, participants.length - max));
</script>

<div class="flex items-center gap-2" aria-label="{participants.length} in the room">
	<div class="flex -space-x-2">
		{#each visible as participant (participant.id)}
			<Tooltip>
				<TooltipTrigger
					class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<Avatar class="h-8 w-8 ring-2 ring-background">
						<AvatarFallback
							class={participant.id === currentUserId ? 'bg-primary/15 text-primary' : ''}
							>{participant.name[0]}</AvatarFallback
						>
					</Avatar>
				</TooltipTrigger>
				<TooltipContent>
					{participant.name}{participant.id === currentUserId ? ' (you)' : ''}
				</TooltipContent>
			</Tooltip>
		{/each}
		{#if overflow > 0}
			<span
				class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground-secondary ring-2 ring-background"
				>+{overflow}</span
			>
		{/if}
	</div>
	<span class="text-sm tabular-nums text-muted-foreground">{participants.length} here</span>
</div>
