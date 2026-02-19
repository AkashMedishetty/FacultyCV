import { getRoomState, getRoomVersion } from "@/lib/kv";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const roomCode = params.code;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastVersion = -1;

      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const poll = async () => {
        try {
          const version = await getRoomVersion(roomCode);
          if (version !== lastVersion) {
            lastVersion = version;
            const state = await getRoomState(roomCode);
            if (state) {
              sendEvent(JSON.stringify({ ...state, version }));
            }
          }
        } catch {
          // Silently handle polling errors
        }
      };

      // Send initial state
      await poll();

      // Poll every 300ms
      const interval = setInterval(poll, 300);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
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
