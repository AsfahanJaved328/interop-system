// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ILightClient} from "../interfaces/ILightClient.sol";

contract MockLightClient is ILightClient {
    function verifyHeader(bytes calldata, bytes calldata) external pure returns (bool) {
        return true;
    }

    function verifyTransactionInclusion(bytes32, bytes32, bytes calldata) external pure returns (bool) {
        return true;
    }

    function verifyStateProof(bytes calldata, bytes32) external pure returns (bool) {
        return true;
    }

    function getLatestVerifiedBlock() external pure returns (uint256) {
        return 0;
    }

    function getBlockHash(uint256) external pure returns (bytes32) {
        return bytes32(0);
    }

    function isFrozen() external pure returns (bool) {
        return false;
    }
}
