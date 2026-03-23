// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";

/// @title Axelar GMP Adapter (skeleton)
contract AxelarGMPAdapter is Ownable, IProtocolAdapter {
    address public gateway;
    mapping(uint256 => string) public chainIdToAxelarName;

    event GatewayUpdated(address indexed gateway);
    event ChainNameUpdated(uint256 indexed chainId, string name);
    event MessageSent(bytes32 indexed messageId, uint256 indexed destinationChainId, address indexed receiver);

    constructor(address gateway_) Ownable(msg.sender) {
        gateway = gateway_;
    }

    function setGateway(address gateway_) external onlyOwner {
        gateway = gateway_;
        emit GatewayUpdated(gateway_);
    }

    function setChainName(uint256 chainId, string calldata name) external onlyOwner {
        chainIdToAxelarName[chainId] = name;
        emit ChainNameUpdated(chainId, name);
    }

    function sendMessage(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        uint256 /*gasLimit*/
    ) external payable returns (bytes32) {
        bytes32 messageId = keccak256(
            abi.encode("AXELAR", destinationChainId, receiver, payload, msg.sender, block.timestamp)
        );
        emit MessageSent(messageId, destinationChainId, receiver);
        return messageId;
    }
}
