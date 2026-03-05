"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Rocket } from "lucide-react";

export default function DeploymentSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deployment Settings"
        description="Configure deployment environments and release management"
      />
      
      <div className="rounded-lg border border-[var(--border)] bg-[var(--night-light)] p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Rocket className="h-16 w-16 text-[var(--tropical-indigo)] mb-4" />
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
