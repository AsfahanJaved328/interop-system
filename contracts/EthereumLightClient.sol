// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ILightClient} from "./interfaces/ILightClient.sol";

/// @title Ethereum PoS Light Client (Phase 1 placeholder)
/// @notice Sync committee verification is stubbed and will be implemented in Phase 2.
contract EthereumLightClient is ILightClient {
    error ClientFrozen();
    error InvalidHeader();
    error InvalidProof();

    uint256 public constant SYNC_COMMITTEE_SIZE = 512;
    uint256 public constant FINALITY_THRESHOLD = 2;

    uint256 public latestVerifiedBlock;
    uint256 public latestFinalizedBlock;
    bytes32 public latestFinalizedBlockHash;
    bool public frozen;

    mapping(uint256 => bytes32) public verifiedBlockHashes;
    mapping(uint256 => uint256) public blockTimestamps;
    mapping(uint256 => bytes32) public stateRoots;
    mapping(bytes32 => bool) public misbehaviorReports;

    function isFrozen() external view returns (bool) {
        return frozen;
    }

    function getLatestVerifiedBlock() external view returns (uint256) {
        return latestVerifiedBlock;
    }

    function getBlockHash(uint256 blockNumber) external view returns (bytes32) {
        return verifiedBlockHashes[blockNumber];
    }

    function verifyHeader(bytes calldata header, bytes calldata /*proof*/) external returns (bool) {
        if (frozen) revert ClientFrozen();
        // MVP placeholder: header is abi.encode(blockNumber, blockHash, stateRoot, timestamp)
        (uint256 blockNumber, bytes32 blockHash, bytes32 stateRoot, uint256 timestamp) =
            abi.decode(/*header*/ header, (uint256, bytes32, bytes32, uint256));

        if (blockHash == bytes32(0)) revert InvalidHeader();

        verifiedBlockHashes[blockNumber] = blockHash;
        stateRoots[blockNumber] = stateRoot;
        blockTimestamps[blockNumber] = timestamp;
        if (blockNumber > latestVerifiedBlock) {
            latestVerifiedBlock = blockNumber;
        }
        emit BlockHeaderVerified(blockNumber, blockHash);
        emit ClientStateUpdated(latestVerifiedBlock);
        return true;
    }

    function verifyTransactionInclusion(
        bytes32 /*txHash*/,
        bytes32 /*txRoot*/,
        bytes calldata /*proof*/
    ) external pure returns (bool) {
        // Phase 1: placeholder
        return false;
    }

    function verifyStateProof(
        bytes calldata /*accountProof*/,
        bytes32 stateRoot
    ) external view returns (bool) {
        if (latestVerifiedBlock == 0) return false;
        return stateRoots[latestVerifiedBlock] == stateRoot;
    }

    function reportMisbehavior(bytes32 evidenceHash) external {
        if (misbehaviorReports[evidenceHash]) return;
        misbehaviorReports[evidenceHash] = true;
        frozen = true;
        emit MisbehaviorDetected(msg.sender, evidenceHash);
    }
}
