import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-0.5 text-xs font-semibold transition-colors duration-[var(--transition-base)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--tropical-indigo)] text-[var(--night)]",
        secondary: "bg-[var(--ultra-violet)] text-[var(--lavender)]",
        success: "bg-[var(--success)] text-[var(--night)]",
        warning: "bg-[var(--warning)] text-[var(--night)]",
        error: "bg-[var(--error)] text-[var(--night)]",
        info: "bg-[var(--info)] text-[var(--night)]",
        outline: "border border-[var(--border)] text-[var(--lavender)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
