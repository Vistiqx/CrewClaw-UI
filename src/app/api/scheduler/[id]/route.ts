import { NextResponse } from "next/server";
import { toggleScheduledTask, getScheduledTaskById } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const existingTask = getScheduledTaskById(taskId);
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid enabled value" }, { status: 400 });
    }

    const updatedTask = toggleScheduledTask(taskId, enabled);
    
    return NextResponse.json({
      ...updatedTask,
      enabled: Boolean(updatedTask?.enabled),
    });
  } catch (error) {
    console.error("Error toggling scheduled task:", error);
    return NextResponse.json({ error: "Failed to toggle scheduled task" }, { status: 500 });
  }
}
