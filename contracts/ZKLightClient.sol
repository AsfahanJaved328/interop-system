// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ILightClient} from "./interfaces/ILightClient.sol";

/// @title ZK Light Client (Phase 1 placeholder)
contract ZKLightClient is ILightClient {
    error InvalidProof();
    error InvalidHeader();

    address public verifier;
    uint256 public chainId;
    bytes32 public genesisHash;
    uint256 public latestVerifiedBlock;

    mapping(uint256 => bytes32) public stateCommitments;

    constructor(address verifier_, uint256 chainId_, bytes32 genesisHash_) {
        verifier = verifier_;
        chainId = chainId_;
        genesisHash = genesisHash_;
    }

    function isFrozen() external pure returns (bool) {
        return false;
    }

    function getLatestVerifiedBlock() external view returns (uint256) {
        return latestVerifiedBlock;
    }

    function getBlockHash(uint256 /*blockNumber*/) external pure returns (bytes32) {
        return bytes32(0);
    }

    function verifyHeader(bytes calldata header, bytes calldata /*proof*/) external returns (bool) {
        // MVP placeholder: header is abi.encode(blockNumber, blockHash, stateRoot)
        (uint256 blockNumber, bytes32 blockHash, bytes32 stateRoot) =
            abi.decode(/*header*/ header, (uint256, bytes32, bytes32));
        if (blockHash == bytes32(0) || stateRoot == bytes32(0)) revert InvalidHeader();

        stateCommitments[blockNumber] = stateRoot;
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
        return false;
    }

    function verifyStateProof(
        bytes calldata /*accountProof*/,
        bytes32 stateRoot
    ) external view returns (bool) {
        if (latestVerifiedBlock == 0) return false;
        return stateCommitments[latestVerifiedBlock] == stateRoot;
    }
}
