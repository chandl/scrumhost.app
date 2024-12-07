<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import FeatureCard from './components/FeatureCard.svelte';
	import {
		ArrowUpCircle,
		GitMerge,
		ListTodo,
		MessageSquare,
		ThumbsUp,
		VoteIcon
	} from 'lucide-svelte';
	import Typewriter from './components/Typewriter.svelte';
	import SocialIcon from './components/SocialIcon.svelte';

	let currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>scrum.host - home</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-slate-100">
	<header class="px-4 py-6 sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<h1 class="text-2xl font-bold text-gray-900">scrum.host</h1>
			<a href="/join">
				<Button variant="outline">Join a Room</Button>
			</a>
		</div>
	</header>

	<main
		class="mx-auto flex w-full max-w-5xl flex-grow flex-col justify-center px-4 py-12 sm:px-6 lg:px-8"
	>
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
				Securely Collaborate on Team
				<Typewriter
					strings={['Retrospectives', 'Sprint Planning', 'Backlog Refinement']}
					typingSpeed={50}
					deletingSpeed={20}
					pause={6000}
				/>
			</h2>
			<p class="mb-8 text-xl text-gray-600">
				Realtime collaboration tool for backlog refinement and sprint retrospectives <span
					class="text-sm">(No account necessary, E2E Encrypted)</span
				>.
			</p>

			<a href="/join">
				<Button size="lg">Host a Room</Button>
			</a>
		</div>

		<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
			<FeatureCard icon={VoteIcon} title="Prioritize Tasks" />
			<FeatureCard icon={ThumbsUp} title="Gather Feedback" />
			<FeatureCard icon={ArrowUpCircle} title="Identify Improvements" />
			<FeatureCard icon={ListTodo} title="Track Action Items" />
			<FeatureCard icon={MessageSquare} title="Foster Discussions" />
			<FeatureCard icon={GitMerge} title="Ship Better Products" />
		</div>
	</main>

	<footer class="px-4 py-6 sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-7xl flex-col items-center">
			<div class="mb-2 flex space-x-4">
				<a
					href="https://discord.gg/uYY94zR6bq"
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-600 transition-colors hover:text-gray-900"
				>
					<SocialIcon name="discord" class="h-4 w-4" />
				</a>
				<a
					href="https://www.linkedin.com/in/chandler-severson/"
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-600 transition-colors hover:text-gray-900"
				>
					<SocialIcon name="linkedin" class="h-4 w-4" />
				</a>
				<a
					href="https://github.com/chandl"
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-600 transition-colors hover:text-gray-900"
				>
					<SocialIcon name="github" class="h-4 w-4" />
				</a>
			</div>
			<p class="text-center text-sm text-gray-500">
				&copy; {currentYear}
				<a href="https://www.linkedin.com/in/chandler-severson/">chandler severson</a> - built with ☕
			</p>
		</div>
	</footer>
</div>
