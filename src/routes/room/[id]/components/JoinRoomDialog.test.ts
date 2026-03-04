/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/dom';
import JoinRoomDialog from './JoinRoomDialog.svelte';

// Stub dialog to avoid bits-ui Portal (causes "Symbol(nodeArray)" in happy-dom)
vi.mock('$lib/components/ui/dialog', async () => {
	const DialogStub = (await import('./__mocks__/dialog-stub.svelte')).default;
	const DialogContentStub = (await import('./__mocks__/dialog-content-stub.svelte')).default;
	const DialogHeaderStub = (await import('./__mocks__/dialog-header-stub.svelte')).default;
	const DialogTitleStub = (await import('./__mocks__/dialog-title-stub.svelte')).default;
	const DialogDescriptionStub = (await import('./__mocks__/dialog-description-stub.svelte'))
		.default;
	const DialogFooterStub = (await import('./__mocks__/dialog-footer-stub.svelte')).default;
	return {
		Dialog: DialogStub,
		DialogContent: DialogContentStub,
		DialogHeader: DialogHeaderStub,
		DialogTitle: DialogTitleStub,
		DialogDescription: DialogDescriptionStub,
		DialogFooter: DialogFooterStub
	};
});

describe('JoinRoomDialog', () => {
	let handleJoinRoom: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		handleJoinRoom = vi.fn();
	});

	it('renders dialog title and description', () => {
		render(JoinRoomDialog, { props: { handleJoinRoom } });

		const heading = screen.getByRole('heading', { name: 'Join Room' });
		const description = screen.getByText('Enter the room password.');
		expect(document.body.contains(heading)).toBe(true);
		expect(document.body.contains(description)).toBe(true);
	});

	it('renders password input and join button', () => {
		render(JoinRoomDialog, { props: { handleJoinRoom } });

		const input = screen.getByPlaceholderText('Enter room password');
		const button = screen.getByRole('button', { name: 'Join Room' });
		expect(document.body.contains(input)).toBe(true);
		expect(document.body.contains(button)).toBe(true);
	});

	it('calls handleJoinRoom with entered password when user submits via button', () => {
		render(JoinRoomDialog, { props: { handleJoinRoom } });

		const input = screen.getByPlaceholderText('Enter room password');
		fireEvent.input(input, { target: { value: 'secret123' } });
		fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

		expect(handleJoinRoom).toHaveBeenCalledTimes(1);
		expect(handleJoinRoom).toHaveBeenCalledWith('secret123');
	});

	it('calls handleJoinRoom with entered password when user submits via form', () => {
		render(JoinRoomDialog, { props: { handleJoinRoom } });

		const input = screen.getByPlaceholderText('Enter room password');
		fireEvent.input(input, { target: { value: 'mypass' } });
		fireEvent.submit(input.closest('form')!);

		expect(handleJoinRoom).toHaveBeenCalledTimes(1);
		expect(handleJoinRoom).toHaveBeenCalledWith('mypass');
	});
});
