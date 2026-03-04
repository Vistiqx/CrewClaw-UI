import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-openrouter-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key required. Pass via X-OpenRouter-API-Key header." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/usage", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch OpenRouter usage" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to OpenRouter API" },
      { status: 500 }
    );
  }
}
