# Protocol Specification

## Message Flow
1. User submits a `CrossChainMessage` via `CrossChainRouter.routeMessage`.
2. Router selects adapters and emits `MessageRouted`.
3. Adapters deliver messages and call `deliverMessage` or `deliverMessageWithProof`.
4. Light client proof validation marks execution success.

## Intent Flow
1. User creates intent with constraints and fee payment.
2. Solver accepts and executes.
3. Execution validated by proof (optional).
4. Dispute window allows slashing if execution is invalid.

## ZK Bridge Flow
1. User deposits tokens, emitting a deposit root.
2. Relayer submits proof and finalizes root.
3. User withdraws on destination chain.
