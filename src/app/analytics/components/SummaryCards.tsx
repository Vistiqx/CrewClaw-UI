"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Coins, Activity, DollarSign, Users, Loader2 } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface UsageOverview {
  totalTokens: number;
  totalApiCalls: number;
  estimatedCost: number;
  assistantsActive: number;
}

interface SummaryCardsProps {
  overview: UsageOverview | undefined;
  isLoading: boolean;
}

export function SummaryCards({ overview, isLoading }: SummaryCardsProps) {
  const summaryCards = [
    {
      title: "Total Tokens",
      value: overview?.totalTokens ?? 0,
      icon: Coins,
      format: (v: number) => formatNumber(v),
      color: "var(--tropical-indigo)",
    },
    {
      title: "API Calls",
      value: overview?.totalApiCalls ?? 0,
      icon: Activity,
      format: (v: number) => formatNumber(v),
      color: "var(--amethyst)",
    },
    {
      title: "Estimated Cost",
      value: overview?.estimatedCost ?? 0,
      icon: DollarSign,
      format: (v: number) => formatCurrency(v),
      color: "var(--success)",
    },
    {
      title: "Assistants Active",
      value: overview?.assistantsActive ?? 0,
      icon: Users,
      format: (v: number) => v.toString(),
      color: "var(--warning)",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4" style={{ color: card.color }} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--lavender)]" />
            ) : (
              <div className="text-2xl font-bold text-[var(--lavender)]">
                {card.format(card.value)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
