import { runRefinementApiCheck } from './checks/refinementApi';
import { runRetroApiCheck } from './checks/retroApi';
import { runRefinementUiCheck } from './checks/refinementUi';
import { runRetroUiCheck } from './checks/retroUi';
import type { Config } from './config';
import type { CheckResult, HealthStatus } from './types';
import { timedCheck } from './types';

export class Runner {
	private current: HealthStatus = { status: 'starting', checks: [] };
	private apiResults: CheckResult[] = [];
	private uiResults: CheckResult[] = [];
	private stopped = false;
	// Serializes every check (API and UI tiers alike) with a cooldown between
	// them so at most one is ever signing in against PocketBase, and the next
	// never starts within the same rate-limit window as the last. PocketBase's
	// default *:auth rule allows only 2 auth requests per 3s per IP, and every
	// check logs in 2 identities, so back-to-back checks (e.g. the API and UI
	// loops both firing at boot) reliably 429 without this pacing.
	private queue: Promise<void> = Promise.resolve();

	constructor(private readonly cfg: Config) {}

	private withLock<T>(fn: () => Promise<T>): Promise<T> {
		const run = this.queue.then(fn, fn);
		this.queue = run.then(
			() => sleep(this.cfg.authCooldown),
			() => sleep(this.cfg.authCooldown)
		);
		return run;
	}

	status(): HealthStatus {
		return this.current;
	}

	start(): void {
		this.runApiOnce();
		this.runUiOnce();
		this.scheduleApiLoop();
		this.scheduleUiLoop();
	}

	stop(): void {
		this.stopped = true;
	}

	private scheduleApiLoop(): void {
		const tick = async () => {
			if (this.stopped) return;
			await this.runApiOnce();
			if (!this.stopped) setTimeout(tick, this.cfg.apiInterval);
		};
		setTimeout(tick, this.cfg.apiInterval);
	}

	private scheduleUiLoop(): void {
		const tick = async () => {
			if (this.stopped) return;
			await this.runUiOnce();
			if (!this.stopped) setTimeout(tick, this.cfg.uiInterval);
		};
		setTimeout(tick, this.cfg.uiInterval);
	}

	private async runApiOnce(): Promise<void> {
		console.log('canary api run started');
		this.apiResults = [
			await this.withLock(() =>
				timedCheck('refinement-api-realtime-contract', () =>
					withTimeout(runRefinementApiCheck(this.cfg), this.cfg.apiTimeout)
				)
			),
			await this.withLock(() =>
				timedCheck('retro-api-realtime-contract', () =>
					withTimeout(runRetroApiCheck(this.cfg), this.cfg.apiTimeout)
				)
			)
		];
		this.logAndMerge(this.apiResults);
	}

	private async runUiOnce(): Promise<void> {
		console.log('canary ui run started');
		this.uiResults = [
			await this.withLock(() =>
				timedCheck('refinement-ui-multi-user', () =>
					withTimeout(runRefinementUiCheck(this.cfg), this.cfg.uiTimeout)
				)
			),
			await this.withLock(() =>
				timedCheck('retro-ui-multi-user', () =>
					withTimeout(runRetroUiCheck(this.cfg), this.cfg.uiTimeout)
				)
			)
		];
		this.logAndMerge(this.uiResults);
	}

	private logAndMerge(results: CheckResult[]): void {
		for (const result of results) {
			if (result.message) {
				console.log(
					`canary check=${result.name} status=${result.status} latency_ms=${result.latency_ms} error=${JSON.stringify(result.message)}`
				);
			} else {
				console.log(
					`canary check=${result.name} status=${result.status} latency_ms=${result.latency_ms}`
				);
			}
		}
		const merged = [...this.apiResults, ...this.uiResults];
		const status = merged.some((r) => r.status !== 'healthy') ? 'unhealthy' : 'healthy';
		this.current = { status, last_checked_at: new Date().toISOString(), checks: merged };
		console.log(`canary run completed status=${status}`);
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise: Promise<void>, timeoutMs: number): Promise<void> {
	let timer: NodeJS.Timeout;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new Error(`check exceeded ${timeoutMs}ms deadline`)),
			timeoutMs
		);
	});
	try {
		await Promise.race([promise, timeout]);
	} finally {
		clearTimeout(timer!);
	}
}
