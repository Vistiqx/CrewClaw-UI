"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Trash2 } from "lucide-react";

export default function RetentionPoliciesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Retention Policies"
        description="Configure data retention, archival, and cleanup policies"
      />
      
      <div className="rounded-lg border border-[var(--border)] bg-[var(--night-light)] p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Trash2 className="h-16 w-16 text-[var(--tropical-indigo)] mb-4" />
          <h2 className="text-xl font-semibold text-[var(--lavender)] mb-2">
            Page Under Construction
          </h2>
          <p className="text-[var(--lavender-muted)] max-w-md">
            This page is part of the Enterprise Sidebar Architecture implementation.
            Full functionality will be added in future iterations.
          </p>
        </div>
      </div>
    </div>
  );
}
