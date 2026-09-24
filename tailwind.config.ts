import { fontFamily } from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';
import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: {
					DEFAULT: 'hsl(var(--foreground) / <alpha-value>)',
					secondary: 'hsl(var(--foreground-secondary) / <alpha-value>)'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				success: {
					DEFAULT: 'hsl(var(--success) / <alpha-value>)',
					foreground: 'hsl(var(--success-foreground) / <alpha-value>)'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
					foreground: 'hsl(var(--warning-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				}
			},
			borderRadius: {
				xl: 'calc(var(--radius) + 2px)', // 14px: cards, dialogs
				lg: 'var(--radius)', // 12px
				md: 'calc(var(--radius) - 2px)', // 10px: buttons, inputs
				sm: 'calc(var(--radius) - 4px)' // 8px
			},
			fontFamily: {
				sans: ['Inter', 'Inter Fallback', ...fontFamily.sans],
				mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
			},
			boxShadow: {
				soft: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
				lift: '0 6px 16px -6px rgb(0 0 0 / 0.18)'
			},
			transitionDuration: {
				DEFAULT: '150ms'
			},
			keyframes: {
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'rise-in': {
					from: { opacity: '0', transform: 'translateY(4px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'dialog-in': {
					from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.98)' },
					to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' }
				},
				reveal: {
					from: { opacity: '0', transform: 'rotateX(-70deg) scale(0.96)' },
					to: { opacity: '1', transform: 'rotateX(0) scale(1)' }
				},
				'bar-in': {
					from: { transform: 'scaleX(0)' },
					to: { transform: 'scaleX(1)' }
				}
			},
			animation: {
				'fade-in': 'fade-in 150ms ease-out',
				'rise-in': 'rise-in 180ms ease-out',
				'dialog-in': 'dialog-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
				reveal: 'reveal 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
				'bar-in': 'bar-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both'
			}
		}
	},
	plugins: [
		plugin(({ addVariant }) => {
			// Touch devices: bump controls to 44px tap targets
			addVariant('coarse', '@media (pointer: coarse)');
		})
	]
};

export default config;
