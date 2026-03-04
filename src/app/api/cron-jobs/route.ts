import { NextRequest, NextResponse } from "next/server";
import { getCronJobs, getCronJobById, addCronJob, updateCronJob, deleteCronJob, getAllAssistants } from "@/lib/db";

export async function GET() {
  try {
    const jobs = getCronJobs();
    const assistants = getAllAssistants();
    return NextResponse.json({ jobs, assistants });
  } catch (error) {
    console.error("Error fetching cron jobs:", error);
    return NextResponse.json({ error: "Failed to fetch cron jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, cron_expression, command, assistant_id } = body;

    if (!name || !cron_expression || !command) {
      return NextResponse.json(
        { error: "Missing required fields: name, cron_expression, command" },
        { status: 400 }
      );
    }

    const job = addCronJob(name, description || null, cron_expression, command, assistant_id || null);

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error adding cron job:", error);
    return NextResponse.json({ error: "Failed to add cron job" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, cron_expression, command, enabled, assistant_id, last_run, next_run } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const updates: {
      name?: string;
      description?: string | null;
      cron_expression?: string;
      command?: string;
      enabled?: boolean;
      assistant_id?: number | null;
      last_run?: string | null;
      next_run?: string | null;
    } = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (cron_expression !== undefined) updates.cron_expression = cron_expression;
    if (command !== undefined) updates.command = command;
    if (enabled !== undefined) updates.enabled = enabled;
    if (assistant_id !== undefined) updates.assistant_id = assistant_id;
    if (last_run !== undefined) updates.last_run = last_run;
    if (next_run !== undefined) updates.next_run = next_run;

    const job = updateCronJob(id, updates);

    if (!job) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error updating cron job:", error);
    return NextResponse.json({ error: "Failed to update cron job" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const deleted = deleteCronJob(id);

    if (!deleted) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cron job:", error);
    return NextResponse.json({ error: "Failed to delete cron job" }, { status: 500 });
  }
}
