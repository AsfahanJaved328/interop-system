# Upgrade Procedures

## Proxy Upgrades (MVP)
1. Deploy new implementation.
2. Use `UpgradeManager.upgradeProxy(proxy, implementation)` from an authorized role.
3. Verify new implementation with scripts.

## Governance-Driven Upgrades
1. Submit proposal that calls `upgradeProxy`.
2. Collect votes to meet quorum.
3. After timelock, execute proposal.

## Rollback
Maintain a previous implementation version for rollback if issues are detected.
