import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--night)] px-3 py-2 text-sm text-[var(--lavender)] placeholder:text-[var(--dim-gray)] transition-[border-color,background-color] duration-[var(--transition-base)] focus:border-[var(--tropical-indigo)] focus:outline-none focus:ring-1 focus:ring-[var(--tropical-indigo)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
