<script lang="ts">
	export let strings: string[] = [];
	export let typingSpeed: number = 100; // Speed for typing
	export let deletingSpeed: number = 50; // Speed for deleting
	export let pause: number = 1000; // Pause between strings

	let displayText = ''; // Text to display
	let stringIndex = 0; // Current string index
	let isDeleting = false; // Whether we are deleting
	let timer: ReturnType<typeof setTimeout>; // Reference to the timeout

	const type = () => {
		const currentString = strings[stringIndex];
		if (!currentString) return;

		if (isDeleting) {
			// Deleting characters
			displayText = currentString.slice(0, displayText.length - 1);
		} else {
			// Typing characters
			displayText = currentString.slice(0, displayText.length + 1);
		}

		// If the string is fully typed, pause before deleting
		if (!isDeleting && displayText === currentString) {
			setTimeout(() => {
				isDeleting = true;
				type();
			}, pause);
			return;
		}

		// If the string is fully deleted, move to the next string
		if (isDeleting && displayText === '') {
			isDeleting = false;
			stringIndex = (stringIndex + 1) % strings.length; // Loop back to the start
		}

		// Adjust the speed based on typing or deleting
		timer = setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
	};

	import { onMount } from 'svelte';

	onMount(() => {
		type();
		return () => clearTimeout(timer); // Clean up the timer
	});
</script>

<!-- Display the current text with a blinking cursor -->
<span class="inline-flex items-center font-mono">
	{displayText}
	<span class="ml-1 h-[1em] w-[2px] animate-blink bg-black"></span>
</span>
