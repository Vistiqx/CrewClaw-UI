"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2, FileText, Globe } from "lucide-react";

interface BusinessOverviewCardsProps {
  business: {
    name: string;
    prefix: string;
    industry: string;
    timezone: string;
  };
}

export function BusinessOverviewCards({ business }: BusinessOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Business Name</CardTitle>
          <Building2 className="h-4 w-4 text-[var(--lavender-muted)]" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold text-[var(--lavender)]">{business.name}</div>
          <p className="text-xs text-[var(--lavender-muted)]">{business.prefix}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Industry</CardTitle>
          <FileText className="h-4 w-4 text-[var(--lavender-muted)]" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold text-[var(--lavender)]">
            {business.industry || "N/A"}
          </div>
          <p className="text-xs text-[var(--lavender-muted)]">Business sector</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Timezone</CardTitle>
          <Globe className="h-4 w-4 text-[var(--lavender-muted)]" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold text-[var(--lavender)]">{business.timezone}</div>
          <p className="text-xs text-[var(--lavender-muted)]">Local time</p>
        </CardContent>
      </Card>
    </div>
  );
}
