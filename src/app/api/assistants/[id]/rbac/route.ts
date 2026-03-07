import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistantId");
    
    if (!assistantId) {
      return NextResponse.json({ error: "Assistant ID required" }, { status: 400 });
    }
    
    const db = getDb();
    const policy = db.prepare("SELECT * FROM assistant_rbac_policies WHERE assistant_id = ?").get(assistantId);
    
    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Error fetching RBAC policy:", error);
    return NextResponse.json({ error: "Failed to fetch RBAC policy" }, { status: 500 });
  }
}
