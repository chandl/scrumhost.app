<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tooltip, TooltipTrigger } from '$lib/components/ui/tooltip';
	import TooltipContent from '../../../../../lib/components/ui/tooltip/tooltip-content.svelte';
	import { CheckCircle, Copy, Users } from 'lucide-svelte';
	import type { Estimate } from '$lib/scrum/types/refinement';
	import type { Participant } from '$lib/scrum/types/room';

	let {
		currentUser,
		participants,
		currentVotes,
		showOtherParticipantVotes,
		roomPassword
	}: {
		currentUser: Participant | undefined;
		participants: Participant[];
		currentVotes: Estimate[];
		showOtherParticipantVotes: boolean;
		roomPassword: string;
	} = $props();

	let shareLink = $state(''); // Join link with #pwd= for sharing
	let linkCopied = $state(false);

	$effect(() => {
		if (roomPassword && typeof window !== 'undefined') {
			const currentLink = new URL(window.location.href);
			currentLink.hash = 'pwd=' + encodeURIComponent(roomPassword);
			shareLink = currentLink.toString();
		} else {
			shareLink = '';
		}
	});

	function copyLink() {
		if (!shareLink) return;
		navigator.clipboard.writeText(shareLink).then(() => {
			linkCopied = true;
			setTimeout(() => (linkCopied = false), 2000);
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
			<p class="text-sm text-gray-700 dark:text-gray-200">Share this link to invite others:</p>
			{#if roomPassword}
				<div class="mt-2 flex items-center space-x-2">
					<input
						class="w-full rounded border px-2 py-1 text-sm"
						type="text"
						value={shareLink}
						readonly
						data-testid="participant-share-link-input"
					/>
					<button
						onclick={copyLink}
						class="rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
						data-testid="participant-copy-link"
					>
						<Copy class="h-4 w-4" />
					</button>
				</div>
				{#if linkCopied}
					<p class="mt-1 text-sm text-green-600">Link copied to clipboard!</p>
				{/if}
			{:else}
				<p class="mt-1 text-sm text-amber-600 dark:text-amber-400" data-testid="share-link-no-password">
					Re-enter password to share link.
				</p>
			{/if}
		</div>

		<!-- Separator -->
		<hr class="my-4 border-t border-gray-300" />

		<!-- Participant List -->
		<ul class="space-y-2" data-testid="participant-list">
			{#each participants as participant}
				<li class="flex items-center space-x-2" data-testid="participant-item">
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
