// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IZKVerifier} from "../interfaces/IZKVerifier.sol";

contract MockVerifier is IZKVerifier {
    function verifyProof(bytes calldata, bytes calldata) external pure returns (bool) {
        return true;
    }
}
