"use client";

import { Check, X, AlertCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface PermissionMatrixProps {
  permissions: {
    fileRead: boolean;
    fileWrite: boolean;
    fileEdit: boolean;
    fileDelete: boolean;
    mayMessageHuman: boolean;
    mayUseChannels: boolean;
    mayMessageAssistants: boolean;
  };
  approvalThreshold: string;
}

export function PermissionMatrix({ permissions, approvalThreshold }: PermissionMatrixProps) {
  const filePermissions = [
    { key: 'fileRead', label: 'Read Files', value: permissions.fileRead },
    { key: 'fileWrite', label: 'Write Files', value: permissions.fileWrite },
    { key: 'fileEdit', label: 'Edit Files', value: permissions.fileEdit },
    { key: 'fileDelete', label: 'Delete Files', value: permissions.fileDelete },
  ];

  const commPermissions = [
    { key: 'mayMessageHuman', label: 'Message Human Owner', value: permissions.mayMessageHuman },
    { key: 'mayUseChannels', label: 'Use Channels (Discord, etc.)', value: permissions.mayUseChannels },
    { key: 'mayMessageAssistants', label: 'Message Other Assistants', value: permissions.mayMessageAssistants },
  ];

  const thresholdColors: Record<string, string> = {
    low: 'text-[var(--success)]',
    medium: 'text-[var(--warning)]',
    high: 'text-[var(--sunset-orange)]',
    critical: 'text-[var(--error)]',
  };

  return (
    <Card className="bg-[var(--night-light)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--tropical-indigo)]" />
            <CardTitle className="text-base">Permission Matrix</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--lavender-muted)]">Approval Threshold:</span>
            <span className={`font-medium ${thresholdColors[approvalThreshold]}`}>
              {approvalThreshold.charAt(0).toUpperCase() + approvalThreshold.slice(1)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-[var(--lavender)] mb-3">File Operations</h4>
          <div className="grid grid-cols-2 gap-2">
            {filePermissions.map((perm) => (
              <div
                key={perm.key}
                className="flex items-center justify-between p-2 rounded bg-[var(--night-lighter)]"
              >
                <span className="text-sm text-[var(--lavender-muted)]">{perm.label}</span>
                {perm.value ? (
                  <Check className="h-4 w-4 text-[var(--success)]" />
                ) : (
                  <X className="h-4 w-4 text-[var(--dim-gray)]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-[var(--lavender)] mb-3">Communication</h4>
          <div className="space-y-2">
            {commPermissions.map((perm) => (
              <div
                key={perm.key}
                className="flex items-center justify-between p-2 rounded bg-[var(--night-lighter)]"
              >
                <span className="text-sm text-[var(--lavender-muted)]">{perm.label}</span>
                {perm.value ? (
                  <Check className="h-4 w-4 text-[var(--success)]" />
                ) : (
                  <X className="h-4 w-4 text-[var(--dim-gray)]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border)]">
          <div className="flex items-start gap-2 text-xs text-[var(--lavender-muted)]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>
              Actions above the approval threshold will require explicit owner approval before execution.
              Default deny applies to all operations not explicitly allowed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
