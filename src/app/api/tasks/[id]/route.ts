import { NextRequest, NextResponse } from "next/server";
import { getDb, getAllTasks, updateTask, deleteTask, type TaskStatus, type TaskPriority } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks = getAllTasks();
  const task = tasks.find(t => t.id === parseInt(id));
  
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  
  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { title, description, status, priority, business_id, assistant_id, assignee, due_date } = body;
    
    if (status) {
      const validStatuses: TaskStatus[] = ["todo", "in_progress", "review", "done"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }
    
    if (priority) {
      const validPriorities: TaskPriority[] = ["low", "medium", "high", "urgent"];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }
    }
    
    const task = updateTask(parseInt(id), {
      title,
      description,
      status,
      priority,
      business_id,
      assistant_id: assistant_id ? parseInt(assistant_id) : undefined,
      assignee,
      due_date,
    });
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteTask(parseInt(id));
  
  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  
  return NextResponse.json({ success: true });
}
