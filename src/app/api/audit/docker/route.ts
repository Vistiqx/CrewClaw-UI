// src/app/api/audit/docker/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/audit/docker - Receive audit events from Docker AuthZ Plugin
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // Validate required fields
    if (!event.event_type || !event.action || !event.message) {
      return NextResponse.json(
        { error: "Missing required fields: event_type, action, message" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Insert into audit_logs table
    const result = db
      .prepare(
        `
      INSERT INTO audit_logs (timestamp, event_type, severity, message, metadata, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        event.timestamp || new Date().toISOString(),
        event.event_type,
        event.action === "DENIED" ? "warning" : event.action === "ERROR" ? "error" : "info",
        event.message,
        JSON.stringify({
          user: event.user,
          method: event.method,
          uri: event.uri,
          container: event.container,
          details: event.details,
        }),
        "docker_authz"
      );

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: "Audit event recorded",
    });
  } catch (error) {
    console.error("Error recording audit event:", error);
    return NextResponse.json(
      { error: "Failed to record audit event" },
      { status: 500 }
    );
  }
}

// GET /api/audit/docker - Get Docker AuthZ audit events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action"); // ALLOWED, DENIED, ERROR

    const db = getDb();

    let query = `
      SELECT 
        id,
        timestamp,
        event_type,
        severity,
        message,
        metadata,
        source
      FROM audit_logs 
      WHERE source = 'docker_authz'
    `;

    const params: any[] = [];

    if (action) {
      query += ` AND severity = ?`;
      params.push(action.toLowerCase());
    }

    query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const events = db.prepare(query).all(...params) as any[];

    // Parse metadata JSON
    const parsedEvents = events.map((event) => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
    }));

    return NextResponse.json(parsedEvents);
  } catch (error) {
    console.error("Error fetching Docker audit events:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit events" },
      { status: 500 }
    );
  }
}
