export async function GET() {
  return new Response(JSON.stringify({ status: "GraphQL endpoint stub" }), {
    headers: { "content-type": "application/json" }
  });
}
