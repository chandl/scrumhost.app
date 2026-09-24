<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className = undefined,
		sideOffset = 4,
		children,
		...restProps
	}: TooltipPrimitive.ContentProps = $props();
</script>

<TooltipPrimitive.Content
	bind:ref
	{sideOffset}
	class={cn(
		'z-50 animate-fade-in overflow-hidden rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lift',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TooltipPrimitive.Content>
