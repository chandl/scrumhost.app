<script lang="ts">
	import type { ComponentType } from 'svelte';
	import type { Icon } from 'lucide-svelte';

	let {
		icon,
		title,
		description
	}: { icon: ComponentType<Icon>; title: string; description: string } = $props();
	const IconComponent = $derived(icon);
</script>

<div class="flex h-full gap-4 rounded-xl border bg-card p-5 shadow-soft">
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
	>
		<IconComponent class="h-5 w-5" aria-hidden="true" />
	</div>
	<div class="min-w-0">
		<h2 class="text-[15px] font-semibold">{title}</h2>
		<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
	</div>
</div>
