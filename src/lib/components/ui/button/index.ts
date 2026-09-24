import { type VariantProps, tv } from 'tailwind-variants';
import type { HTMLButtonAttributes } from 'svelte/elements';
import Root from './button.svelte';

const buttonVariants = tv({
	base: 'ring-offset-background focus-visible:ring-ring inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
	variants: {
		variant: {
			default: 'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90',
			destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
			outline:
				'border-input bg-card text-foreground hover:bg-muted hover:border-foreground/20 border',
			secondary: 'bg-secondary text-foreground hover:bg-accent',
			ghost: 'text-foreground-secondary hover:bg-muted hover:text-foreground',
			link: 'text-primary underline-offset-4 hover:underline'
		},
		size: {
			default: 'coarse:h-11 h-10 px-4',
			sm: 'coarse:h-11 h-9 px-3',
			lg: 'h-12 px-6 text-[15px]',
			icon: 'coarse:h-11 coarse:w-11 h-10 w-10'
		}
	},
	defaultVariants: {
		variant: 'default',
		size: 'default'
	}
});

type Variant = VariantProps<typeof buttonVariants>['variant'];
type Size = VariantProps<typeof buttonVariants>['size'];

type Props = HTMLButtonAttributes & {
	variant?: Variant;
	size?: Size;
	href?: string;
};

export {
	Root,
	type Props,
	//
	Root as Button,
	type Props as ButtonProps,
	buttonVariants
};
