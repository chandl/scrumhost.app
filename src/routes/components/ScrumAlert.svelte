<script lang="ts">
	import { Description, Root, Title } from '$lib/components/ui/alert';
	import { CircleAlert } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let {
		title,
		body,
		duration,
		onClose
	}: { title: string; body: string; duration: number; onClose: () => void } = $props();

	let visible = $state(true);
	onMount(() => {
		if (duration > 0) {
			const timeout = setTimeout(() => {
				visible = false;
				onClose();
			}, duration);
			return () => clearTimeout(timeout);
		}
	});
</script>

{#if visible}
	<div class="fixed bottom-4">
		<Root variant="destructive">
			<CircleAlert class="h-4 w-4" />
			<Title>{title}</Title>
			<Description>
				{body}
			</Description>
		</Root>
	</div>
{/if}
