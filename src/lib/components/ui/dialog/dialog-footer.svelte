<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<div
	class={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
	{...$$restProps}
>
	<slot />
</div>
