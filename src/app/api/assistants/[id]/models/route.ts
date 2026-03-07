import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const models = db.prepare("SELECT * FROM assistant_model_allows WHERE assistant_id = ?").all(params.id);
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching model allows:", error);
    return NextResponse.json({ models: [], error: "Failed to fetch model allows" }, { status: 500 });
  }
}
