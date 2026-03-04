import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assistantId = searchParams.get("assistantId");

  if (!assistantId) {
    return new Response("Missing assistantId", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const db = getDb();
      
      const sendMessage = (data: { timestamp: string; direction: string; message: string; userId: string }) => {
        const chunk = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      const checkForNewMessages = () => {
        try {
          const lastMessage = db.prepare(`
            SELECT timestamp, direction, message_text, user_id
            FROM chat_messages
            WHERE assistant_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
          `).get(assistantId) as { timestamp: string; direction: string; message_text: string; user_id: string } | undefined;

          if (lastMessage) {
            sendMessage({
              timestamp: lastMessage.timestamp,
              direction: lastMessage.direction,
              message: lastMessage.message_text,
              userId: lastMessage.user_id,
            });
          }
        } catch (error) {
          console.error("SSE error:", error);
        }
      };

      const interval = setInterval(checkForNewMessages, 2000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });

      checkForNewMessages();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
