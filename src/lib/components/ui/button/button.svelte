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
	const rest = restProps as Record<string, unknown>;
</script>

<ButtonPrimitive.Root {builders} class={buttonClass} type="button" {...rest} on:click on:keydown>
	<slot />
</ButtonPrimitive.Root>
