// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cross-chain core data structures
/// @notice Shared structs/enums used across protocol contracts
library CrossChainTypes {
    enum MessageType {
        TOKEN_TRANSFER,
        CONTRACT_CALL,
        STATE_SYNC,
        GOVERNANCE,
        INTENT,
        BATCH_OPERATION
    }

    enum OperationStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        EXPIRED,
        DISPUTED
    }

    struct CrossChainMessage {
        bytes32 messageId;
        uint256 sourceChainId;
        uint256 destinationChainId;
        bytes sourceAddress;
        bytes destinationAddress;
        bytes payload;
        MessageType messageType;
        uint256 gasLimit;
        uint256 value;
        uint256 nonce;
        uint256 timestamp;
        uint256 fee;
        bytes32 metadata;
    }

    struct BridgeOperation {
        bytes32 operationId;
        OperationStatus status;
        uint256 sourceChainId;
        uint256 destinationChainId;
        bytes32 sourceTxHash;
        bytes32 destinationTxHash;
        uint256 sourceTimestamp;
        uint256 destinationTimestamp;
        address initiator;
        bytes operationData;
    }

    struct TokenAmount {
        address token;
        uint256 chainId;
        uint256 amount;
    }
}
