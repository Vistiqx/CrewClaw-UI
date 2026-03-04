import { NextRequest } from "next/server";
import Docker from "dockerode";

const docker = new Docker();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const containerId = searchParams.get("containerId");

  if (!containerId) {
    return new Response("Missing containerId", { status: 400 });
  }

  const encoder = new TextEncoder();
  let isConnected = true;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        if (!isConnected) return;
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const heartbeat = setInterval(() => {
        if (!isConnected) {
          clearInterval(heartbeat);
          return;
        }
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      try {
        const logStream = await docker.getContainer(containerId).logs({
          follow: true,
          stdout: true,
          stderr: true,
          tail: 100,
          timestamps: true,
        });

        let buffer = "";

        logStream.on("data", (chunk: Buffer) => {
          const chunkStr = chunk.toString("utf8");
          const lines = (buffer + chunkStr).split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              const parsed = parseDockerLogLine(line);
              if (parsed) {
                sendEvent(parsed);
              }
            }
          }
        });

        logStream.on("end", () => {
          isConnected = false;
          clearInterval(heartbeat);
          controller.close();
        });

        logStream.on("error", (err: Error) => {
          isConnected = false;
          clearInterval(heartbeat);
          controller.error(err);
        });
      } catch (err) {
        isConnected = false;
        clearInterval(heartbeat);
        controller.error(err);
      }
    },
    cancel() {
      isConnected = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function parseDockerLogLine(line: string): { timestamp: string; level: string; message: string } | null {
  const cleaned = line.replace(/^[\x00-\x08]/, "").trim();
  
  let timestamp = "";
  let message = cleaned;
  
  const timestampMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?)\s*/);
  if (timestampMatch) {
    timestamp = timestampMatch[1];
    message = cleaned.slice(timestampMatch[0].length);
  } else {
    timestamp = new Date().toISOString();
  }

  let level = "info";
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("error") || lowerMessage.includes("err") || lowerMessage.includes("fatal") || lowerMessage.includes("critical")) {
    level = "error";
  } else if (lowerMessage.includes("warn")) {
    level = "warning";
  } else if (lowerMessage.includes("debug")) {
    level = "debug";
  }

  return {
    timestamp,
    level,
    message,
  };
}
