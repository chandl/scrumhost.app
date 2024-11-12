<script lang="ts">
	import { page } from '$app/stores';

	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Plus, Check, CornerDownLeft } from 'lucide-svelte';
	import ParticipantList from './components/ParticipantList.svelte';
	import TaskList from './components/TaskList.svelte';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import {
		getRoomSummary,
		joinRoomAndGetParticipantDetails,
		setActiveStory,
		setRoomState,
		setVotingFlag,
		subscribeToRoomUpdates
	} from '$lib/scrum/room';
	import { onMount } from 'svelte';
	import {
		createStory,
		getStoryWithEstimatesById,
		setStoryStatus,
		subscribeToStoryUpdates,
		unsubscribeToStoryUpdates
	} from '$lib/scrum/story';
	import { validateLogin } from '$lib/scrum/user';
	import type {
		Estimate,
		Participant,
		RoomState,
		RoomSummary,
		StoryAction,
		StorySummary
	} from '$lib/scrum/types';
	import { createOrUpdateEstimate } from '$lib/scrum/estimates';

	const roomId = $page.params.id;
	let room: RoomSummary | undefined = $state();
	let participants: Participant[] = $derived.by(() => room?.participants || []);
	let stories: StorySummary[] = $derived.by(() => room?.stories || []);

	let activeStoryDetails: StorySummary | undefined = $derived.by(() => {
		if (!room?.active_story_id) {
			return undefined;
		}
		return stories.find((story) => story.id == room?.active_story_id);
	});

	let queuedTasks: StorySummary[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'QUEUED' && story.id != room?.active_story_id)
	);

	let reviewedTasks: StorySummary[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'REVIEWED')
	);

	let skippedTasks: StorySummary[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'SKIPPED')
	);

	let currentVotes: Estimate[] = $state([]);
	let voteProgress = $derived(((currentVotes?.length || 0) / participants.length) * 100);
	let userVoteValue: string | undefined = $derived(
		!currentVotes
			? undefined
			: currentVotes.find((vote) => vote.participant === userParticipant?.id)?.estimate
	);
	let hasVoted: boolean = $derived(
		userVoteValue !== undefined || room?.room_status === 'REVIEWING'
	);
	let userParticipant: Participant | undefined = $state();

	let pageTitle = $derived(
		`${room?.room_name} [${room?.room_code}] - scrum.host backlog refinement`
	);

	$effect(async () => {
		if (activeStoryDetails == undefined) {
			console.log('Unsubscribing to all story updates');
			unsubscribeToStoryUpdates();
			currentVotes = [];
		} else {
			let storyWithVotes = await getStoryWithEstimatesById(activeStoryDetails.id);
			console.log('Set currentVotes to', storyWithVotes.story_estimates);
			currentVotes = storyWithVotes.story_estimates;

			console.log('Subscribing to story updates for', activeStoryDetails.id);
			subscribeToStoryUpdates(activeStoryDetails.id, (storyWithEstimates) => {
				currentVotes = storyWithEstimates.story_estimates;
				console.log('Set currentVotes to', storyWithEstimates.story_estimates);
			});
		}
	});

	onMount(async () => {
		validateLogin();

		// Get the room details
		try {
			if (!room) {
				room = await getRoomSummary(roomId);

				subscribeToRoomUpdates(roomId, (record) => {
					console.log('Room Update Received', record);
					room = record;
				});
			}
			// Attempt to join the room. Will fail if already in it, but that's fine
			userParticipant = await joinRoomAndGetParticipantDetails(roomId);

		} catch (err) {
			console.error('Could not find room with id', roomId, err);
			// TODO go to 404 page
			return;
		}
	});

	async function handleCreateTask() {
		await createStory(newTaskDescription, roomId);
		newTaskDescription = '';
	}

	let votingEnabled: boolean = $derived.by(() => room?.room_status == 'VOTING');
	let newTaskDescription: string = $state('');
	let currentTab: string = $state('');

	async function updateRoomState(roomState: RoomState) {
		await setRoomState(roomId, roomState);
	}

	async function handleVote(vote: string) {
		console.log(`Voting for story ${activeStoryDetails?.id} with vote ${vote}`);
		createOrUpdateEstimate(userParticipant?.id || '', activeStoryDetails?.id || '', vote);
	}

	async function handleTaskAction(taskId: string, taskAction: StoryAction) {
		if (taskAction == 'START_VOTING') {
			// TODO check if voting enabled
			await setActiveStory(roomId, taskId);
			await setVotingFlag(roomId, true);
		} else if (taskAction === 'REQUEUE') {
			// TODO only allow this if it's not in QUEUED state
			await setStoryStatus(taskId, 'QUEUED');

			if (room?.active_story_id == taskId) {
				// Stop voting
				await setActiveStory(roomId, null);
				await setRoomState(roomId, 'IDLE');
			} else {
				// Trigger room refresh if re-queueing 'skipped' task
				await setActiveStory(roomId, room?.active_story_id || null);
			}
		} else if (taskAction === 'MARK_REVIEWED') {
			if (room?.active_story_id == taskId) {
				await setStoryStatus(taskId, 'REVIEWED');

				// Stop voting
				// await setActiveStory(roomId, null);
				await setRoomState(roomId, 'REVIEWING');
			}
		} else if (taskAction === 'SKIP') {
			await setStoryStatus(taskId, 'SKIPPED');

			if (room?.active_story_id == taskId) {
				// Stop voting
				await setActiveStory(roomId, null);
				await setRoomState(roomId, 'IDLE');
			} else {
				// Trigger room refresh if skipping 'queued' task
				await setActiveStory(roomId, room?.active_story_id || null);
			}
		} else if (taskAction === 'REVIEW_RESULTS') {
			if (room?.room_status !== 'IDLE') {
				throw new Error('Cannot review results when another task is active.');
			}
			await setActiveStory(roomId, taskId);
			await setRoomState(roomId, 'REVIEWING');
		}
	}

	const pointValues: string[] = $derived(room?.point_values.split(',') || []);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-blue-100 to-white p-8">
	<div class="mx-auto max-w-6xl space-y-8">
		<h1 class="text-4xl font-bold">{room?.room_name} [{room?.room_code}]</h1>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<div class="space-y-8 md:col-span-2">
				{#if room?.room_status === 'REVIEWING'}
					<!-- New Section: Voting Summary -->
					<Card class="rounded-lg border border-gray-200 shadow-lg">
						<CardHeader class="rounded-t-lg border-b border-gray-300 bg-gray-100 pb-4">
							<CardTitle class="text-lg font-semibold text-gray-800">Vote Summary</CardTitle>
						</CardHeader>
						<CardContent class="flex flex-col items-start px-6">
							<!-- Task Description with Separation -->
							<div
								class="mb-6 w-full rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 shadow-md"
							>
								<h3 class="text-3xl font-semibold text-gray-800">{activeStoryDetails?.details}</h3>
							</div>
							<p class="mb-4 text-lg text-gray-600">Vote Distribution:</p>

							{#each new Set(!currentVotes ? [] : currentVotes.map((vote) => vote.estimate)) as value}
								<div class="mb-4 flex w-full items-center justify-between">
									<span class="text-lg text-gray-700">{value}</span>
									<div class="mx-4 h-3 w-full max-w-xs rounded-full bg-gray-200">
										<div
											class="h-full rounded-full bg-blue-500"
											style="width: {(currentVotes.filter((vote) => vote.estimate === value)
												.length /
												currentVotes.length) *
												100}%"
										></div>
									</div>
									<span class="text-sm text-gray-500"
										>{currentVotes.filter((vote) => vote.estimate === value).length} vote(s) - {(
											(currentVotes.filter((vote) => vote.estimate === value).length /
												currentVotes.length) *
											100
										).toFixed(0)}%</span
									>
								</div>
							{/each}

							<!-- Side-by-Side Action Buttons Section -->
							<div class="mt-6 flex space-x-4">
								<!-- Mark as Reviewed Button -->
								<Button
									size="lg"
									class="flex w-full items-center justify-start bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 sm:w-auto"
									on:click={async () => {
										await updateRoomState('IDLE');
										await setActiveStory(roomId, null);
									}}
								>
									<Check class="mr-2 h-5 w-5" />Finish Reviewing
								</Button>
							</div>
						</CardContent>
					</Card>
				{:else if room?.room_status === 'VOTING'}
					<!-- Section for Current Task Being Voted On -->
					<Card class="mt-6 rounded-lg border border-gray-200 shadow-lg">
						<!-- Card Header (Toolbar style) -->
						<CardHeader class="rounded-t-lg border-b border-gray-300 bg-gray-100 pb-4">
							<CardTitle class="text-lg font-semibold text-gray-800">
								Vote for Active Task
							</CardTitle>
						</CardHeader>

						<CardContent class="flex flex-col items-start px-6 py-4">
							<!-- Task Description with Separation -->
							<div
								class="mb-6 w-full rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 shadow-md"
							>
								<h3 class="text-3xl font-semibold text-gray-800">{activeStoryDetails?.details}</h3>
							</div>

							<!-- Instruction Paragraph -->
							<p class="mb-8 text-lg text-gray-600">
								Please select how many points you believe this task is worth:
							</p>

							<!-- Voting Buttons Section -->
							<div class="mb-8 flex flex-wrap justify-center gap-3">
								{#each pointValues as value}
									<Button
										variant={userVoteValue === value ? 'default' : 'outline'}
										class="h-12 w-40 font-medium"
										on:click={() => handleVote(value)}
										disabled={!votingEnabled || activeStoryDetails?.story_status !== 'QUEUED'}
									>
										{value}
									</Button>
								{/each}
							</div>

							<!-- Progress Bar for Voting -->
							<div class=" w-full">
								<!-- Voting Progress Text -->
								<p class="mt-2 text-xl font-semibold text-gray-700">
									Vote Progress: <span class="text-blue-600">{voteProgress.toFixed(0)}%</span>
								</p>
								<Progress value={voteProgress} class="h-3 w-full bg-gray-200"></Progress>
							</div>

							<!-- Side-by-Side Action Buttons Section -->
							<div class="mt-6 flex space-x-4">
								<!-- Mark as Reviewed Button -->
								<Button
									size="lg"
									class="flex w-full items-center justify-start bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600 sm:w-auto"
									on:click={() => handleTaskAction(activeStoryDetails?.id || '', 'MARK_REVIEWED')}
								>
									<Check class="mr-2 h-5 w-5" /> Finish Voting
								</Button>

								<!-- Put Back in Queue Button -->
								<Button
									size="lg"
									variant="outline"
									class="w-full border-gray-300 text-gray-700 hover:bg-gray-100 sm:w-auto"
									on:click={() => handleTaskAction(activeStoryDetails?.id || '', 'REQUEUE')}
								>
									<CornerDownLeft class="mr-2 h-5 w-5" /> Put Back in Queue
								</Button>
							</div>
						</CardContent>
					</Card>
				{/if}

				<div>
					<Card>
						<CardHeader>
							<CardTitle>Create New Task</CardTitle>
						</CardHeader>
						<CardContent class="flex space-x-2">
							<Input placeholder="Enter task description" bind:value={newTaskDescription} />
							<Button on:click={handleCreateTask}>
								<Plus class="mr-2 h-4 w-4" /> Add Task
							</Button>
						</CardContent>
					</Card>
					<Tabs bind:value={currentTab}>
						<TabsList class="grid w-full grid-cols-3">
							<TabsTrigger value="queued">Queued ({queuedTasks?.length})</TabsTrigger>
							<TabsTrigger value="reviewed">Reviewed ({reviewedTasks?.length})</TabsTrigger>
							<TabsTrigger value="skipped">Skipped ({skippedTasks?.length})</TabsTrigger>
						</TabsList>
						<TabsContent value="queued">
							<Card>
								<CardHeader>
									<CardTitle>Queued Tasks</CardTitle>
								</CardHeader>
								<CardContent>
									{#if queuedTasks.length === 0}
										<p class="text-sm italic text-gray-700">Create a new task above.</p>
									{/if}
									<TaskList
										tasks={queuedTasks}
										onVote={() => console.log('onVote called')}
										{votingEnabled}
										onTaskAction={handleTaskAction}
										currentStatus="queued"
									/>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="reviewed">
							<Card>
								<CardHeader>
									<CardTitle>Reviewed Tasks</CardTitle>
								</CardHeader>
								<CardContent>
									<TaskList
										tasks={reviewedTasks}
										onVote={() => console.log('onVote')}
										votingEnabled={false}
										onTaskAction={handleTaskAction}
										currentStatus="reviewed"
									/>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="skipped">
							<Card>
								<CardHeader>
									<CardTitle>Skipped Tasks</CardTitle>
								</CardHeader>
								<CardContent>
									<TaskList
										tasks={skippedTasks}
										onVote={() => console.log('Handle vote')}
										votingEnabled={false}
										onTaskAction={handleTaskAction}
										currentStatus="skipped"
									/>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			<div>
				<ParticipantList {participants} {currentVotes} {hasVoted} />
			</div>
		</div>
	</div>
</div>
