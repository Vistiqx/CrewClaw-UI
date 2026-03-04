import { Hammer } from "lucide-react";
import { GenericItemsPage } from "@/components/GenericItemsPage";

const TOOL_TYPES = [
  { value: "function", label: "Function" },
  { value: "api", label: "API" },
  { value: "search", label: "Search" },
  { value: "calculator", label: "Calculator" },
  { value: "browser", label: "Browser" },
  { value: "other", label: "Other" },
];

export default function ToolsPage() {
  return (
    <GenericItemsPage
      title="Tools"
      icon={<Hammer className="w-8 h-8 text-[var(--tropical-indigo)]" />}
      apiEndpoint="tools"
      typeOptions={TOOL_TYPES}
    />
  );
}
