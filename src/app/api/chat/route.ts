import { NextResponse } from "next/server";
import { getChatSessions } from "@/lib/db";

export async function GET() {
  try {
    const sessions = getChatSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json({ error: "Failed to fetch chat sessions" }, { status: 500 });
  }
}
