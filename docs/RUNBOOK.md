# Operations Runbook

## Incident Response
- Pause router if anomalies detected
- Trigger circuit breaker if message failure spikes
- Disable compromised adapters

## Adapter Deployment
- Set `ROUTER_ADDRESS` to the deployed router address
- Run `npm run deploy:adapters`
- Verify adapters with `getAdapterStats`
- For testnet use `npm run deploy:testnet:full`
- Promote the frontend to testnet addresses with `npm run promote:testnet-env`

## Local Dev Stack
- Start everything with `npm run dev:stack`
- If `deploy:local` errors on named exports, ensure scripts import hardhat as:
  `import hardhat from "hardhat"; const { ethers } = hardhat;`

## Public Hosting
- Frontend host: Vercel is the easiest fit
- Set frontend env vars from `frontend/.env.testnet`
- Add `COINGECKO_API_KEY` if you want the live market snapshot to avoid rate limits
- Build locally first with `cd frontend && npm run build`
- Use the staged process in `docs/SAFE_DEPLOYMENT.md` if you want the lowest-risk deployment path

## Security Scans
- Slither: `npm run slither`
- Foundry fuzzing: `npm run foundry:test`

## Recovery
- Restore from last known good deployment
- Re-enable adapters gradually

## Monitoring
- Track message success rates and latency
- Alert on failed proofs or disputes

## Upgrades
- Run upgrade simulation checklist
- Use timelock + grace window
- Roll back on anomaly detection
