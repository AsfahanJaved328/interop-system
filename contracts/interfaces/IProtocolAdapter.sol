// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Protocol adapter interface
interface IProtocolAdapter {
    function sendMessage(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        uint256 gasLimit
    ) external payable returns (bytes32);
}
