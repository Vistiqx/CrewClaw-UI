import { NextResponse } from "next/server";
import { getAllTeams, getTeamById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const team = getTeamById(id);
      return NextResponse.json({ team });
    }
    
    const teams = getAllTeams();
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ teams: [], error: "Failed to fetch teams" }, { status: 500 });
  }
}
