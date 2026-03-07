import { NextResponse } from "next/server";
import { getAllApiKeys } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiKeys = getAllApiKeys();
    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ apiKeys: [], error: "Failed to fetch API keys" }, { status: 500 });
  }
}
