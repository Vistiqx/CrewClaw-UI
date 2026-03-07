import { NextResponse } from "next/server";
import { getAllPipelines } from "@/lib/db";

export async function GET() {
  try {
    const pipelines = getAllPipelines();
    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error("Error fetching pipelines:", error);
    return NextResponse.json({ pipelines: [], error: "Failed to fetch pipelines" }, { status: 500 });
  }
}
