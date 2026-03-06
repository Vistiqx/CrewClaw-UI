"use client";

import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function SummaryCard({ title, value, subtitle, trend, trendValue }: SummaryCardProps) {
  const trendColors = {
    up: "text-[var(--success)]",
    down: "text-[var(--error)]",
    neutral: "text-[var(--lavender-muted)]",
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--night-light)] border border-[var(--border)]">
      <p className="text-sm text-[var(--lavender-muted)]">{title}</p>
      <p className="text-2xl font-bold text-[var(--lavender)] mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-[var(--dim-gray)] mt-1">{subtitle}</p>
      )}
      {trend && trendValue && (
        <p className={`text-xs mt-1 ${trendColors[trend]}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
        </p>
      )}
    </div>
  );
}

interface FilterToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    key: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }[];
  actionLabel?: string;
  onAction?: () => void;
}

export function FilterToolbar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  actionLabel,
  onAction,
}: FilterToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--lavender-muted)]" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-[var(--night-light)] border-[var(--border)]"
          />
        </div>
        {filters.map((filter) => (
          <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-[180px] bg-[var(--night-light)] border-[var(--border)]">
              <Filter className="h-4 w-4 mr-2 text-[var(--lavender-muted)]" />
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
