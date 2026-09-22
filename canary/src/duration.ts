const UNIT_MS: Record<string, number> = {
	ms: 1,
	s: 1000,
	m: 60_000,
	h: 3_600_000
};

const PATTERN = /(\d+(?:\.\d+)?)(ms|s|m|h)/g;

/** Parses Go-style durations such as "30s", "5m", "1h30m", "250ms". */
export function parseDuration(value: string): number {
	const trimmed = value.trim();
	if (!/^(\d+(?:\.\d+)?(ms|s|m|h))+$/.test(trimmed)) {
		throw new Error(`invalid duration: ${value}`);
	}
	let totalMs = 0;
	let match: RegExpExecArray | null;
	PATTERN.lastIndex = 0;
	while ((match = PATTERN.exec(trimmed)) !== null) {
		totalMs += parseFloat(match[1]) * UNIT_MS[match[2]];
	}
	return totalMs;
}

export function positiveDurationMs(raw: string, key: string): number {
	const ms = parseDuration(raw);
	if (!(ms > 0)) {
		throw new Error(`${key} must be a positive duration, got ${JSON.stringify(raw)}`);
	}
	return ms;
}
