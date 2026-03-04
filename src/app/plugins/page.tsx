import { Puzzle } from "lucide-react";
import { GenericItemsPage } from "@/components/GenericItemsPage";

const PLUGIN_TYPES = [
  { value: "integration", label: "Integration" },
  { value: "extension", label: "Extension" },
  { value: "middleware", label: "Middleware" },
  { value: "transformer", label: "Transformer" },
  { value: "validator", label: "Validator" },
  { value: "other", label: "Other" },
];

export default function PluginsPage() {
  return (
    <GenericItemsPage
      title="Plugins"
      icon={<Puzzle className="w-8 h-8 text-[var(--tropical-indigo)]" />}
      apiEndpoint="plugins"
      typeOptions={PLUGIN_TYPES}
    />
  );
}
