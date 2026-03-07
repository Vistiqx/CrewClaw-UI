import { NextResponse } from "next/server";
import { getAllModelRegistry } from "@/lib/db";

export async function GET() {
  try {
    const models = getAllModelRegistry();
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching model registry:", error);
    return NextResponse.json({ models: [], error: "Failed to fetch model registry" }, { status: 500 });
  }
}
