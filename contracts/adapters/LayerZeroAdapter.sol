// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";

/// @title LayerZero Adapter (skeleton)
contract LayerZeroAdapter is Ownable, IProtocolAdapter {
    address public endpoint;
    mapping(uint256 => uint16) public chainIdToLayerZero;

    event EndpointUpdated(address indexed endpoint);
    event ChainIdMapped(uint256 indexed chainId, uint16 lzChainId);
    event MessageSent(bytes32 indexed messageId, uint256 indexed destinationChainId, address indexed receiver);

    constructor(address endpoint_) Ownable(msg.sender) {
        endpoint = endpoint_;
    }

    function setEndpoint(address endpoint_) external onlyOwner {
        endpoint = endpoint_;
        emit EndpointUpdated(endpoint_);
    }

    function setChainId(uint256 chainId, uint16 lzChainId) external onlyOwner {
        chainIdToLayerZero[chainId] = lzChainId;
        emit ChainIdMapped(chainId, lzChainId);
    }

    function sendMessage(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        uint256 /*gasLimit*/
    ) external payable returns (bytes32) {
        bytes32 messageId = keccak256(
            abi.encode("LAYERZERO", destinationChainId, receiver, payload, msg.sender, block.timestamp)
        );
        emit MessageSent(messageId, destinationChainId, receiver);
        return messageId;
    }
}
