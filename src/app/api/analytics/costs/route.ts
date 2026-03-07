import { NextRequest, NextResponse } from "next/server";
import { getModelDistribution, getAssistantUsage } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const [modelDistribution, assistantUsage] = await Promise.all([
    Promise.resolve(getModelDistribution()),
    Promise.resolve(getAssistantUsage()),
  ]);

  const totalRuns = assistantUsage.reduce((sum, a) => sum + a.runCount, 0);

  return NextResponse.json({
    byModel: modelDistribution,
    byAssistant: assistantUsage.map((a) => ({
      assistantId: a.assistantId,
      assistantName: a.assistantName,
      runCount: a.runCount,
      percentage: totalRuns > 0 ? (a.runCount / totalRuns) * 100 : 0,
    })),
    totalRuns,
  });
}
