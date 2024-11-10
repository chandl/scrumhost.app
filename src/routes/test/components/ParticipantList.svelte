<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tooltip, TooltipTrigger } from '$lib/components/ui/tooltip';
	import TooltipContent from '$lib/components/ui/tooltip/tooltip-content.svelte';
	import { CheckCircle, Users } from 'lucide-svelte';

	let { participants }: { participants: any[] } = $props();
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center">
			<Users class="mr-2" />
			Participants ({participants?.length})
		</CardTitle>
	</CardHeader>
	<CardContent>
		<ul class="space-y-2">
			{#each participants as participant}
				<li class="flex items-center space-x-2">
					<Avatar>
						<AvatarImage src={participant.avatar} alt={participant.name} />
						<AvatarFallback>{participant.name[0]}</AvatarFallback>
					</Avatar>
					<span>{participant.name}</span>

					<Tooltip>
						<TooltipTrigger>
							<CheckCircle class="ml-2 h-4 w-4 text-green-500" />
						</TooltipTrigger>
						<TooltipContent>
							<p>Voted for current story</p>
						</TooltipContent>
					</Tooltip>
				</li>
			{/each}
		</ul>
	</CardContent>
</Card>
