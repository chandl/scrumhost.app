<script lang="ts">
	import { Icon } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	let { icon, title }: { icon: ComponentType<Icon>; title: string } = $props();
	import { Card, CardContent } from '$lib/components/ui/card';
</script>

<Card class="border-none  drop-shadow-md">
	<CardContent class="flex flex-col items-center justify-center p-6">
		<div class="mb-4 text-blue-500">
			<Icon class="h-8 w-8"><svelte:component this={icon} /></Icon>
		</div>
		<h3 class="font-medium text-gray-900">{title}</h3>
	</CardContent>
</Card>
