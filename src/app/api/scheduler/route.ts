import { NextResponse } from "next/server";
import { getAllScheduledTasks, getAllAssistants } from "@/lib/db";

export async function GET() {
  try {
    const tasks = getAllScheduledTasks();
    const assistants = getAllAssistants();
    
    const tasksWithAssistant = tasks.map(task => {
      const assistant = assistants.find(a => a.id === task.assistant_id);
      return {
        ...task,
        enabled: Boolean(task.enabled),
        assistant_name: assistant?.name || "Unknown",
      };
    });

    return NextResponse.json(tasksWithAssistant);
  } catch (error) {
    console.error("Error fetching scheduled tasks:", error);
    return NextResponse.json({ error: "Failed to fetch scheduled tasks" }, { status: 500 });
  }
}
