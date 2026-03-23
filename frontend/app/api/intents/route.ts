import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const body = await req.json();
  return new Response(
    JSON.stringify({
      status: "accepted",
      intentId: randomUUID(),
      payload: body
    }),
    { headers: { "content-type": "application/json" } }
  );
}
