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
		getRoom,
		getRoomParticipants,
		joinRoom,
		setActiveStory,
		setVotingFlag,
		subscribeToNewParticipants,
		subscribeToRoomUpdates,
		type Participant,
		type RoomDetails
	} from '$lib/room';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		createStory,
		getStoriesInRoom,
		getStoryById,
		setStoryStatus,
		type Story,
		type StoryAction
	} from '$lib/story';

	const roomId = $page.params.id;
	let room: RoomDetails | undefined = $state();
	let participants: Participant[] = $state([]);
	let stories: Story[] = $state([]);
	let activeStoryDetails: Story | undefined = $state();

	let queuedTasks: Story[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'QUEUED' && story.id != room?.active_story_id)
	);

	let reviewedTasks: Story[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'REVIEWED')
	);

	let skippedTasks: Story[] | undefined = $derived.by(() =>
		stories?.filter((story) => story.story_status == 'SKIPPED')
	);

	onMount(async () => {
		// Get the room details
		try {
			if (!room) {
				room = await getRoom(roomId);

				// Attempt to join the room. Will fail if already in it, but that's fine
				await joinRoom(roomId);
			}
		} catch (err) {
			console.error('Could not find room with id', roomId);
			// TODO go to 404 page
			goto('/');
			return;
		}

		// Get the participants and listen for new ones
		participants = await getRoomParticipants(roomId);
		subscribeToNewParticipants(roomId, (participant) => {
			console.log('New Participant Joined:', participant);
			participants = [participant, ...participants];
		});

		stories = await getStoriesInRoom(roomId);
		setActiveStoryDetails(room);

		subscribeToRoomUpdates(roomId, (record) => {
			console.log('Room Update Received', record);
			room = record;
			setActiveStoryDetails(room);

			// Check if any new stories
			room.stories.forEach(async (story) => {
				if (!stories.find((s) => s.id == story)) {
					console.log('Adding new story', story);
					const newStory = await getStoryById(story);
					stories = [newStory, ...stories];
				}
			});
		});
	});

	function setActiveStoryDetails(room: RoomDetails) {
		if (!room.active_story_id) {
			return;
		}

		// Don't set active details if we can't find the story
		let details = stories.find((story) => story.id == room.active_story_id);
		if (details) {
			activeStoryDetails = details;
		}
	}

	async function handleCreateTask() {
		await createStory(newTaskDescription, roomId);
		newTaskDescription = '';
	}

	let votingEnabled: boolean = $derived.by(() => room?.room_status == 'VOTING');
	let newTaskDescription: string = $state('');
	let currentTab: string = $state('');

	async function handleTaskAction(taskId: string, taskAction: StoryAction) {
		console.log('HandleTaskAction', taskId, taskAction);

		if (taskAction == 'START_VOTING') {
			// TODO check if voting enabled
			await setActiveStory(roomId, taskId);
			setVotingFlag(roomId, true);
		} else if (taskAction == 'REQUEUE') {
			// TODO only allow this if it's not in QUEUED state

			if (room?.active_story_id == taskId) {
				await setActiveStory(roomId, null);

				// Stop voting
				await setVotingFlag(roomId, false);
			}

			await setStoryStatus(taskId, 'QUEUED');
		} else if (taskAction == 'MARK_REVIEWED') {
			if (room?.active_story_id == taskId) {
				// Stop voting
				await setActiveStory(roomId, null);
				await setVotingFlag(roomId, false);

				await setStoryStatus(taskId, 'REVIEWED');
			}
		} else if (taskAction == 'SKIP') {
			if (room?.active_story_id == taskId) {
				// Stop voting
				await setActiveStory(roomId, null);
				await setVotingFlag(roomId, false);
			}

			await setStoryStatus(taskId, 'SKIPPED');
		}
	}

	const pointValues: string[] = $derived(room?.point_values.split(',') || []);
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-100 to-white p-8">
	<div class="mx-auto max-w-6xl space-y-8">
		<h1 class="text-4xl font-bold">{room?.room_name} [{room?.room_code}] {room?.room_status}</h1>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<div class="space-y-8 md:col-span-2">
				{#if room?.room_status == 'REVIEWING'}
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
							<p class="mb-4 text-lg text-gray-600">
								Here's how many people voted for each story point:
							</p>

							{#each pointValues as value}
								<div class="mb-4 flex w-full items-center justify-between">
									<span class="text-lg text-gray-700">{value} Points</span>
									<div class="mx-4 h-3 w-full max-w-xs rounded-full bg-gray-200">
										<div class="h-full rounded-full bg-blue-500" style="width: {10}%"></div>
									</div>
									<span class="text-sm text-gray-500">{/* list of votes */ 0 || 0} votes</span>
								</div>
							{/each}
						</CardContent>
					</Card>
				{:else if room?.room_status == 'VOTING'}
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
							<div class="mb-8 flex flex-wrap gap-3">
								{#each pointValues as value}
									<Button
										variant={Object.values([/* list of votes */ '0']).includes(value)
											? 'default'
											: 'outline'}
										class="h-12 w-20 font-medium"
										on:click={() => console.log('vote', activeStoryDetails?.id, value)}
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
									Vote Progress: <span class="text-blue-600">33%</span>
								</p>
								<Progress value={33} class="h-3 w-full bg-gray-200"></Progress>
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
				<ParticipantList {participants} />
			</div>
		</div>
	</div>
</div>
