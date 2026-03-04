"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface BusinessEditDialogProps {
  open: boolean;
  editData: {
    name: string;
    prefix: string;
    industry: string;
    description: string;
    timezone: string;
    status: string;
  };
  errors: Record<string, string>;
  onOpenChange: (open: boolean) => void;
  onNameChange: (value: string) => void;
  onPrefixChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
}

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Other",
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export function BusinessEditDialog({
  open,
  editData,
  errors,
  onOpenChange,
  onNameChange,
  onPrefixChange,
  onIndustryChange,
  onTimezoneChange,
  onStatusChange,
  onDescriptionChange,
  onSubmit,
}: BusinessEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
          <DialogDescription>
            Update business information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="edit-name" className="text-sm text-[var(--lavender)]">Name</label>
            <Input
              id="edit-name"
              value={editData.name}
              onChange={(e) => onNameChange(e.target.value)}
            />
            {errors.name && <p className="text-xs text-[var(--error)]">{errors.name}</p>}
          </div>
          <div className="grid gap-2">
            <label htmlFor="edit-prefix" className="text-sm text-[var(--lavender)]">Prefix</label>
            <Input
              id="edit-prefix"
              value={editData.prefix}
              onChange={(e) => onPrefixChange(e.target.value.toUpperCase())}
              maxLength={4}
            />
            {errors.prefix && <p className="text-xs text-[var(--error)]">{errors.prefix}</p>}
          </div>
          <div className="grid gap-2">
            <label htmlFor="edit-industry" className="text-sm text-[var(--lavender)]">Industry</label>
            <Select value={editData.industry} onValueChange={onIndustryChange}>
              <SelectTrigger id="edit-industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="edit-timezone" className="text-sm text-[var(--lavender)]">Timezone</label>
            <Select value={editData.timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger id="edit-timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="edit-status" className="text-sm text-[var(--lavender)]">Status</label>
            <Select value={editData.status} onValueChange={onStatusChange}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="edit-description" className="text-sm text-[var(--lavender)]">Description</label>
            <Input
              id="edit-description"
              value={editData.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
