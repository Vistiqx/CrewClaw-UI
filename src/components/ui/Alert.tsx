import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-md)] border p-4 [&>svg]:absolute [&>svg]:text-[var(--lavender)] [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px]",
  {
    variants: {
      variant: {
        default: "bg-[var(--night-light)] text-[var(--lavender)] border-[var(--border)]",
        destructive: "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20",
        success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
        warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
        info: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
