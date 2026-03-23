// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Simple rate limiter for value transfers
contract RateLimiter {
    error RateLimitExceeded();

    uint256 public windowSize;
    uint256 public maxValue;
    uint256 public windowStart;
    uint256 public valueUsed;

    constructor(uint256 windowSize_, uint256 maxValue_) {
        windowSize = windowSize_;
        maxValue = maxValue_;
        windowStart = block.timestamp;
    }

    function consume(uint256 amount) external {
        if (block.timestamp > windowStart + windowSize) {
            windowStart = block.timestamp;
            valueUsed = 0;
        }
        if (valueUsed + amount > maxValue) revert RateLimitExceeded();
        valueUsed += amount;
    }
}
