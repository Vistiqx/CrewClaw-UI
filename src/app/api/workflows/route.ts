import { NextResponse } from "next/server";
import { getAllWorkflows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workflows = getAllWorkflows();
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json({ workflows: [], error: "Failed to fetch workflows" }, { status: 500 });
  }
}
