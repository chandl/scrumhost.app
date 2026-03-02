/**
 * Vitest setup: runs before each test file.
 * $env/static/public is stubbed via resolve.alias -> src/test/env-public.ts
 */
// Optional: ensure process.env has backend URL for any Node-side code
if (typeof process !== 'undefined') {
	process.env.PUBLIC_BACKEND_URL ??= 'http://localhost:8090';
	process.env.PUBLIC_ENABLE_BACKLOG_MERGE_TASKS ??= 'false';
}
