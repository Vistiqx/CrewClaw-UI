"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Pencil, Trash2 } from "lucide-react";

type Business = {
  id: string;
  name: string;
  prefix: string;
  industry: string;
  description: string;
  timezone: string;
  status: string;
};

interface BusinessesTableProps {
  businesses: Business[];
  onDelete: (business: Business) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "inactive":
      return <Badge variant="warning">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function BusinessesTable({ businesses, onDelete }: BusinessesTableProps) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Prefix</TableHead>
          <TableHead>Industry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {businesses.map((business) => (
          <TableRow
            key={business.id}
            className="cursor-pointer hover:bg-[var(--night-lighter)]/50 transition-colors"
            onClick={() => router.push(`/businesses/${business.id}`)}
          >
            <TableCell className="font-medium">{business.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{business.prefix}</Badge>
            </TableCell>
            <TableCell>{business.industry || "N/A"}</TableCell>
            <TableCell>{getStatusBadge(business.status)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/businesses/${business.id}`);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(business);
                  }}
                  className="hover:text-[var(--error)]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {businesses.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-[var(--lavender-muted)]">
              No businesses found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
