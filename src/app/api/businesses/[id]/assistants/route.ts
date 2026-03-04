import { NextResponse } from "next/server";
import { getDb, createAssistant, type Channel } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  
  const assistants = db.prepare("SELECT * FROM assistants WHERE business_id = ? ORDER BY created_at DESC").all(id);
  
  return NextResponse.json(assistants);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    
    const body = await request.json();
    const { name, channel, role, channels } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }
    
    const primaryChannel = channel || (channels && channels[0]) || "telegram";
    const validChannels: Channel[] = ["telegram", "slack", "discord", "signal"];
    if (channel && !validChannels.includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel. Must be one of: telegram, slack, discord, signal" },
        { status: 400 }
      );
    }
    
    const assistant = createAssistant({ 
      name, 
      business_id: businessId, 
      channel: primaryChannel, 
      role,
      channels: channels || [primaryChannel],
    });
    
    const withChannels = {
      ...assistant,
      channels: assistant.channels ? JSON.parse(assistant.channels) : [assistant.channel],
    };
    
    return NextResponse.json(withChannels, { status: 201 });
  } catch (error) {
    console.error("Create assistant error:", error);
    return NextResponse.json(
      { error: "Failed to create assistant", details: String(error) },
      { status: 500 }
    );
  }
}
