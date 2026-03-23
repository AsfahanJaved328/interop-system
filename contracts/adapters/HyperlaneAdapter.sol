// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";

/// @title Hyperlane Adapter (skeleton)
contract HyperlaneAdapter is Ownable, IProtocolAdapter {
    address public mailbox;
    mapping(uint256 => uint32) public chainIdToDomain;

    event MailboxUpdated(address indexed mailbox);
    event DomainMapped(uint256 indexed chainId, uint32 domain);
    event MessageSent(bytes32 indexed messageId, uint256 indexed destinationChainId, address indexed receiver);

    constructor(address mailbox_) Ownable(msg.sender) {
        mailbox = mailbox_;
    }

    function setMailbox(address mailbox_) external onlyOwner {
        mailbox = mailbox_;
        emit MailboxUpdated(mailbox_);
    }

    function setDomain(uint256 chainId, uint32 domain) external onlyOwner {
        chainIdToDomain[chainId] = domain;
        emit DomainMapped(chainId, domain);
    }

    function sendMessage(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        uint256 /*gasLimit*/
    ) external payable returns (bytes32) {
        bytes32 messageId = keccak256(
            abi.encode("HYPERLANE", destinationChainId, receiver, payload, msg.sender, block.timestamp)
        );
        emit MessageSent(messageId, destinationChainId, receiver);
        return messageId;
    }
}
