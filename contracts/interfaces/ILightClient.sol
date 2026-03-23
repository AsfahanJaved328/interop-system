// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Light client verification interface
interface ILightClient {
    event BlockHeaderVerified(uint256 indexed blockNumber, bytes32 indexed blockHash);
    event ClientStateUpdated(uint256 indexed latestVerifiedBlock);
    event MisbehaviorDetected(address indexed reporter, bytes32 indexed evidenceHash);

    function verifyHeader(bytes calldata header, bytes calldata proof) external returns (bool);
    function verifyTransactionInclusion(
        bytes32 txHash,
        bytes32 txRoot,
        bytes calldata proof
    ) external view returns (bool);
    function verifyStateProof(
        bytes calldata accountProof,
        bytes32 stateRoot
    ) external view returns (bool);
    function getLatestVerifiedBlock() external view returns (uint256);
    function getBlockHash(uint256 blockNumber) external view returns (bytes32);
    function isFrozen() external view returns (bool);
}
