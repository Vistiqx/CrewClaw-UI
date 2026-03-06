"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface ChannelEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantId: number;
  assistantName: string;
  currentChannels: string[];
  onSave: (channels: string[]) => void;
}

const CHANNEL_OPTIONS = ["telegram", "slack", "discord", "signal", "email", "sms", "whatsapp"];

export function ChannelEditModal({
  isOpen,
  onClose,
  assistantId,
  assistantName,
  currentChannels,
  onSave,
}: ChannelEditModalProps) {
  const [channels, setChannels] = useState<string[]>(currentChannels);
  const [saving, setSaving] = useState(false);

  const toggleChannel = (channel: string) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/assistants/${assistantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
      });

      if (res.ok) {
        onSave(channels);
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update channels");
      }
    } catch (error) {
      console.error("Failed to update channels:", error);
      alert("Failed to update channels");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Channels - {assistantName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--lavender-muted)]">
              Communication Channels
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <label
                  key={channel}
                  className="flex items-center gap-2 p-2 rounded border border-border hover:bg-night-lighter cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    disabled={saving}
                    className="rounded"
                  />
                  <span className="text-sm text-[var(--lavender)] capitalize">
                    {channel}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || channels.length === 0}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
