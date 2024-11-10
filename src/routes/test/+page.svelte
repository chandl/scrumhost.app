<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Plus, Check, CornerDownLeft } from 'lucide-svelte';
	import ParticipantList from './components/ParticipantList.svelte';
	import TaskList from './components/TaskList.svelte';
	import Progress from '$lib/components/ui/progress/progress.svelte';

	let votingEnabled: boolean = true;
	let newTask: string;
	let currentTab: string;

	function toggleVoting() {
		votingEnabled = !votingEnabled;
	}

	function handleCreateTask() {}

	type Participant = {
		id: string;
		name: string;
		avatar: string;
	};

	// Mock data
	const mockParticipants: Participant[] = [
		{ id: '1', name: 'Alice (Host)', avatar: '' },
		{ id: '2', name: 'Bob', avatar: '' },
		{ id: '3', name: 'Charlie', avatar: '' }
	];

	let queuedTasks: any[] = [
		{
			id: 'taskId',
			description: 'Some Description',
			votes: {
				'2': 3
			},
			status: 'queued'
		},

		{
			id: 'taskId2',
			description: 'Do something as a task with a specific tracking ticket number ABCD-123',
			votes: { '2': 3 },
			voters: [
				{ name: 'Alice', vote: 3 },
				{ name: 'Bob', vote: 3 },
				{ name: 'Charlie', vote: 5 }
			],
			status: 'queued'
		}
	];
	let currentTask = queuedTasks[1];
	let reviewedTasks: any[] = [
		{
			id: 'taskId3',
			description: 'Reviewed already',
			votes: {
				'2': 3
			},
			status: 'reviewed'
		}
	];
	let skippedTasks: any[] = [];

	type PointValue = 1 | 2 | 3 | 5 | 8 | 13 | 21;

	const pointValues: PointValue[] = [1, 2, 3, 5, 8, 13, 21];
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-100 to-white p-8">
	<div class="mx-auto max-w-6xl space-y-8">
		<h1 class="text-4xl font-bold">Room Name Goes Here [AAA-AAA]</h1>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<div class="space-y-8 md:col-span-2">
				<!-- New Section: Voting Summary -->
				<Card class="rounded-lg border border-gray-200 shadow-lg">
					<CardHeader class="rounded-t-lg border-b border-gray-300 bg-gray-100 pb-4">
						<CardTitle class="text-lg font-semibold text-gray-800">Vote Summary</CardTitle>
					</CardHeader>
					<CardContent class="flex flex-col items-start px-6">
						<!-- Task Description with Separation -->
						<div class="mb-6 w-full rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 shadow-md">
							<h3 class="text-3xl font-semibold text-gray-800">{currentTask.description}</h3>
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
								<span class="text-sm text-gray-500">{currentTask.votes[value] || 0} votes</span>
							</div>
						{/each}
					</CardContent>
				</Card>

				<!-- Section for Current Task Being Voted On -->
				{#if votingEnabled && currentTask}
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
								<h3 class="text-3xl font-semibold text-gray-800">{currentTask.description}</h3>
							</div>

							<!-- Instruction Paragraph -->
							<p class="mb-8 text-lg text-gray-600">
								Please select how many points you believe this task is worth:
							</p>

							<!-- Voting Buttons Section -->
							<div class="mb-8 flex flex-wrap gap-3">
								{#each pointValues as value}
									<Button
										variant={Object.values(currentTask.votes).includes(value)
											? 'default'
											: 'outline'}
										class="h-12 w-20 font-medium"
										on:click={() => console.log('vote', currentTask.id, value)}
										disabled={!votingEnabled || currentTask.status !== 'queued'}
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
									on:click={() => console.log('Mark as reviewed')}
								>
									<Check class="mr-2 h-5 w-5" /> Finish Voting
								</Button>

								<!-- Put Back in Queue Button -->
								<Button
									size="lg"
									variant="outline"
									class="w-full border-gray-300 text-gray-700 hover:bg-gray-100 sm:w-auto"
									on:click={() => console.log('Put back in queue')}
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
							<Input placeholder="Enter task description" bind:value={newTask} />
							<Button on:click={handleCreateTask}>
								<Plus class="mr-2 h-4 w-4" /> Add Task
							</Button>
						</CardContent>
					</Card>
					<Tabs bind:value={currentTab}>
						<TabsList class="grid w-full grid-cols-3">
							<TabsTrigger value="queued">Queued ({queuedTasks.length})</TabsTrigger>
							<TabsTrigger value="reviewed">Reviewed ({reviewedTasks.length})</TabsTrigger>
							<TabsTrigger value="skipped">Skipped ({skippedTasks.length})</TabsTrigger>
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
										onTaskAction={() => console.log('onTaskAction called')}
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
										onTaskAction={() => console.log('onTaskAction')}
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
										onTaskAction={() => console.log('onTaskAction')}
										currentStatus="skipped"
									/>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			<div>
				<ParticipantList participants={mockParticipants} />
			</div>
		</div>
	</div>
</div>
