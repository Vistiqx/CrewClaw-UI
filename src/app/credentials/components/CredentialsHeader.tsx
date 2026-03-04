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

interface CredentialsHeaderProps {
  isAddDialogOpen: boolean;
  onAddDialogOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function CredentialsHeader({ isAddDialogOpen, onAddDialogOpenChange, children }: CredentialsHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--lavender)]">Credentials</h1>
        <p className="text-[var(--lavender-muted)]">Manage your assistant credentials</p>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={onAddDialogOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            Add Credential
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Credential</DialogTitle>
            <DialogDescription>
              Add a new credential for an assistant. The value will be encrypted.
            </DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
}
