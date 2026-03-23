# Integration Guide

## For dApps
1. Use SDK types in `sdk/src/types.ts`.
2. Submit intents via `IntentContract.createIntent`.
3. Monitor execution via events or subgraph.

## For Relayers
1. Watch for `MessageRouted` events.
2. Verify light client proofs.
3. Call `deliverMessageWithProof`.
