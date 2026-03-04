import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, getTasksByStatus, createTask, updateTask, deleteTask, type TaskStatus, type TaskPriority } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") as TaskStatus | null;
  
  const tasks = status ? getTasksByStatus(status) : getAllTasks();
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, priority, business_id, assistant_id, assignee, due_date } = body;
    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    const validStatuses = ["todo", "in_progress", "review", "done"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    
    const task = createTask({
      title,
      description,
      status,
      priority,
      business_id,
      assistant_id: assistant_id ? parseInt(assistant_id) : undefined,
      assignee,
      due_date,
    });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
