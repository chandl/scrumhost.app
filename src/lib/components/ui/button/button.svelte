<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { type Events, type Props, buttonVariants } from './index.js';
	import { cn } from '$lib/utils.js';

	type $$Events = Events;

	let {
		variant = 'default',
		size = 'default',
		class: className,
		builders = [],
		...restProps
	}: Props = $props();

	// buttonVariants + cn produce a string; Bits UI Root expects ClassNameValue
	// @ts-expect-error - ClassValue from clsx not assignable to ClassNameValue from bits-ui
	const buttonClass = $derived(cn(buttonVariants({ variant, size, className })) as string);
</script>

<ButtonPrimitive.Root
	{builders}
	class={buttonClass}
	type="button"
	{...restProps as Record<string, unknown>}
	on:click
	on:keydown
>
	<!-- svelte-ignore slot_element_deprecated -- bits-ui Root expects slot; migrate when bits-ui supports snippets -->
	<slot />
</ButtonPrimitive.Root>
