// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IZKVerifier {
    function verifyProof(bytes calldata proof, bytes calldata publicInputs) external view returns (bool);
}
