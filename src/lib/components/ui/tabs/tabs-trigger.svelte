<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className = undefined,
		value,
		children,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	class={cn(
		'inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-medium ring-offset-background transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-soft',
		className
	)}
	{value}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Trigger>
