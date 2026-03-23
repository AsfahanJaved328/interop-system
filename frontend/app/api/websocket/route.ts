export const dynamic = "force-dynamic";

function notificationPayload() {
  return {
    id: Date.now().toString(),
    title: "Protocol Update",
    message: "Local interoperability services are online.",
    level: "info"
  };
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(notificationPayload())}\n\n`));

      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(notificationPayload())}\n\n`));
      }, 15000);

      return () => clearInterval(interval);
    },
    cancel() {}
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
