<script lang="ts">
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Check, Copy } from 'lucide-svelte';
	import type { Estimate } from '$lib/scrum/types/refinement';
	import type { Participant } from '$lib/scrum/types/room';

	let {
		currentUser,
		participants,
		currentVotes,
		showOtherParticipantVotes,
		roomPassword,
		trackVotes = false,
		layout = 'stack'
	}: {
		currentUser: Participant | undefined;
		participants: Participant[];
		currentVotes: Estimate[];
		showOtherParticipantVotes: boolean;
		roomPassword: string;
		/** Show voted / waiting status (refinement voting & review) */
		trackVotes?: boolean;
		/** 'row' lays participants out horizontally (retro, below the lanes) */
		layout?: 'stack' | 'row';
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

<section class="rounded-xl border bg-card p-4 shadow-soft" aria-labelledby="participants-heading">
	<div class="mb-3 flex items-center justify-between gap-2">
		<h2 id="participants-heading" class="text-base">
			Participants <span class="font-normal tabular-nums text-muted-foreground"
				>{participants?.length}</span
			>
		</h2>
		{#if trackVotes}
			<span class="text-xs tabular-nums text-muted-foreground">
				{currentVotes?.length ?? 0} voted
			</span>
		{/if}
	</div>

	<ul
		class={layout === 'row' ? 'flex flex-wrap gap-x-5 gap-y-2' : 'space-y-1'}
		data-testid="participant-list"
	>
		{#each participants as participant (participant.id)}
			{@const vote = getVoteForParticipant(participant.id)}
			{@const isYou = participant.id === currentUser?.id}
			<li class="flex min-h-10 items-center gap-3" data-testid="participant-item">
				<div class="relative">
					<Avatar class="h-8 w-8">
						<AvatarFallback class={isYou ? 'bg-primary/15 text-primary' : ''}
							>{participant.name[0]}</AvatarFallback
						>
					</Avatar>
					{#if trackVotes && vote !== undefined}
						<span
							class="absolute -bottom-1 -right-1.5 flex h-4 w-4 animate-fade-in items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-card"
							title="Voted"
						>
							<Check class="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
						</span>
					{/if}
				</div>
				<span class="min-w-0 flex-1 truncate text-[15px]"
					>{participant.name}{#if isYou}<span class="text-muted-foreground">&nbsp;(You)</span
						>{/if}</span
				>
				{#if trackVotes}
					{#if vote !== undefined}
						{#if showOtherParticipantVotes || isYou}
							<span
								class="min-w-8 rounded-md border bg-background px-2 py-0.5 text-center text-sm font-semibold tabular-nums"
								>{vote.trim()}</span
							>
						{:else}
							<span class="text-xs font-medium text-success">Voted</span>
						{/if}
					{:else if layout === 'stack'}
						<span class="text-xs text-muted-foreground">Waiting…</span>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>

	<!-- Invite link -->
	<div class="mt-4 border-t pt-4">
		{#if roomPassword}
			<label for="participant-share-link" class="mb-1.5 block text-xs text-muted-foreground"
				>Invite link (includes the password)</label
			>
			<div class="flex items-center gap-2">
				<input
					id="participant-share-link"
					class="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-sm text-foreground-secondary focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
					type="text"
					value={shareLink}
					readonly
					onfocus={(e) => e.currentTarget.select()}
					data-testid="participant-share-link-input"
				/>
				<Button
					onclick={copyLink}
					variant="outline"
					size="icon"
					class="h-9 w-9 shrink-0"
					data-testid="participant-copy-link"
					aria-label="Copy invite link"
					title="Copy invite link"
				>
					{#if linkCopied}<Check class="text-success" />{:else}<Copy />{/if}
				</Button>
			</div>
			<p class="mt-1.5 h-4 text-xs text-success" aria-live="polite">
				{linkCopied ? 'Link copied to clipboard' : ''}
			</p>
		{:else}
			<p class="text-sm text-warning" data-testid="share-link-no-password">
				Re-enter password to share link.
			</p>
		{/if}
	</div>
</section>
