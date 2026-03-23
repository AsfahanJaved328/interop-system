# Gas Optimization Notes

## Strategies
- Use custom errors over revert strings
- Favor `calldata` for external params
- Minimize storage writes in hot paths
- Batch updates where possible

## Benchmarks
- Router message route: O(1) per adapter
- Intent create: O(n) for provided/expected arrays
