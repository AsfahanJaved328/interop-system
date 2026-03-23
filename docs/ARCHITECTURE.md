# Architecture Overview (Phase 1)

This document defines the initial scaffolding. It is intentionally minimal and will expand
with each phase. The goal is a modular system with strong security boundaries.

## Phase 1 Components
- `CrossChainTypes`: common structs/enums used across the protocol
- `CrossChainRouter`: routes messages through pluggable adapters
- `EthereumLightClient`: placeholder for sync-committee verification
- `ZKLightClient`: placeholder for ZK verification
- Security modules: pause guardian, rate limiter, allowlist, circuit breaker, emergency withdraw

## Next Phases
- Light client verification (full)
- ZK bridges and validity proofs
- Intent-based solver network
- Shared sequencer
- Account abstraction across chains
- Governance and dispute resolution

## Current Modules
- Routing + adapters
- Light clients (MVP)
- Intent system + solver registry
- ZK bridge (MVP)
- Governance + timelock
- Treasury + fee routing
