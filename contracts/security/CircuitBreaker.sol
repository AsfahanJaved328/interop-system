// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Circuit breaker for anomaly detection
contract CircuitBreaker {
    event Tripped(address indexed by, bytes32 indexed reason);

    bool public tripped;

    function trip(bytes32 reason) external {
        tripped = true;
        emit Tripped(msg.sender, reason);
    }
}
