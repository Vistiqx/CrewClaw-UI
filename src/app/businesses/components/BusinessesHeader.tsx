"use client";

import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";

interface BusinessesHeaderProps {
  isCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function BusinessesHeader({ isCreateOpen, onCreateOpenChange, children }: BusinessesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--lavender)]">Businesses</h1>
        <p className="text-sm text-[var(--lavender-muted)] mt-1">
          Manage your registered businesses
        </p>
      </div>
      <Dialog open={isCreateOpen} onOpenChange={onCreateOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            Add Business
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Business</DialogTitle>
            <DialogDescription>
              Add a new business to your local database.
            </DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
}
