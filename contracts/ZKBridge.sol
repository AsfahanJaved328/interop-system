// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IZKVerifier} from "./interfaces/IZKVerifier.sol";

/// @title ZK Bridge (MVP)
contract ZKBridge is AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    struct TokenBridge {
        address token;
        uint256 locked;
        uint256 minted;
        mapping(uint256 => bool) chainSupported;
    }

    mapping(address => TokenBridge) public bridges;
    mapping(uint256 => address) public verifiers;
    mapping(bytes32 => bool) public proofSubmissions;
    mapping(uint256 => bytes32) public finalizedRoots;
    mapping(uint256 => uint256) public finalityDelay;
    mapping(bytes32 => uint256) public rootSubmittedAt;

    event Deposit(address indexed user, address indexed token, uint256 amount, bytes32 root);
    event ProofSubmitted(uint256 indexed chainId, bytes32 indexed root);
    event Withdraw(address indexed user, address indexed token, uint256 amount);

    error InvalidProof();
    error AlreadySubmitted();
    error RootNotFinalized();
    error FinalityNotReached();
    error FraudDetected();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RELAYER_ROLE, admin);
    }

    function setVerifier(uint256 chainId, address verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifiers[chainId] = verifier;
    }

    function finalizeRoot(uint256 chainId, bytes32 root) external onlyRole(RELAYER_ROLE) {
        finalizedRoots[chainId] = root;
        emit ProofSubmitted(chainId, root);
    }

    function deposit(address token, uint256 amount, bytes32 root) external nonReentrant {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        bridges[token].locked += amount;
        emit Deposit(msg.sender, token, amount, root);
    }

    function submitProof(
        uint256 chainId,
        bytes32 root,
        bytes calldata proof,
        bytes calldata publicInputs
    ) external onlyRole(RELAYER_ROLE) {
        bytes32 proofHash = keccak256(abi.encode(chainId, root, proof));
        if (proofSubmissions[proofHash]) revert AlreadySubmitted();
        address verifier = verifiers[chainId];
        if (verifier == address(0)) revert InvalidProof();
        bool ok = IZKVerifier(verifier).verifyProof(proof, publicInputs);
        if (!ok) revert InvalidProof();
        proofSubmissions[proofHash] = true;
        rootSubmittedAt[root] = block.timestamp;
        finalizedRoots[chainId] = root;
        emit ProofSubmitted(chainId, root);
    }

    function setFinalityDelay(uint256 chainId, uint256 delay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        finalityDelay[chainId] = delay;
    }

    function reportFraud(bytes32 root) external onlyRole(RELAYER_ROLE) {
        finalizedRoots[0] = bytes32(0);
        rootSubmittedAt[root] = 0;
        revert FraudDetected();
    }

    function withdraw(
        address token,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 root
    ) external nonReentrant {
        if (finalizedRoots[sourceChainId] != root) revert RootNotFinalized();
        if (finalityDelay[sourceChainId] > 0 && block.timestamp < rootSubmittedAt[root] + finalityDelay[sourceChainId]) {
            revert FinalityNotReached();
        }
        if (bridges[token].locked < amount) revert InvalidProof();
        bridges[token].locked -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdraw(msg.sender, token, amount);
    }
}
