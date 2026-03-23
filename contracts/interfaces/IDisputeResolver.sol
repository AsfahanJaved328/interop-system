// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDisputeResolver {
    function createDispute(
        bytes32 targetId,
        address defendant,
        uint8 reason,
        bytes32 evidenceHash
    ) external payable returns (bytes32);
}
