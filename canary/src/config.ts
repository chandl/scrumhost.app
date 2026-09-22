import { positiveDurationMs } from './duration';

export interface Config {
	httpAddr: string;
	apiInterval: number;
	apiTimeout: number;
	uiInterval: number;
	uiTimeout: number;
	appUrl: string;
	apiUrl: string;
	namePrefix: string;
	authCooldown: number;
}

function env(key: string, fallback: string): string {
	const value = process.env[key];
	return value && value.length > 0 ? value : fallback;
}

export function loadConfig(): Config {
	return {
		httpAddr: env('CANARY_HTTP_ADDR', ':8081'),
		apiInterval: positiveDurationMs(env('CANARY_INTERVAL', '2m'), 'CANARY_INTERVAL'),
		apiTimeout: positiveDurationMs(env('CANARY_TIMEOUT', '30s'), 'CANARY_TIMEOUT'),
		uiInterval: positiveDurationMs(env('CANARY_UI_INTERVAL', '15m'), 'CANARY_UI_INTERVAL'),
		uiTimeout: positiveDurationMs(env('CANARY_UI_TIMEOUT', '120s'), 'CANARY_UI_TIMEOUT'),
		appUrl: env('CANARY_APP_URL', 'https://scrumhost.app').replace(/\/+$/, ''),
		apiUrl: env('CANARY_API_URL', 'https://api.scrumhost.app').replace(/\/+$/, ''),
		namePrefix: env('CANARY_NAME_PREFIX', 'canary'),
		// PocketBase's default *:auth rate-limit rule allows only 2 auth
		// requests per 3s per IP. Each check logs in 2 identities, so checks
		// must be paced at least this far apart or later checks 429.
		authCooldown: positiveDurationMs(env('CANARY_AUTH_COOLDOWN', '3500ms'), 'CANARY_AUTH_COOLDOWN')
	};
}

export function parseHttpAddr(addr: string): { host: string; port: number } {
	const [host, portStr] = addr.startsWith(':') ? ['0.0.0.0', addr.slice(1)] : addr.split(':');
	const port = Number(portStr);
	if (!Number.isInteger(port) || port <= 0) {
		throw new Error(`invalid CANARY_HTTP_ADDR: ${addr}`);
	}
	return { host: host || '0.0.0.0', port };
}
