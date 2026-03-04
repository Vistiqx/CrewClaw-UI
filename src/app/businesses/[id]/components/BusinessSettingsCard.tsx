"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Settings } from "lucide-react";

interface BusinessSettingsCardProps {
  business: {
    timezone: string;
    status: string;
  };
  isLocalBusiness: boolean;
}

export function BusinessSettingsCard({ business, isLocalBusiness }: BusinessSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Business Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLocalBusiness ? (
          <div className="space-y-4">
            <p className="text-[var(--lavender-muted)]">
              Configure business-specific settings here.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-[var(--lavender)]">Timezone</span>
                <p className="text-[var(--lavender-muted)]">{business.timezone}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--lavender)]">Status</span>
                <p className="text-[var(--lavender-muted)]">{business.status}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-[var(--lavender-muted)]">
            This is a remote business. Local settings are not available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
