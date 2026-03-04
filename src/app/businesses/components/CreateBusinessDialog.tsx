"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

interface CreateBusinessDialogProps {
  formData: {
    name: string;
    prefix: string;
    industry: string;
    description: string;
    timezone: string;
  };
  errors: Record<string, string>;
  onNameChange: (value: string) => void;
  onPrefixChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
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

export function CreateBusinessDialog({
  formData,
  errors,
  onNameChange,
  onPrefixChange,
  onIndustryChange,
  onDescriptionChange,
  onTimezoneChange,
  onSubmit,
  onCancel,
}: CreateBusinessDialogProps) {
  return (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="business-name" className="text-sm text-[var(--lavender)]">Name</label>
          <Input
            id="business-name"
            value={formData.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter business name"
          />
          {errors.name && (
            <p className="text-xs text-[var(--error)]">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="business-prefix" className="text-sm text-[var(--lavender)]">Prefix</label>
          <Input
            id="business-prefix"
            value={formData.prefix}
            onChange={(e) => onPrefixChange(e.target.value.toUpperCase())}
            placeholder="BIZ"
            maxLength={4}
          />
          {errors.prefix && (
            <p className="text-xs text-[var(--error)]">{errors.prefix}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="business-industry" className="text-sm text-[var(--lavender)]">Industry</label>
          <Select value={formData.industry} onValueChange={onIndustryChange}>
            <SelectTrigger id="business-industry">
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
        <div className="space-y-2">
          <label htmlFor="business-description" className="text-sm text-[var(--lavender)]">Description</label>
          <Input
            id="business-description"
            value={formData.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="business-timezone" className="text-sm text-[var(--lavender)]">Timezone</label>
          <Select value={formData.timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger id="business-timezone">
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
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Create Business</Button>
      </div>
    </>
  );
}
