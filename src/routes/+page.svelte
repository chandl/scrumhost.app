<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import FeatureCard from './components/FeatureCard.svelte';
	import {
		ArrowRight,
		ArrowUpCircle,
		ListTodo,
		LockKeyhole,
		MessageSquare,
		ThumbsUp,
		VoteIcon
	} from 'lucide-svelte';
	import SocialIcon from './components/SocialIcon.svelte';
	import Logo from './components/Logo.svelte';
	import ThemeSwitchButton from './components/ThemeSwitchButton.svelte';
	import { cn } from '$lib/utils';

	let currentYear = new Date().getFullYear();

	const features = [
		{
			icon: VoteIcon,
			title: 'Estimate together',
			description: 'Planning poker with votes hidden until everyone is ready.'
		},
		{
			icon: ThumbsUp,
			title: 'Gather feedback',
			description: 'Collect what went well and what to improve, side by side.'
		},
		{
			icon: ArrowUpCircle,
			title: 'Surface improvements',
			description: 'Upvote the ideas that matter so the team can focus.'
		},
		{
			icon: ListTodo,
			title: 'Track action items',
			description: 'Leave every retro with clear, agreed next steps.'
		},
		{
			icon: MessageSquare,
			title: 'Discuss in context',
			description: 'Comment on items right where the conversation started.'
		},
		{
			icon: LockKeyhole,
			title: 'Private by default',
			description: 'No accounts needed. Room content is end-to-end encrypted.'
		}
	];

	const socialLinkClass =
		'inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<svelte:head>
	<title>scrumhost: calm sprint ceremonies for your team</title>
	<meta
		name="description"
		content="Real-time planning poker and sprint retrospectives. No accounts, end-to-end encrypted."
	/>
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<header class="px-4 sm:px-6">
		<div class="mx-auto flex h-16 max-w-5xl items-center justify-between">
			<Logo class="text-lg" />
			<ThemeSwitchButton />
		</div>
	</header>

	<main class="mx-auto flex w-full max-w-5xl flex-grow flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-20">
		<section class="mx-auto max-w-2xl text-center">
			<h1 class="text-balance text-4xl font-semibold tracking-[-0.025em] sm:text-5xl">
				Run better sprint ceremonies, together.
			</h1>
			<p class="mx-auto mt-5 max-w-xl text-pretty text-lg text-foreground-secondary">
				Planning poker for Backlog Refinement and a shared board for Sprint Retrospectives, in real
				time. No sign-up, end-to-end encrypted.
			</p>

			<div
				class="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
			>
				<a href="/join" class={cn(buttonVariants({ size: 'lg' }))}>
					Create Room
					<ArrowRight aria-hidden="true" />
				</a>
				<a href="/join" class={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>
					Join a Room
				</a>
			</div>
		</section>

		<section aria-label="Features" class="mt-16 sm:mt-24">
			<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature}
					<li>
						<FeatureCard {...feature} />
					</li>
				{/each}
			</ul>
		</section>
	</main>

	<footer class="border-t px-4 py-8 sm:px-6">
		<div
			class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row"
		>
			<div class="flex items-center gap-4">
				<p>
					&copy; {currentYear}
					<a
						href="https://chandl.io"
						class="underline-offset-4 hover:text-foreground hover:underline">chandl.io</a
					>
				</p>
				<a
					href="/privacy"
					class="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>Privacy</a
				>
			</div>
			<div class="flex items-center gap-1">
				<a
					href="https://discord.gg/uYY94zR6bq"
					target="_blank"
					rel="noopener noreferrer"
					class={socialLinkClass}
					aria-label="Discord"
				>
					<SocialIcon name="discord" class="h-4 w-4 fill-current" />
				</a>
				<a
					href="https://www.linkedin.com/in/chandler-severson/"
					target="_blank"
					rel="noopener noreferrer"
					class={socialLinkClass}
					aria-label="LinkedIn"
				>
					<SocialIcon name="linkedin" class="h-4 w-4 fill-current" />
				</a>
				<a
					href="https://github.com/chandl"
					target="_blank"
					rel="noopener noreferrer"
					class={socialLinkClass}
					aria-label="GitHub"
				>
					<SocialIcon name="github" class="h-4 w-4 fill-current" />
				</a>
			</div>
		</div>
	</footer>
</div>
