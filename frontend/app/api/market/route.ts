export const dynamic = "force-dynamic";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon-ecosystem-token,solana,avalanche-2,binancecoin&vs_currencies=usd&include_24hr_change=true";

export async function GET() {
  const headers: Record<string, string> = {
    accept: "application/json"
  };

  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }

  try {
    const response = await fetch(COINGECKO_URL, {
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      return Response.json(
        { error: "Unable to load market prices right now." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json({
      ethereum: data.ethereum,
      polygon: data["polygon-ecosystem-token"],
      solana: data.solana,
      avalanche: data["avalanche-2"],
      bnb: data.binancecoin
    });
  } catch {
    return Response.json({ error: "Unable to load market prices right now." }, { status: 500 });
  }
}
