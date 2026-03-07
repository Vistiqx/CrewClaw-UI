import { NextResponse } from "next/server";
import { getAllApprovals } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const approvals = getAllApprovals();
    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ approvals: [], error: "Failed to fetch approvals" }, { status: 500 });
  }
}
