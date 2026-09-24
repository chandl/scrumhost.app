<script lang="ts">
	import { Sparkles } from 'lucide-svelte';

	let {
		topVote,
		averageVote,
		consensus = false
	}: { topVote: string[]; averageVote: number | undefined; consensus?: boolean } = $props();

	let topLabel = $derived(topVote.length > 0 ? topVote.join(' / ') : '–');
</script>

<!-- The one "delight" moment: result tiles flip in on reveal (reduced-motion: instant) -->
<div class="grid grid-cols-2 gap-3 [perspective:800px]">
	<div
		class="animate-reveal rounded-xl border p-4 sm:p-5 {consensus
			? 'border-primary/40 bg-primary/[0.07]'
			: 'bg-background/60'}"
	>
		<p
			class="flex items-center gap-1.5 text-sm font-medium {consensus
				? 'text-primary'
				: 'text-muted-foreground'}"
		>
			{#if consensus}
				<Sparkles class="h-4 w-4" aria-hidden="true" />Consensus
			{:else}
				{topVote.length > 1 ? 'Most votes (tie)' : 'Most votes'}
			{/if}
		</p>
		<p
			class="mt-1 break-words text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl {consensus
				? 'text-primary'
				: ''}"
		>
			{topLabel}
		</p>
	</div>
	<div
		class="animate-reveal rounded-xl border bg-background/60 p-4 sm:p-5"
		style="animation-delay: 60ms"
	>
		<p class="text-sm font-medium text-muted-foreground">Average</p>
		<p class="mt-1 text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
			{averageVote !== undefined ? averageVote.toFixed(1) : '–'}
		</p>
	</div>
</div>
