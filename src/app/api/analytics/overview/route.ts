import { NextResponse } from "next/server";
import { getUsageOverview } from "@/lib/db";

export async function GET() {
  const overview = getUsageOverview();
  return NextResponse.json(overview);
}
