<script lang="ts">
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import type { Participant } from '$lib/scrum/types/room';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	let { participants }: { participants: Participant[] } = $props();
</script>

<div class="flex items-center space-x-1">
	{#each participants as participant}
		<Tooltip>
			<TooltipTrigger>
				<Avatar class="h-8 w-8">
					<AvatarFallback>{participant.name[0]}</AvatarFallback>
				</Avatar>
			</TooltipTrigger>
			<TooltipContent>
				<p>{participant.name}</p>
			</TooltipContent>
		</Tooltip>
	{/each}
</div>
