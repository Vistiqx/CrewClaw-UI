import { Terminal } from "lucide-react";
import { GenericItemsPage } from "@/components/GenericItemsPage";

const COMMAND_TYPES = [
  { value: "system", label: "System" },
  { value: "custom", label: "Custom" },
  { value: "shell", label: "Shell" },
  { value: "script", label: "Script" },
  { value: "api", label: "API" },
  { value: "other", label: "Other" },
];

export default function CommandsPage() {
  return (
    <GenericItemsPage
      title="Commands"
      icon={<Terminal className="w-8 h-8 text-[var(--tropical-indigo)]" />}
      apiEndpoint="commands"
      typeOptions={COMMAND_TYPES}
    />
  );
}
