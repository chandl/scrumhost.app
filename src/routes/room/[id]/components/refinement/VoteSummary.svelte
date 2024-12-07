<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { ArrowUp, BarChart2 } from 'lucide-svelte';

	let { topVote, averageVote }: { topVote: string[]; averageVote: number | undefined } = $props();
</script>

<div class="mb-4 flex w-full gap-4">
	<Card class="flex-1">
		<CardHeader class="flex flex-row items-center justify-between space-y-0">
			<CardTitle class="text-sm font-medium">Top Vote(s)</CardTitle>
			<ArrowUp class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-4xl font-bold">{topVote ?? 'N/A'}</div>
			<p class="text-xs text-muted-foreground">Highest vote(s) received</p>
		</CardContent>
	</Card>
	{#if averageVote}
		<Card class="flex-1">
			<CardHeader class="flex flex-row items-center justify-between space-y-0">
				<CardTitle class="text-sm font-medium">Average Vote</CardTitle>
				<BarChart2 class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-4xl font-bold">
					{averageVote !== undefined ? averageVote.toFixed(1) : 'N/A'}
				</div>
				<p class="text-xs text-muted-foreground">Average of all votes</p>
			</CardContent>
		</Card>
	{/if}
</div>
