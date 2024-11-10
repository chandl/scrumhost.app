<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Plus, Check } from 'lucide-svelte';
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
		{ id: '1', name: 'Alice', avatar: '/placeholder.svg?height=32&width=32' },
		{ id: '2', name: 'Bob', avatar: '/placeholder.svg?height=32&width=32' },
		{ id: '3', name: 'Charlie', avatar: '/placeholder.svg?height=32&width=32' }
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
			votes: {},
			status: 'queued'
		}
	];
	let currentTask = queuedTasks[0];
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
		<h1 class="text-4xl font-bold">Room Name Goes Here</h1>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<div class="space-y-8 md:col-span-2">
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

				<!-- Section for Current Task Being Voted On -->
				{#if votingEnabled && currentTask}
					<Card class="mt-4">
						<CardHeader>
							<CardTitle>Currently Voting On</CardTitle>
						</CardHeader>
						<CardContent>
							<h3 class="mb-2 text-3xl font-semibold">{currentTask.description}</h3>
							{#each pointValues as value}
								<Button
									variant={Object.values(currentTask.votes).includes(value) ? 'default' : 'outline'}
									size="lg"
									on:click={() => console.log('vote', currentTask.id, value)}
									disabled={!votingEnabled || currentTask.status !== 'queued'}
								>
									{value}
								</Button>
							{/each}

							<Button size="lg" class="mt-4 bg-primary" on:click={() => console.log('Mark as reviewed')}>
								<Check class="mr-2 h-4 w-4" /> Mark as Reviewed
							</Button>
						</CardContent>

						<Progress value={33} />
					</Card>
				{/if}

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

			<div>
				<ParticipantList participants={mockParticipants} />
			</div>
		</div>
	</div>
</div>
