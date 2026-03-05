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

interface SecretsVaultHeaderProps {
  isAddDialogOpen: boolean;
  onAddDialogOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function SecretsVaultHeader({ isAddDialogOpen, onAddDialogOpenChange, children }: SecretsVaultHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--lavender)]">Secrets Vault</h1>
        <p className="text-[var(--lavender-muted)]">Securely manage your assistant secrets and credentials</p>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={onAddDialogOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            Add Secret
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Secret</DialogTitle>
            <DialogDescription>
              Add a new secret for an assistant. The value will be encrypted.
            </DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
}
