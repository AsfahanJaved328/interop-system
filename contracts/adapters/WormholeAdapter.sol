// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";

/// @title Wormhole Adapter (skeleton)
contract WormholeAdapter is Ownable, IProtocolAdapter {
    address public bridge;
    mapping(uint256 => uint16) public chainIdToWormhole;

    event BridgeUpdated(address indexed bridge);
    event ChainIdMapped(uint256 indexed chainId, uint16 wormholeChainId);
    event MessageSent(bytes32 indexed messageId, uint256 indexed destinationChainId, address indexed receiver);

    constructor(address bridge_) Ownable(msg.sender) {
        bridge = bridge_;
    }

    function setBridge(address bridge_) external onlyOwner {
        bridge = bridge_;
        emit BridgeUpdated(bridge_);
    }

    function setChainId(uint256 chainId, uint16 wormholeChainId) external onlyOwner {
        chainIdToWormhole[chainId] = wormholeChainId;
        emit ChainIdMapped(chainId, wormholeChainId);
    }

    function sendMessage(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        uint256 /*gasLimit*/
    ) external payable returns (bytes32) {
        bytes32 messageId = keccak256(
            abi.encode("WORMHOLE", destinationChainId, receiver, payload, msg.sender, block.timestamp)
        );
        emit MessageSent(messageId, destinationChainId, receiver);
        return messageId;
    }
}
