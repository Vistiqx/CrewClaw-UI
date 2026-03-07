import { NextResponse } from "next/server";
import { getAllCouncils, getCouncilById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const council = getCouncilById(id);
      return NextResponse.json({ council });
    }
    
    const councils = getAllCouncils();
    return NextResponse.json({ councils });
  } catch (error) {
    console.error("Error fetching councils:", error);
    return NextResponse.json({ councils: [], error: "Failed to fetch councils" }, { status: 500 });
  }
}
