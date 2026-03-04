import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],

		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^\\$\\$|^icon$' }]
		}
	},
	{
		files: ['**/components/ui/button/button.svelte'],
		rules: {
			'svelte/valid-compile': 'off'
		}
	},
	{
		files: ['**/*.test.ts', '**/__mocks__/**', '**/pocketbase-mock.ts'],
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'pb/pb_data/',
			'playwright-report/',
			'test-results/'
		]
	}
);
