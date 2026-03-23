// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {CrossChainRouter} from "./CrossChainRouter.sol";

/// @title Governance MVP (Timelock + proposals)
contract Governance is AccessControl {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    struct Proposal {
        bytes32 id;
        address proposer;
        address target;
        uint256 value;
        bytes data;
        uint256 createdAt;
        uint256 executeAfter;
        bool executed;
        uint256 forVotes;
        uint256 againstVotes;
    }

    uint256 public timelockDelay = 1 days;
    uint256 public executionGracePeriod = 7 days;
    uint256 public quorum = 10_000 ether;
    IVotes public voteToken;
    CrossChainRouter public router;
    mapping(bytes32 => Proposal) public proposals;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(bytes32 indexed id, address indexed proposer);
    event ProposalExecuted(bytes32 indexed id);
    event VoteCast(bytes32 indexed id, address indexed voter, bool support, uint256 weight);
    event CrossChainExecution(bytes32 indexed id, uint256 destinationChainId);
    event RouterUpdated(address indexed router);
    event TimelockUpdated(uint256 delay, uint256 gracePeriod);

    error TimelockActive();
    error ProposalNotFound();
    error AlreadyExecuted();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROPOSER_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        _grantRole(DEFAULT_ADMIN_ROLE, address(this));
    }

    function setVoteToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        voteToken = IVotes(token);
    }

    function setRouter(address router_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        router = CrossChainRouter(router_);
        emit RouterUpdated(router_);
    }

    function setQuorum(uint256 newQuorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        quorum = newQuorum;
    }

    function setTimelockDelay(uint256 delay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        timelockDelay = delay;
    }

    function setGracePeriod(uint256 gracePeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        executionGracePeriod = gracePeriod;
        emit TimelockUpdated(timelockDelay, gracePeriod);
    }

    function createProposal(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyRole(PROPOSER_ROLE) returns (bytes32) {
        bytes32 id = keccak256(abi.encode(target, value, data, block.timestamp));
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            target: target,
            value: value,
            data: data,
            createdAt: block.timestamp,
            executeAfter: block.timestamp + timelockDelay,
            executed: false,
            forVotes: 0,
            againstVotes: 0
        });
        emit ProposalCreated(id, msg.sender);
        return id;
    }

    function executeProposal(bytes32 id) external onlyRole(EXECUTOR_ROLE) {
        Proposal storage p = proposals[id];
        if (p.id == bytes32(0)) revert ProposalNotFound();
        if (p.executed) revert AlreadyExecuted();
        if (block.timestamp < p.executeAfter) revert TimelockActive();
        if (block.timestamp > p.executeAfter + executionGracePeriod) revert TimelockActive();
        if (p.forVotes < quorum) revert TimelockActive();

        p.executed = true;
        (bool ok, ) = p.target.call{value: p.value}(p.data);
        require(ok, "execution failed");
        emit ProposalExecuted(id);
    }

    function castVote(bytes32 id, bool support) external {
        Proposal storage p = proposals[id];
        if (p.id == bytes32(0)) revert ProposalNotFound();
        if (hasVoted[id][msg.sender]) revert AlreadyExecuted();
        uint256 weight = voteToken.getVotes(msg.sender);
        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }
        hasVoted[id][msg.sender] = true;
        emit VoteCast(id, msg.sender, support, weight);
    }

    function executeCrossChain(bytes32 id, uint256 destinationChainId) external onlyRole(EXECUTOR_ROLE) {
        Proposal storage p = proposals[id];
        if (p.id == bytes32(0)) revert ProposalNotFound();
        if (p.executed) revert AlreadyExecuted();
        if (block.timestamp < p.executeAfter) revert TimelockActive();
        if (block.timestamp > p.executeAfter + executionGracePeriod) revert TimelockActive();
        if (p.forVotes < quorum) revert TimelockActive();
        p.executed = true;
        if (address(router) != address(0)) {
            CrossChainRouter.Protocol[] memory empty;
            router.routeMessage(destinationChainId, p.target, p.data, empty, block.timestamp + 3600);
        }
        emit CrossChainExecution(id, destinationChainId);
    }

    receive() external payable {}
}
