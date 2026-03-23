// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title Universal Account (MVP)
contract UniversalAccount is AccessControl {
    using ECDSA for bytes32;

    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    bytes32 public constant ENTRYPOINT_ROLE = keccak256("ENTRYPOINT_ROLE");

    mapping(address => mapping(uint256 => address)) public deployments;
    mapping(address => uint256) public nonces;
    mapping(address => uint256) public aggregatedNonces;

    event UserOpHandled(address indexed sender, uint256 nonce, uint256[] targetChains);
    event AggregatedOpHandled(address indexed sender, uint256 aggregatedNonce);

    error InvalidSignature();
    error InvalidNonce();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ENTRYPOINT_ROLE, admin);
    }

    function handleCrossChainUserOp(UserOperation calldata op, uint256[] calldata targetChains) external onlyRole(ENTRYPOINT_ROLE) {
        if (op.nonce != nonces[op.sender]) revert InvalidNonce();
        bytes32 hash = keccak256(
            abi.encode(
                op.sender,
                op.nonce,
                op.initCode,
                op.callData,
                op.callGasLimit,
                op.verificationGasLimit,
                op.preVerificationGas,
                op.maxFeePerGas,
                op.maxPriorityFeePerGas,
                op.paymasterAndData,
                block.chainid
            )
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(hash);
        address recovered = ECDSA.recover(digest, op.signature);
        if (recovered != op.sender) revert InvalidSignature();

        nonces[op.sender] += 1;
        emit UserOpHandled(op.sender, op.nonce, targetChains);
    }

    function handleAggregatedOp(UserOperation calldata op, bytes calldata aggregatedSignature) external onlyRole(ENTRYPOINT_ROLE) {
        if (op.nonce != aggregatedNonces[op.sender]) revert InvalidNonce();
        bytes32 hash = keccak256(
            abi.encode(
                op.sender,
                op.nonce,
                op.callData,
                op.callGasLimit,
                op.maxFeePerGas,
                op.maxPriorityFeePerGas,
                block.chainid
            )
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(hash);
        address recovered = ECDSA.recover(digest, aggregatedSignature);
        if (recovered != op.sender) revert InvalidSignature();
        aggregatedNonces[op.sender] += 1;
        emit AggregatedOpHandled(op.sender, op.nonce);
    }
}
