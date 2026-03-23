# Security Considerations

This document summarizes security assumptions and mitigation points.

## Core Risks
- Light client verification and proof validation correctness
- Cross-chain message ordering and replay protection
- Misconfigured adapters or incorrect routing
- Governance capture or upgrade abuse

## Mitigations
- Use OpenZeppelin AccessControl, Pausable, and ReentrancyGuard
- Enforce strict role separation for admin, proposer, and executor
- Verify proofs before message delivery or intent completion
- Use timelocks for upgrades and governance changes

## Recommended Reviews
- Formal verification of light client and bridge logic
- Slither/Foundry fuzzing on routing and intent modules
