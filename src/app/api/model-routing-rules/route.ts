import { NextResponse } from "next/server";
import { getAllRoutingRules } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = getAllRoutingRules();
    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Error fetching routing rules:", error);
    return NextResponse.json({ rules: [], error: "Failed to fetch routing rules" }, { status: 500 });
  }
}
