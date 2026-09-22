<script lang="ts">
	import { type Props, buttonVariants } from './index.js';
	import { cn } from '$lib/utils.js';

	type $$Props = Props;

	let className: $$Props['class'] = undefined;
	export let variant: $$Props['variant'] = 'default';
	export let size: $$Props['size'] = 'default';
	export let href: string | undefined = undefined;
	export let type: $$Props['type'] = 'button';
	export { className as class };

	// buttonVariants + cn expect a string-like class value; className may be any ClassValue.
	$: buttonClass = cn(buttonVariants({ variant, size, className: className as string }));
</script>

{#if href}
	<a {href} class={buttonClass} {...$$restProps} role="button" on:click on:keydown>
		<slot />
	</a>
{:else}
	<button {type} class={buttonClass} {...$$restProps} on:click on:keydown>
		<slot />
	</button>
{/if}
