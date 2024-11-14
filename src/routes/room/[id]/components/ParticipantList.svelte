<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tooltip, TooltipTrigger } from '$lib/components/ui/tooltip';
	import TooltipContent from '$lib/components/ui/tooltip/tooltip-content.svelte';
	import { CheckCircle, Copy, Users } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { Estimate } from '$lib/scrum/types/refinement';
	import type { Participant } from '$lib/scrum/types/room';

	let {
		currentUser,
		participants,
		currentVotes,
		showOtherParticipantVotes
	}: {
		currentUser: Participant | undefined;
		participants: Participant[];
		currentVotes: Estimate[];
		showOtherParticipantVotes: boolean;
	} = $props();

	let shareLink = $state(''); // Store the link to be shared
	let linkCopied = $state(false); // Track if the link was copied

	// Set the share link on component mount
	onMount(() => {
		shareLink = window.location.href; // Current page URL
	});

	// Function to copy link to clipboard
	function copyLink() {
		navigator.clipboard.writeText(shareLink).then(() => {
			linkCopied = true;
			setTimeout(() => (linkCopied = false), 2000); // Reset message after 2 seconds
		});
	}

	function getVoteForParticipant(participant_id: string): string | undefined {
		if (!currentVotes) {
			return undefined;
		}

		return currentVotes.find((vote) => vote.participant === participant_id)?.estimate;
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center">
			<Users class="mr-2" />
			Participants ({participants?.length})
		</CardTitle>
	</CardHeader>
	<CardContent>
		<!-- Share Link Section -->
		<div class="mb-4">
			<p class="text-sm text-gray-700">Share this link to invite others:</p>
			<div class="mt-2 flex items-center space-x-2">
				<input
					class="w-full rounded border px-2 py-1 text-sm"
					type="text"
					value={shareLink}
					readonly
				/>
				<button onclick={copyLink} class="rounded bg-blue-500 p-2 text-white hover:bg-blue-600">
					<Copy class="h-4 w-4" />
				</button>
			</div>
			{#if linkCopied}
				<p class="mt-1 text-sm text-green-600">Link copied to clipboard!</p>
			{/if}
		</div>

		<!-- Separator -->
		<hr class="my-4 border-t border-gray-300" />

		<!-- Participant List -->
		<ul class="space-y-2">
			{#each participants as participant}
				<li class="flex items-center space-x-2">
					<Avatar>
						<AvatarImage alt={participant.name} />
						<AvatarFallback>{participant.name[0]}</AvatarFallback>
					</Avatar>
					<span
						>{participant.name}{#if participant.id === currentUser?.id}&nbsp;(You){/if}</span
					>

					{#if getVoteForParticipant(participant.id) !== undefined}
						<Tooltip>
							<TooltipTrigger>
								<div class="flex space-x-2">
									<CheckCircle class="ml-2 h-4 w-4 text-green-500" />
									{#if showOtherParticipantVotes || participant.id === currentUser?.id}
										<Badge variant="outline">Vote: {getVoteForParticipant(participant.id)}</Badge>
									{/if}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>Voted for current task.</p>
								{#if !showOtherParticipantVotes && participant.id !== currentUser?.id}
									<p>See their vote during review phase.</p>
								{/if}
							</TooltipContent>
						</Tooltip>
					{/if}
				</li>
			{/each}
		</ul>
	</CardContent>
</Card>
