<script lang="ts">
	import type { RoomType } from '$lib/scrum/types/room';
	import { MessagesSquare, VoteIcon } from 'lucide-svelte';

	let { type, short = false }: { type: RoomType | undefined; short?: boolean } = $props();

	const labels: Record<RoomType, { full: string; short: string }> = {
		REFINEMENT: { full: 'Planning poker', short: 'Refinement' },
		RETROSPECTIVE: { full: 'Retrospective', short: 'Retro' }
	};
</script>

{#if type}
	<span
		class="inline-flex shrink-0 items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium text-foreground-secondary"
	>
		{#if type === 'REFINEMENT'}
			<VoteIcon class="h-3.5 w-3.5" aria-hidden="true" />
		{:else}
			<MessagesSquare class="h-3.5 w-3.5" aria-hidden="true" />
		{/if}
		{short ? labels[type].short : labels[type].full}
	</span>
{/if}
