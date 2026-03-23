// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Emergency withdraw module (basic)
contract EmergencyWithdraw is ReentrancyGuard {
    error TooEarly();
    error NothingToWithdraw();

    uint256 public pausedAt;
    uint256 public constant WITHDRAW_DELAY = 7 days;

    mapping(address => mapping(address => uint256)) public balances;

    function recordPause() external {
        if (pausedAt == 0) pausedAt = block.timestamp;
    }

    function recordDeposit(address user, address token, uint256 amount) external {
        balances[user][token] += amount;
    }

    function emergencyWithdraw(address token) external nonReentrant {
        if (pausedAt == 0 || block.timestamp < pausedAt + WITHDRAW_DELAY) revert TooEarly();
        uint256 amount = balances[msg.sender][token];
        if (amount == 0) revert NothingToWithdraw();
        balances[msg.sender][token] = 0;
        IERC20(token).transfer(msg.sender, amount);
    }
}
