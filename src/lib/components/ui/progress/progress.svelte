<script lang="ts">
	import { Progress as ProgressPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className = undefined,
		max = 100,
		value = undefined,
		...restProps
	}: ProgressPrimitive.RootProps = $props();
</script>

<ProgressPrimitive.Root
	bind:ref
	{max}
	{value}
	class={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
	{...restProps}
>
	<div
		class="h-full w-full flex-1 rounded-full bg-primary transition-transform duration-300 ease-out"
		style={`transform: translateX(-${100 - (100 * (value ?? 0)) / (max ?? 1)}%)`}
	></div>
</ProgressPrimitive.Root>
