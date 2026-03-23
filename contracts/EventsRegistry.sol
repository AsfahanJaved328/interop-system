// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Events Registry (Phase 1)
contract EventsRegistry {
    struct SolverPerformance {
        uint256 totalExecuted;
        uint256 successfulExecutions;
        uint256 failedExecutions;
        uint256 reputation;
    }

    mapping(address => bytes32[]) public messagesBySender;
    mapping(address => bytes32[]) public messagesByReceiver;
    mapping(uint256 => bytes32[]) public messagesByChain;
    mapping(uint256 => bytes32[]) public intentsByStatus;
    mapping(address => SolverPerformance) public solverPerformance;

    event MessageIndexed(bytes32 indexed messageId, address indexed sender, address indexed receiver);
    event IntentIndexed(bytes32 indexed intentId, uint256 indexed status);
    event SolverUpdated(address indexed solver, uint256 success, uint256 failure);

    function indexMessage(bytes32 messageId, address sender, address receiver, uint256 chainId) external {
        messagesBySender[sender].push(messageId);
        messagesByReceiver[receiver].push(messageId);
        messagesByChain[chainId].push(messageId);
        emit MessageIndexed(messageId, sender, receiver);
    }

    function indexIntent(bytes32 intentId, uint256 status) external {
        intentsByStatus[status].push(intentId);
        emit IntentIndexed(intentId, status);
    }

    function updateSolver(address solver, bool success) external {
        SolverPerformance storage perf = solverPerformance[solver];
        perf.totalExecuted += 1;
        if (success) {
            perf.successfulExecutions += 1;
        } else {
            perf.failedExecutions += 1;
        }
        emit SolverUpdated(solver, perf.successfulExecutions, perf.failedExecutions);
    }
}
