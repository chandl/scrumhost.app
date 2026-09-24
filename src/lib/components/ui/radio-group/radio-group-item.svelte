<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import Circle from 'lucide-svelte/icons/circle';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value,
		class: className = undefined,
		...restProps
	}: RadioGroupPrimitive.ItemProps = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	{value}
	class={cn(
		'aspect-square h-5 w-5 shrink-0 rounded-full border border-input bg-card text-primary ring-offset-background transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<div class="flex items-center justify-center">
			{#if checked}
				<Circle class="h-2.5 w-2.5 animate-fade-in fill-current text-current" />
			{/if}
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
