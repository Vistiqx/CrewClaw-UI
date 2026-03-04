import { NextRequest, NextResponse } from "next/server";
import { getAssistantUsage, getDailyUsage, getModelDistribution } from "@/lib/db";

function getDaysFromPeriod(period: string): number {
  switch (period) {
    case "today": return 1;
    case "week": return 7;
    case "month": return 30;
    case "year": return 365;
    default: return 30;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "month";
  const days = getDaysFromPeriod(period);

  const [assistantUsage, dailyUsage, modelDistribution] = await Promise.all([
    Promise.resolve(getAssistantUsage(days)),
    Promise.resolve(getDailyUsage(days)),
    Promise.resolve(getModelDistribution()),
  ]);

  return NextResponse.json({
    assistantUsage,
    dailyUsage,
    modelDistribution,
  });
}
