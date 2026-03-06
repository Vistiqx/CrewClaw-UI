"use client";

import { FileX } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title = "No Data", message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileX className="h-12 w-12 text-[var(--dim-gray)] mb-4" />
      <h3 className="text-lg font-semibold text-[var(--lavender)] mb-2">{title}</h3>
      <p className="text-[var(--lavender-muted)] max-w-md mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
