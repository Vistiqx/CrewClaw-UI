"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface BusinessDetailsCardProps {
  business: {
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  getStatusBadge: (status: string) => React.ReactNode;
}

export function BusinessDetailsCard({ business, getStatusBadge }: BusinessDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[var(--lavender)]">
          {business.description || "No description provided."}
        </p>
      </CardContent>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-[var(--lavender-muted)]">Status</dt>
            <dd className="mt-1">{getStatusBadge(business.status)}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--lavender-muted)]">Created</dt>
            <dd className="mt-1 text-[var(--lavender)]">
              {business.created_at ? new Date(business.created_at).toLocaleDateString() : "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--lavender-muted)]">Last Updated</dt>
            <dd className="mt-1 text-[var(--lavender)]">
              {business.updated_at ? new Date(business.updated_at).toLocaleDateString() : "N/A"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
