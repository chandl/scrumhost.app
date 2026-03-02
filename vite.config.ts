/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit(), svelteTesting()],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'$env/static/public': path.resolve('./src/test/env-public.ts')
		}
	},
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		passWithNoTests: true,
		setupFiles: ['./src/test/setup.ts']
	}
});
