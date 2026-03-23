// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";

contract MockAdapter is IProtocolAdapter {
    event MockSent(bytes32 indexed messageId);

    function sendMessage(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        uint256 gasLimit
    ) external payable returns (bytes32) {
        bytes32 messageId = keccak256(abi.encode(destinationChainId, receiver, payload, gasLimit, msg.sender));
        emit MockSent(messageId);
        return messageId;
    }

    function deliverToRouter(address router, bytes32 messageId, uint8 protocol, bool success) external {
        (bool ok, ) = router.call(abi.encodeWithSignature("deliverMessage(bytes32,uint8,bool)", messageId, protocol, success));
        require(ok, "deliver failed");
    }

    function deliverToRouterWithProof(
        address router,
        uint256 destinationChainId,
        bytes32 messageId,
        uint8 protocol
    ) external {
        (bool ok, ) = router.call(
            abi.encodeWithSignature(
                "deliverMessageWithProof(uint256,bytes32,uint8,bytes32,bytes32,bytes,bytes,bytes32)",
                destinationChainId,
                messageId,
                protocol,
                bytes32(0),
                bytes32(0),
                bytes(""),
                bytes(""),
                bytes32(0)
            )
        );
        require(ok, "deliver proof failed");
    }
}
