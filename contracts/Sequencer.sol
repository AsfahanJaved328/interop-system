// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Shared Sequencer Network (MVP)
contract Sequencer is AccessControl {
    bytes32 public constant SEQUENCER_ROLE = keccak256("SEQUENCER_ROLE");

    struct Batch {
        bytes32 batchId;
        bytes[] transactions;
        uint256 sourceChain;
        uint256[] targetChains;
        bytes signature;
        uint256 timestamp;
        bool confirmed;
    }

    mapping(address => bool) public sequencerSet;
    address public currentLeader;
    uint256 public roundRobin;

    mapping(bytes32 => Batch) public pendingBatches;
    mapping(bytes32 => Batch) public confirmedBatches;

    event SequencerRegistered(address indexed sequencer);
    event BatchProposed(bytes32 indexed batchId, address indexed proposer);
    event BatchConfirmed(bytes32 indexed batchId);

    error NotSequencer();
    error BatchNotFound();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function registerSequencer(address sequencer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        sequencerSet[sequencer] = true;
        _grantRole(SEQUENCER_ROLE, sequencer);
        emit SequencerRegistered(sequencer);
    }

    function proposeBatch(
        bytes32 batchId,
        bytes[] calldata transactions,
        uint256 sourceChain,
        uint256[] calldata targetChains,
        bytes calldata signature
    ) external {
        if (!sequencerSet[msg.sender]) revert NotSequencer();
        Batch storage batch = pendingBatches[batchId];
        batch.batchId = batchId;
        batch.sourceChain = sourceChain;
        batch.signature = signature;
        batch.timestamp = block.timestamp;
        for (uint256 i = 0; i < transactions.length; i++) {
            batch.transactions.push(transactions[i]);
        }
        for (uint256 j = 0; j < targetChains.length; j++) {
            batch.targetChains.push(targetChains[j]);
        }
        emit BatchProposed(batchId, msg.sender);
    }

    function executeBatch(bytes32 batchId) external {
        if (!sequencerSet[msg.sender]) revert NotSequencer();
        Batch storage batch = pendingBatches[batchId];
        if (batch.batchId == bytes32(0)) revert BatchNotFound();
        batch.confirmed = true;
        confirmedBatches[batchId] = batch;
        delete pendingBatches[batchId];
        emit BatchConfirmed(batchId);
    }
}
