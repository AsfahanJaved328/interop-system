# Interop System (Phase 1 Scaffold)

This repository is the foundation for a production-grade blockchain interoperability stack.
We are starting with a clean, secure scaffold and core protocol contracts, then layering advanced
modules in phases (light clients, message routing, intents, ZK, sequencers, AA, governance, SDK, subgraph).

## Status
- Phase 1: Repo scaffold + core structs + router + security modules.
- Next: light client MVP, ZK light client, intent system, sequencer, AA, ZK bridge.

## Structure
- `contracts/` Solidity contracts (0.8.24)
- `test/` Hardhat tests (Phase 1 placeholder)
- `scripts/` deployment scripts
- `docs/` architecture and specifications
- `sdk/` TypeScript SDK (skeleton)
- `subgraph/` Graph subgraph (skeleton)
- `devops/` Docker/K8s/monitoring (skeleton)

## Quick Start
```bash
npm install
npm run test
```

## Notes
This is a scaffold intended to be expanded systematically. Each module will include:
- OpenZeppelin security standards
- Access control and pausing
- Custom errors for gas efficiency
- NatSpec documentation

