import { Wrench } from "lucide-react";
import { GenericItemsPage } from "@/components/GenericItemsPage";

const SKILL_TYPES = [
  { value: "system", label: "System" },
  { value: "custom", label: "Custom" },
  { value: "language", label: "Language" },
  { value: "knowledge", label: "Knowledge" },
  { value: "action", label: "Action" },
  { value: "other", label: "Other" },
];

export default function SkillsPage() {
  return (
    <GenericItemsPage
      title="Skills"
      icon={<Wrench className="w-8 h-8 text-[var(--tropical-indigo)]" />}
      apiEndpoint="skills"
      typeOptions={SKILL_TYPES}
    />
  );
}
