# Safe Deployment Plan

This plan is designed to keep PC load low and avoid running too many heavy tasks at once.

## Stage 1: Prepare Secrets
- Copy `.env.example` to `.env`
- Add:
  - `TESTNET_RPC_URL`
  - `TESTNET_PRIVATE_KEY`
  - `COINGECKO_API_KEY` (optional)

## Stage 2: Run Preflight
- Run `npm run deploy:testnet:preflight`
- This only checks files and required values
- It does not deploy anything

## Stage 3: Deploy Contracts
- Run `npm run deploy:testnet:full`
- This deploys router, fee oracle, intent contract, and adapters
- It writes addresses to `frontend/.env.testnet`

## Stage 4: Promote Frontend Env
- Run `npm run promote:testnet-env`
- This copies testnet addresses into `frontend/.env.local`

## Stage 5: Build Frontend
- Run:
  - `cd frontend`
  - `npm run build`

## Stage 6: Public Hosting
- Best first choice: Vercel
- Set the same frontend env vars in Vercel project settings
- Deploy the `frontend` folder as a Next.js app

## Notes
- Do not run local Hardhat node and testnet deployment together
- Close extra browser tabs before deployment
- Run one step at a time and wait for it to finish
