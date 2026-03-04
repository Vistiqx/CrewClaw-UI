"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Pencil } from "lucide-react";

interface BusinessDetailHeaderProps {
  business: {
    name: string;
    prefix: string;
    industry: string;
    status: string;
  };
  isLocalBusiness: boolean;
  onEditClick: () => void;
}

export function BusinessDetailHeader({ business, isLocalBusiness, onEditClick }: BusinessDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.push("/businesses")}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-[var(--lavender)]">{business.name}</h1>
        <p className="text-sm text-[var(--lavender-muted)] mt-1">
          {business.prefix} • {business.industry || "No industry"}
        </p>
      </div>
      <Badge variant={business.status === "active" ? "success" : "warning"}>
        {business.status}
      </Badge>
      {isLocalBusiness && (
        <Button onClick={onEditClick}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      )}
    </div>
  );
}
