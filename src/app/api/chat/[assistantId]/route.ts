import { NextResponse } from "next/server";
import { getChatMessages } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
    const messages = getChatMessages(parseInt(assistantId));
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 });
  }
}
