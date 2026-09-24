import { type VariantProps, tv } from 'tailwind-variants';
export { default as Badge } from './badge.svelte';

export const badgeVariants = tv({
	base: 'focus:ring-ring inline-flex select-none items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
	variants: {
		variant: {
			default: 'bg-primary/10 text-primary border-transparent',
			secondary: 'bg-muted text-foreground-secondary border-border',
			destructive: 'bg-destructive/10 text-destructive border-transparent',
			success: 'bg-success/10 text-success border-transparent',
			outline: 'text-foreground-secondary'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

export type Variant = VariantProps<typeof badgeVariants>['variant'];
