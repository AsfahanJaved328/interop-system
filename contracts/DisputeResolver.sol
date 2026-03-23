// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Dispute Resolver (Phase 1)
contract DisputeResolver is AccessControl {
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    enum DisputeReason {
        INVALID_PROOF,
        DOUBLE_SIGN,
        CENSORSHIP,
        INCORRECT_EXECUTION
    }

    enum DisputeStatus {
        OPEN,
        RESOLVED
    }

    struct Dispute {
        bytes32 disputeId;
        bytes32 targetId;
        address challenger;
        address defendant;
        DisputeReason reason;
        bytes32 evidenceHash;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        uint256 votesFor;
        uint256 votesAgainst;
    }

    uint256 public disputeWindow = 7 days;
    uint256 public disputeFee = 0.1 ether;

    mapping(bytes32 => Dispute) public disputes;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;

    event DisputeCreated(bytes32 indexed disputeId, bytes32 indexed targetId, address indexed challenger);
    event DisputeVoted(bytes32 indexed disputeId, address indexed voter, bool support);
    event DisputeResolved(bytes32 indexed disputeId, bool outcome);

    error DisputeNotFound();
    error DisputeClosed();
    error AlreadyVoted();
    error IncorrectFee();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ARBITRATOR_ROLE, admin);
    }

    function createDispute(
        bytes32 targetId,
        address defendant,
        DisputeReason reason,
        bytes32 evidenceHash
    ) external payable returns (bytes32) {
        if (msg.value != disputeFee) revert IncorrectFee();
        bytes32 disputeId = keccak256(abi.encode(msg.sender, targetId, block.timestamp, evidenceHash));
        disputes[disputeId] = Dispute({
            disputeId: disputeId,
            targetId: targetId,
            challenger: msg.sender,
            defendant: defendant,
            reason: reason,
            evidenceHash: evidenceHash,
            status: DisputeStatus.OPEN,
            createdAt: block.timestamp,
            resolvedAt: 0,
            votesFor: 0,
            votesAgainst: 0
        });
        emit DisputeCreated(disputeId, targetId, msg.sender);
        return disputeId;
    }

    function voteForDispute(bytes32 disputeId, bool support) external onlyRole(ARBITRATOR_ROLE) {
        Dispute storage dispute = disputes[disputeId];
        if (dispute.disputeId == bytes32(0)) revert DisputeNotFound();
        if (dispute.status != DisputeStatus.OPEN) revert DisputeClosed();
        if (hasVoted[disputeId][msg.sender]) revert AlreadyVoted();

        hasVoted[disputeId][msg.sender] = true;
        if (support) {
            dispute.votesFor += 1;
        } else {
            dispute.votesAgainst += 1;
        }
        emit DisputeVoted(disputeId, msg.sender, support);
    }

    function resolveDispute(bytes32 disputeId) external onlyRole(ARBITRATOR_ROLE) {
        Dispute storage dispute = disputes[disputeId];
        if (dispute.disputeId == bytes32(0)) revert DisputeNotFound();
        if (dispute.status != DisputeStatus.OPEN) revert DisputeClosed();
        if (block.timestamp < dispute.createdAt + disputeWindow) revert DisputeClosed();

        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolvedAt = block.timestamp;
        bool outcome = dispute.votesFor > dispute.votesAgainst;
        emit DisputeResolved(disputeId, outcome);
    }
}
