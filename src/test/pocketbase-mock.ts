import { vi } from 'vitest';

/**
 * PocketBase test double for unit tests.
 * Use: vi.mock('$lib/pocketbase/pocketbase', () => ({ default: mockPb }));
 *
 * In-memory state: authStore.model and per-collection records.
 * All collection methods are vi.fn() so tests can override or assert calls.
 */
export const COLLECTIONS = [
	'users',
	'participants',
	'rooms',
	'stories',
	'story_estimates',
	'rooms_search',
	'refinement_metadata',
	'retro_metadata',
	'retro_items',
	'retro_votes',
	'retro_comments'
] as const;

type Record = Record<string, unknown>;

const collectionsStore = new Map<string, Map<string, Record>>();
const subscriptionsStore = new Map<
	string,
	Array<{ recordId: string; callback: (e: { action: string; record: Record }) => void }>
>();

function getStore(name: string): Map<string, Record> {
	let store = collectionsStore.get(name);
	if (!store) {
		store = new Map();
		collectionsStore.set(name, store);
	}
	return store;
}

function generateId(): string {
	return 'mock-' + Math.random().toString(36).slice(2, 11);
}

/** Parse filter string like `user = "id1" && room = "id2"` into key-value pairs */
function parseFilter(filter: string): Map<string, string> {
	const out = new Map<string, string>();
	const regex = /(\w+)\s*=\s*"([^"]*)"/g;
	let m: RegExpExecArray | null;
	while ((m = regex.exec(filter)) !== null) {
		out.set(m[1], m[2]);
	}
	return out;
}

function recordMatchesFilter(record: Record, filter: string): boolean {
	const pairs = parseFilter(filter);
	for (const [key, value] of pairs) {
		if (record[key] !== value) return false;
	}
	return true;
}

function applyUpdate(record: Record, data: Record): void {
	for (const [key, value] of Object.entries(data)) {
		if (key.endsWith('+')) {
			const field = key.slice(0, -1);
			const arr = Array.isArray(record[field]) ? (record[field] as unknown[]) : [];
			record[field] = [...arr, value];
		} else if (key.endsWith('-')) {
			const field = key.slice(0, -1);
			const arr = Array.isArray(record[field]) ? (record[field] as unknown[]) : [];
			const toRemove = Array.isArray(value) ? value : [value];
			record[field] = arr.filter((x) => !toRemove.includes(x));
		} else {
			record[key] = value;
		}
	}
}

function createCollectionMock(name: string) {
	const store = getStore(name);

	const getOne = vi.fn(async (id: string, _options?: { expand?: string; fields?: string }) => {
		const record = store.get(id);
		if (!record) {
			const err = new Error('Record not found') as Error & { status?: number };
			err.status = 404;
			throw err;
		}
		return { ...record };
	});

	const getFirstListItem = vi.fn(
		async (filter: string, _options?: { expand?: string; fields?: string }) => {
			for (const record of store.values()) {
				if (recordMatchesFilter(record, filter)) return { ...record };
			}
			const err = new Error('Record not found') as Error & { status?: number };
			err.status = 404;
			throw err;
		}
	);

	const getList = vi.fn(
		async (
			page: number,
			perPage: number,
			_options?: { filter?: string; expand?: string; sort?: string }
		) => {
			const items = Array.from(store.values()).map((r) => ({ ...r }));
			const start = (page - 1) * perPage;
			const totalItems = items.length;
			return {
				items: items.slice(start, start + perPage),
				totalItems,
				page,
				perPage
			};
		}
	);

	const create = vi.fn(async (data: Record, _options?: { headers?: Record<string, string> }) => {
		const id = generateId();
		const now = new Date().toISOString();
		const record: Record = { id, ...data, created: now, updated: now };
		store.set(id, record);
		return { ...record };
	});

	const update = vi.fn(
		async (id: string, data: Record, _options?: { headers?: Record<string, string> }) => {
			const record = store.get(id);
			if (!record) {
				const err = new Error('Record not found') as Error & { status?: number };
				err.status = 404;
				throw err;
			}
			applyUpdate(record, data);
			record.updated = new Date().toISOString();

			const subs = subscriptionsStore.get(name) ?? [];
			for (const sub of subs) {
				if (sub.recordId === id) {
					sub.callback({ action: 'update', record: { ...record } });
				}
			}
			return { ...record };
		}
	);

	const del = vi.fn(async (id: string) => {
		store.delete(id);
	});

	const subscribe = vi.fn(
		(
			recordId: string,
			callback: (e: { action: string; record: Record }) => void,
			_options?: { expand?: string; fields?: string }
		) => {
			let subs = subscriptionsStore.get(name);
			if (!subs) {
				subs = [];
				subscriptionsStore.set(name, subs);
			}
			subs.push({ recordId, callback });
		}
	);

	const unsubscribe = vi.fn(async () => {
		subscriptionsStore.set(name, []);
	});

	const coll: Record<string, unknown> = {
		getOne,
		getFirstListItem,
		getList,
		create,
		update,
		delete: del,
		subscribe,
		unsubscribe
	};

	if (name === 'users') {
		coll.authWithPassword = vi.fn(async (username: string, _password: string) => {
			authStore.model = {
				id: 'mock-user-' + username,
				username,
				name: username
			};
			authStore._onChangeCbs.forEach((cb) => cb());
			return authStore.model;
		});
		coll.authRefresh = vi.fn(async () => {
			if (authStore.model) {
				authStore._onChangeCbs.forEach((cb) => cb());
			}
			return authStore.model;
		});
	}

	return coll;
}

const collectionCache = new Map<string, ReturnType<typeof createCollectionMock>>();

const authStore = {
	model: null as Record | null,
	_onChangeCbs: [] as Array<() => void>,
	onChange(cb: () => void) {
		this._onChangeCbs.push(cb);
	},
	clear() {
		this.model = null;
		this._onChangeCbs.forEach((cb) => cb());
	}
};

function collectionImpl(name: string) {
	let coll = collectionCache.get(name);
	if (!coll) {
		coll = createCollectionMock(name);
		collectionCache.set(name, coll);
	}
	return coll;
}

const collection = vi.fn(collectionImpl);

export const mockPb = {
	COLLECTIONS,
	collection,
	authStore
};

/**
 * Reset in-memory state and call history. Call between tests to avoid leakage.
 */
export function resetPocketBaseMock() {
	collectionsStore.clear();
	subscriptionsStore.clear();
	authStore.model = null;
	authStore._onChangeCbs = [];
	collectionCache.clear();
	vi.mocked(collection).mockImplementation(collectionImpl);
}
