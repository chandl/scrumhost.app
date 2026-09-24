<script lang="ts">
	import { Check, EyeOff, KeyRound, Link2, Lock, Server, UserRound } from 'lucide-svelte';

	const encrypted = [
		'Backlog stories you estimate',
		'Retrospective items',
		'Comments on retro items'
	];
	const visible = [
		'Room name, room code, and room type',
		'Display names of people in the room',
		'Estimates (vote values) and upvote counts',
		'When things were created or changed'
	];
</script>

<svelte:head>
	<title>Privacy & security · scrumhost</title>
	<meta
		name="description"
		content="How scrumhost protects your meeting content with end-to-end encryption, and what the server can and can't see."
	/>
</svelte:head>

<main class="mx-auto w-full max-w-2xl flex-grow px-4 py-10 sm:px-6 sm:py-16">
	<header class="mb-10">
		<p class="text-sm font-medium text-primary">Privacy & security</p>
		<h1 class="mt-2 text-3xl leading-tight sm:text-4xl">Your meeting notes stay yours</h1>
		<p class="mt-4 text-lg text-foreground-secondary">
			scrumhost encrypts what your team writes in your browser, before it reaches our server. Here's
			exactly what that covers and what it doesn't, in plain language.
		</p>
	</header>

	<div class="space-y-10">
		<!-- What's protected -->
		<section aria-labelledby="protected-heading">
			<h2 id="protected-heading" class="mb-4 text-xl">What's protected</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-xl border bg-card p-5 shadow-soft">
					<div class="mb-3 flex items-center gap-2 font-medium">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success"
						>
							<Lock class="h-4 w-4" aria-hidden="true" />
						</span>
						End-to-end encrypted
					</div>
					<ul class="space-y-2 text-[15px] text-foreground-secondary">
						{#each encrypted as item}
							<li class="flex gap-2">
								<Check class="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{item}
							</li>
						{/each}
					</ul>
					<p class="mt-3 text-sm text-muted-foreground">
						Only people with the room password can read these.
					</p>
				</div>
				<div class="rounded-xl border bg-card p-5 shadow-soft">
					<div class="mb-3 flex items-center gap-2 font-medium">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground-secondary"
						>
							<Server class="h-4 w-4" aria-hidden="true" />
						</span>
						Visible to the server
					</div>
					<ul class="space-y-2 text-[15px] text-foreground-secondary">
						{#each visible as item}
							<li class="flex gap-2">
								<span
									class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground"
									aria-hidden="true"
								></span>{item}
							</li>
						{/each}
					</ul>
					<p class="mt-3 text-sm text-muted-foreground">
						Needed to run the room, so avoid putting sensitive details in room names.
					</p>
				</div>
			</div>
		</section>

		<!-- How it works -->
		<section aria-labelledby="how-heading">
			<h2 id="how-heading" class="mb-4 text-xl">How it works</h2>
			<ol class="space-y-5">
				<li class="flex gap-4">
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
					>
						<KeyRound class="h-4 w-4" aria-hidden="true" />
					</span>
					<div>
						<h3 class="font-medium">Every room gets its own password</h3>
						<p class="mt-1 text-foreground-secondary">
							When you create a room, your browser generates a random password. The server only
							receives a one-way fingerprint (a SHA-256 hash) of it, which it uses to check that
							people joining have the right password. The password itself is never sent to our
							database.
						</p>
					</div>
				</li>
				<li class="flex gap-4">
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
					>
						<Lock class="h-4 w-4" aria-hidden="true" />
					</span>
					<div>
						<h3 class="font-medium">Content is encrypted on your device</h3>
						<p class="mt-1 text-foreground-secondary">
							Before a story, retro item, or comment leaves your browser, it's encrypted with
							AES-256-GCM using a key derived from the room password (PBKDF2, SHA-256, 100,000
							iterations, with a fresh random salt and IV for every message). The server stores only
							the scrambled result, and your teammates' browsers decrypt it locally.
						</p>
					</div>
				</li>
				<li class="flex gap-4">
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
					>
						<Link2 class="h-4 w-4" aria-hidden="true" />
					</span>
					<div>
						<h3 class="font-medium">Invite links keep the password out of requests</h3>
						<p class="mt-1 text-foreground-secondary">
							An invite link carries the password after the <code
								class="rounded bg-muted px-1 py-0.5 font-mono text-sm">#</code
							> in the address. Browsers never send that part of a link to a server, so the password goes
							straight from the link to your teammate's browser. Anyone with the link can join the room,
							so share it like you would a meeting password.
						</p>
					</div>
				</li>
				<li class="flex gap-4">
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
					>
						<UserRound class="h-4 w-4" aria-hidden="true" />
					</span>
					<div>
						<h3 class="font-medium">No sign-up, no email</h3>
						<p class="mt-1 text-foreground-secondary">
							You only enter a display name. scrumhost creates an anonymous account for you behind
							the scenes; there's no email address, phone number, or real password to leak.
						</p>
					</div>
				</li>
			</ol>
		</section>

		<!-- On your device -->
		<section aria-labelledby="device-heading" class="rounded-xl border bg-card p-5 shadow-soft">
			<h2 id="device-heading" class="mb-2 flex items-center gap-2 text-lg">
				<EyeOff class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
				What's stored on your device
			</h2>
			<ul class="list-disc space-y-1.5 pl-5 text-[15px] text-foreground-secondary">
				<li>Your session, so you stay signed in (in your browser's local storage).</li>
				<li>
					The password for each room you've joined, in a secure, same-site-only cookie, so you can
					rejoin without asking for it again. Like any cookie, your browser includes it when loading
					pages from the scrumhost website (the database never receives it). Logging out ends your
					session; clearing your browser's cookies for this site removes saved room passwords.
				</li>
			</ul>
		</section>

		<!-- Good to know -->
		<section aria-labelledby="limits-heading">
			<h2 id="limits-heading" class="mb-3 text-xl">Good to know</h2>
			<ul class="list-disc space-y-2 pl-5 text-foreground-secondary">
				<li>
					Room passwords are short so they're easy to read out in a meeting. That keeps casual
					access out, but it's not designed to stand up to a determined attacker with access to our
					database. Don't use scrumhost for secrets you couldn't share in a normal team meeting.
				</li>
				<li>Encryption protects the content, not the fact that a room exists or who joined it.</li>
				<li>
					We use privacy-friendly, cookie-free page analytics (Vercel Web Analytics) to see how many
					people visit. It never sees your room content.
				</li>
				<li>
					scrumhost’s source code is public, so you can check exactly how this works on
					<a
						href="https://github.com/chandl/scrumhost.app"
						class="font-medium text-primary underline-offset-4 hover:underline"
						target="_blank"
						rel="noopener noreferrer">GitHub</a
					>.
				</li>
			</ul>
		</section>

		<p class="border-t pt-6 text-sm text-muted-foreground">
			Questions or concerns? Reach out on
			<a
				href="https://github.com/chandl/scrumhost.app/issues"
				class="font-medium text-primary underline-offset-4 hover:underline"
				target="_blank"
				rel="noopener noreferrer">GitHub</a
			>
			or
			<a
				href="https://discord.gg/uYY94zR6bq"
				class="font-medium text-primary underline-offset-4 hover:underline"
				target="_blank"
				rel="noopener noreferrer">Discord</a
			>.
		</p>
	</div>
</main>
