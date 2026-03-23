# Interop Frontend

## Local Development
- `npm install`
- `npm run dev`
- Open `http://localhost:3001`

## Public Deployment
- Recommended host: Vercel
- Build command: `npm run build`
- Output mode: standard Next.js app
- Required env vars:
  - `NEXT_PUBLIC_INTENT_CONTRACT`
  - `NEXT_PUBLIC_ROUTER_CONTRACT`
  - `NEXT_PUBLIC_FEE_ORACLE`
  - `NEXT_PUBLIC_RPC_URL`
  - `NEXT_PUBLIC_ADAPTER_AXELAR`
  - `NEXT_PUBLIC_ADAPTER_LAYERZERO`
  - `NEXT_PUBLIC_ADAPTER_WORMHOLE`
  - `NEXT_PUBLIC_ADAPTER_HYPERLANE`
  - `COINGECKO_API_KEY` (optional)

## Testnet Promotion
- Deploy contracts: `npm run deploy:testnet:full`
- Promote testnet env into the frontend: `npm run promote:testnet-env`
- Build again before hosting: `npm run build`
