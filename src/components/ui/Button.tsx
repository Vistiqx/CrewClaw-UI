import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-[color,background-color,border-color] duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tropical-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--night)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--tropical-indigo)] text-[var(--night)] hover:bg-[var(--amethyst)]",
        secondary:
          "bg-[var(--ultra-violet)] text-[var(--lavender)] hover:bg-[var(--amethyst)] border border-[var(--border)]",
        ghost:
          "text-[var(--lavender)] hover:bg-[var(--night-lighter)]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--lavender)] hover:bg-[var(--night-lighter)]",
        destructive:
          "bg-[var(--error)] text-[var(--night)] hover:bg-[var(--error)]/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
