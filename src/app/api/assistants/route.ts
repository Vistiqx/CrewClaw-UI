import { NextRequest, NextResponse } from "next/server";
import { getAllAssistants, createAssistant, type Channel, getAllBusinesses } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get("business_id");
  const status = searchParams.get("status");
  
  let assistants = businessId 
    ? getAllAssistants().filter((a: any) => String(a.business_id) === businessId)
    : getAllAssistants();
  
  if (status && status !== "all") {
    assistants = assistants.filter((a: any) => 
      status === "active" ? a.status === "running" : a.status === "stopped"
    );
  }
  
  const businesses = getAllBusinesses();
  const businessMap = new Map(businesses.map((b: any) => [b.id, b.name]));
  
  const withBusinessName = assistants.map((a: any) => ({
    ...a,
    business_name: businessMap.get(String(a.business_id)) || a.business_id,
    channels: a.channels ? JSON.parse(a.channels) : [a.channel],
  }));
  
  return NextResponse.json(withBusinessName);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, business_id, channel, role, channels } = body;
    
    if (!name || !business_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, business_id" },
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
      business_id, 
      channel: primaryChannel, 
      role,
      channels: channels || [primaryChannel],
    });
    
    const withChannels = {
      ...assistant,
      channels: assistant.channels ? JSON.parse(assistant.channels) : [assistant.channel],
    };
    
    return NextResponse.json(withChannels, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}
