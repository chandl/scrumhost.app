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
	<div
		class="fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 animate-fade-in px-4"
		role="alert"
		aria-live="assertive"
	>
		<Root variant="destructive" class="shadow-lift">
			<CircleAlert class="h-4 w-4 shrink-0" />
			<Title>{title}</Title>
			<Description class="text-foreground-secondary">
				{body}
			</Description>
		</Root>
	</div>
{/if}
