export interface CheckResult {
	name: string;
	status: 'healthy' | 'unhealthy';
	message?: string;
	checked_at: string;
	latency_ms: number;
}

export interface HealthStatus {
	status: 'starting' | 'healthy' | 'unhealthy';
	last_checked_at?: string;
	checks: CheckResult[];
}

export async function timedCheck(name: string, fn: () => Promise<void>): Promise<CheckResult> {
	const start = Date.now();
	const result: CheckResult = {
		name,
		status: 'healthy',
		checked_at: new Date(start).toISOString(),
		latency_ms: 0
	};
	try {
		await fn();
	} catch (err) {
		result.status = 'unhealthy';
		result.message = err instanceof Error ? err.message : String(err);
	}
	result.latency_ms = Date.now() - start;
	return result;
}

/** Waits for `poll` to return a truthy value, polling on an interval, until `timeoutMs` elapses. */
export async function waitFor<T>(
	poll: () => T | undefined | Promise<T | undefined>,
	timeoutMs: number,
	intervalMs = 150,
	label = 'condition'
): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const value = await poll();
		if (value) return value;
		if (Date.now() >= deadline) {
			throw new Error(`timed out waiting for ${label} after ${timeoutMs}ms`);
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
}
