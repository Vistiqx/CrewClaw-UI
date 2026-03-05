"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { DialogFooter } from "@/components/ui/Dialog";
import { Loader2, Sparkles } from "lucide-react";

type Assistant = {
  id: number;
  name: string;
};

const SECRET_TYPES = [
  { value: "openrouter_api_key", label: "OpenRouter API Key", placeholder: "sk-or-...", icon: "🔑" },
  { value: "openai_api_key", label: "OpenAI API Key", placeholder: "sk-...", icon: "🤖" },
  { value: "anthropic_api_key", label: "Anthropic API Key", placeholder: "sk-ant-...", icon: "🧠" },
  { value: "telegram_bot_token", label: "Telegram Bot Token", placeholder: "123456:ABC-DEF...", icon: "✈️" },
  { value: "slack_bot_token", label: "Slack Bot Token", placeholder: "xoxb-...", icon: "💬" },
  { value: "discord_bot_token", label: "Discord Bot Token", placeholder: "MT...", icon: "🎮" },
  { value: "signal_token", label: "Signal Token", placeholder: "Signal token", icon: "📱" },
  { value: "api_key", label: "Generic API Key", placeholder: "api key", icon: "🔐" },
  { value: "other", label: "Other", placeholder: "secret value", icon: "🔒" },
];

const SECRET_TEMPLATES = [
  { type: "openrouter_api_key", name: "OpenRouter" },
  { type: "openai_api_key", name: "OpenAI" },
  { type: "anthropic_api_key", name: "Anthropic" },
  { type: "telegram_bot_token", name: "Telegram" },
  { type: "slack_bot_token", name: "Slack" },
  { type: "discord_bot_token", name: "Discord" },
  { type: "signal_token", name: "Signal" },
];

interface AddSecretDialogProps {
  formData: {
    assistant_id: string;
    type: string;
    name: string;
    value: string;
  };
  formError: string | null;
  assistants: Assistant[];
  submitting: boolean;
  onAssistantChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export function AddSecretDialog({
  formData,
  formError,
  assistants,
  submitting,
  onAssistantChange,
  onTypeChange,
  onNameChange,
  onValueChange,
  onSubmit,
  onCancel,
  isEdit = false,
}: AddSecretDialogProps) {
  const selectedType = SECRET_TYPES.find(t => t.value === formData.type);
  const placeholder = selectedType?.placeholder || "Enter secret value";

  const handleTemplateClick = (type: string) => {
    onTypeChange(type);
    const template = SECRET_TEMPLATES.find(t => t.type === type);
    if (template) {
      onNameChange(template.name);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        {formError && (
          <div className="rounded-[var(--radius-sm)] bg-[var(--error)]/10 p-3 text-sm text-[var(--error)]">
            {formError}
          </div>
        )}

        {!isEdit && (
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--lavender)]">
              <Sparkles className="inline h-4 w-4 mr-1" />
              Quick Add (Templates)
            </label>
            <div className="flex flex-wrap gap-2">
              {SECRET_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => handleTemplateClick(template.type)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    formData.type === template.type
                      ? "bg-[var(--tropical-indigo)] text-white border-[var(--tropical-indigo)]"
                      : "bg-night-lighter text-[var(--lavender)] border-border hover:border-[var(--tropical-indigo)]"
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2">
          <label htmlFor="secret-assistant" className="text-sm font-medium text-[var(--lavender)]">
            Assistant
          </label>
          <Select value={formData.assistant_id} onValueChange={onAssistantChange}>
            <SelectTrigger id="secret-assistant">
              <SelectValue placeholder="Select an assistant" />
            </SelectTrigger>
            <SelectContent>
              {assistants.map((assistant) => (
                <SelectItem key={assistant.id} value={String(assistant.id)}>
                  {assistant.name}
                </SelectItem>
              ))}
              {assistants.length === 0 && (
                <div className="p-2 text-sm text-[var(--lavender-muted)]">
                  No assistants available. Create one first.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="secret-type" className="text-sm font-medium text-[var(--lavender)]">
            Type
          </label>
          <Select value={formData.type} onValueChange={onTypeChange} disabled={isEdit}>
            <SelectTrigger id="secret-type">
              <SelectValue placeholder="Select secret type" />
            </SelectTrigger>
            <SelectContent>
              {SECRET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="secret-name" className="text-sm font-medium text-[var(--lavender)]">
            Name
          </label>
          <Input
            id="secret-name"
            placeholder="e.g., Production Key"
            value={formData.name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="secret-value" className="text-sm font-medium text-[var(--lavender)]">
            {isEdit ? "New Value (leave empty to keep current)" : "Value"}
          </label>
          <Input
            id="secret-value"
            type="password"
            placeholder={placeholder}
            value={formData.value}
            onChange={(e) => onValueChange(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Update Secret" : "Add Secret"}
        </Button>
      </DialogFooter>
    </form>
  );
}
