// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {CrossChainTypes} from "./CrossChainTypes.sol";
import {EventsRegistry} from "./EventsRegistry.sol";
import {ILightClient} from "./interfaces/ILightClient.sol";
import {IDisputeResolver} from "./interfaces/IDisputeResolver.sol";
import {Treasury} from "./Treasury.sol";

/// @title Intent-based solver network (Phase 1 backend core)
contract IntentContract is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    enum IntentType {
        SWAP,
        YIELD,
        BRIDGE,
        COMPOSITE,
        CUSTOM
    }

    enum IntentStatus {
        PENDING,
        ACCEPTED,
        EXECUTING,
        COMPLETED,
        EXPIRED,
        DISPUTED
    }

    struct Intent {
        bytes32 intentId;
        address user;
        IntentType intentType;
        uint256 sourceChain;
        uint256[] targetChains;
        CrossChainTypes.TokenAmount[] provided;
        CrossChainTypes.TokenAmount[] expected;
        ExecutionConstraints constraints;
        FeePayment feePayment;
        uint256 deadline;
        uint256 nonce;
        IntentStatus status;
        address solver;
        uint256 createdAt;
        uint256 acceptedAt;
    }

    struct ExecutionConstraints {
        uint256 deadline;
        uint256 maxSlippageBps;
        uint256[] minimumOutputs;
        address[] allowedExecutors;
    }

    struct FeePayment {
        address token;
        uint256 paymentChain;
        uint256 amount;
        address sponsor;
        bool usePaymaster;
    }
    struct SolverInfo {
        uint256 collateral;
        uint256 totalExecuted;
        uint256 successfulExecutions;
        uint256 failedExecutions;
        uint256 reputation;
        bool active;
        uint256[] supportedChains;
        IntentType[] supportedTypes;
    }

    error InvalidDeadline();
    error IntentNotFound();
    error IntentNotPending();
    error IntentNotAccepted();
    error SolverNotActive();
    error SolverInsufficientCollateral();
    error UnsupportedIntent();
    error LightClientMissing();
    error InvalidProof();
    error DisputeResolverMissing();
    error InvalidSignature();
    error InvalidNonce();

    uint256 public constant SOLVER_COLLATERAL = 10 ether;
    uint256 public constant SOLVER_SLASH_AMOUNT = 1 ether;

    mapping(bytes32 => Intent) public intents;
    mapping(address => SolverInfo) public solvers;
    mapping(address => uint256) public nonces;
    EventsRegistry public eventsRegistry;
    mapping(uint256 => address) public lightClients;
    IDisputeResolver public disputeResolver;
    Treasury public treasury;

    event IntentCreated(bytes32 indexed intentId, address indexed user, IntentType intentType);
    event IntentAccepted(bytes32 indexed intentId, address indexed solver);
    event IntentExecuted(bytes32 indexed intentId, address indexed solver);
    event IntentDisputed(bytes32 indexed intentId, address indexed challenger);
    event IntentExpired(bytes32 indexed intentId);
    event SolverRegistered(address indexed solver);
    event EventsRegistryUpdated(address indexed registry);
    event LightClientUpdated(uint256 indexed chainId, address lightClient);
    event DisputeResolverUpdated(address indexed resolver);
    event TreasuryUpdated(address indexed treasury);
    event SolverSlashed(address indexed solver, uint256 amount);

    bytes32 private constant TOKEN_AMOUNT_TYPEHASH =
        keccak256("TokenAmount(address token,uint256 chainId,uint256 amount)");
    bytes32 private constant EXECUTION_CONSTRAINTS_TYPEHASH =
        keccak256("ExecutionConstraints(uint256 deadline,uint256 maxSlippageBps,bytes32 minimumOutputsHash,bytes32 allowedExecutorsHash)");
    bytes32 private constant FEE_PAYMENT_TYPEHASH =
        keccak256("FeePayment(address token,uint256 paymentChain,uint256 amount,address sponsor,bool usePaymaster)");
    bytes32 private constant INTENT_SIG_TYPEHASH =
        keccak256("IntentSig(address user,uint8 intentType,uint256 sourceChain,bytes32 targetChainsHash,bytes32 providedHash,bytes32 expectedHash,bytes32 constraintsHash,bytes32 feePaymentHash,uint256 nonce,bytes32 memoHash)");

    constructor() Ownable(msg.sender) EIP712("InteropIntent", "1") {}

    function setEventsRegistry(address registry) external onlyOwner {
        eventsRegistry = EventsRegistry(registry);
        emit EventsRegistryUpdated(registry);
    }

    function setLightClient(uint256 chainId, address client) external onlyOwner {
        lightClients[chainId] = client;
        emit LightClientUpdated(chainId, client);
    }

    function setDisputeResolver(address resolver) external onlyOwner {
        disputeResolver = IDisputeResolver(resolver);
        emit DisputeResolverUpdated(resolver);
    }

    function setTreasury(address payable treasury_) external onlyOwner {
        treasury = Treasury(treasury_);
        emit TreasuryUpdated(treasury_);
    }

    function createIntent(
        IntentType intentType,
        uint256 sourceChain,
        uint256[] calldata targetChains,
        CrossChainTypes.TokenAmount[] calldata provided,
        CrossChainTypes.TokenAmount[] calldata expected,
        ExecutionConstraints calldata constraints,
        FeePayment calldata feePayment,
        uint256 nonce,
        bytes calldata memo
    ) external nonReentrant returns (bytes32) {
        if (constraints.deadline <= block.timestamp) revert InvalidDeadline();
        return _createIntent(
            msg.sender,
            intentType,
            sourceChain,
            targetChains,
            provided,
            expected,
            constraints,
            feePayment,
            nonce,
            memo
        );
    }

    function createIntentWithSig(
        address user,
        IntentType intentType,
        uint256 sourceChain,
        uint256[] calldata targetChains,
        CrossChainTypes.TokenAmount[] calldata provided,
        CrossChainTypes.TokenAmount[] calldata expected,
        ExecutionConstraints calldata constraints,
        FeePayment calldata feePayment,
        uint256 nonce,
        bytes calldata memo,
        bytes calldata signature
    ) external nonReentrant returns (bytes32) {
        if (constraints.deadline <= block.timestamp) revert InvalidDeadline();
        if (nonce != nonces[user]) revert InvalidNonce();
        bytes32 digest = _hashIntentSig(
            user,
            intentType,
            sourceChain,
            targetChains,
            provided,
            expected,
            constraints,
            feePayment,
            nonce,
            memo
        );
        if (digest.recover(signature) != user) revert InvalidSignature();
        nonces[user] += 1;
        return _createIntent(
            user,
            intentType,
            sourceChain,
            targetChains,
            provided,
            expected,
            constraints,
            feePayment,
            nonce,
            memo
        );
    }

    function _createIntent(
        address user,
        IntentType intentType,
        uint256 sourceChain,
        uint256[] calldata targetChains,
        CrossChainTypes.TokenAmount[] calldata provided,
        CrossChainTypes.TokenAmount[] calldata expected,
        ExecutionConstraints calldata constraints,
        FeePayment calldata feePayment,
        uint256 nonce,
        bytes calldata memo
    ) internal returns (bytes32) {
        bytes32 intentId = keccak256(
            abi.encode(user, sourceChain, block.timestamp, nonce, intentType, targetChains, memo)
        );

        Intent storage intent = intents[intentId];
        intent.intentId = intentId;
        intent.user = user;
        intent.intentType = intentType;
        intent.sourceChain = sourceChain;
        intent.deadline = constraints.deadline;
        intent.nonce = nonce;
        intent.status = IntentStatus.PENDING;
        intent.createdAt = block.timestamp;
        intent.constraints.deadline = constraints.deadline;
        intent.constraints.maxSlippageBps = constraints.maxSlippageBps;
        delete intent.constraints.minimumOutputs;
        delete intent.constraints.allowedExecutors;
        for (uint256 m = 0; m < constraints.minimumOutputs.length; m++) {
            intent.constraints.minimumOutputs.push(constraints.minimumOutputs[m]);
        }
        for (uint256 n = 0; n < constraints.allowedExecutors.length; n++) {
            intent.constraints.allowedExecutors.push(constraints.allowedExecutors[n]);
        }
        intent.feePayment = feePayment;

        for (uint256 i = 0; i < targetChains.length; i++) {
            intent.targetChains.push(targetChains[i]);
        }
        for (uint256 j = 0; j < provided.length; j++) {
            intent.provided.push(provided[j]);
            if (provided[j].token != address(0) && provided[j].amount > 0) {
                IERC20(provided[j].token).safeTransferFrom(user, address(this), provided[j].amount);
            }
        }
        for (uint256 k = 0; k < expected.length; k++) {
            intent.expected.push(expected[k]);
        }

        emit IntentCreated(intentId, user, intentType);
        if (address(eventsRegistry) != address(0)) {
            eventsRegistry.indexIntent(intentId, uint256(IntentStatus.PENDING));
        }
        if (feePayment.amount > 0 && feePayment.token != address(0) && address(treasury) != address(0)) {
            IERC20(feePayment.token).transferFrom(user, address(treasury), feePayment.amount);
        }
        return intentId;
    }

    function _hashIntentSig(
        address user,
        IntentType intentType,
        uint256 sourceChain,
        uint256[] calldata targetChains,
        CrossChainTypes.TokenAmount[] calldata provided,
        CrossChainTypes.TokenAmount[] calldata expected,
        ExecutionConstraints calldata constraints,
        FeePayment calldata feePayment,
        uint256 nonce,
        bytes calldata memo
    ) internal view returns (bytes32) {
        bytes32 targetChainsHash = keccak256(abi.encodePacked(targetChains));
        bytes32 providedHash = _hashTokenAmounts(provided);
        bytes32 expectedHash = _hashTokenAmounts(expected);
        bytes32 constraintsHash = keccak256(
            abi.encode(
                EXECUTION_CONSTRAINTS_TYPEHASH,
                constraints.deadline,
                constraints.maxSlippageBps,
                keccak256(abi.encodePacked(constraints.minimumOutputs)),
                keccak256(abi.encodePacked(constraints.allowedExecutors))
            )
        );
        bytes32 feePaymentHash = keccak256(
            abi.encode(
                FEE_PAYMENT_TYPEHASH,
                feePayment.token,
                feePayment.paymentChain,
                feePayment.amount,
                feePayment.sponsor,
                feePayment.usePaymaster
            )
        );
        bytes32 memoHash = keccak256(memo);

        bytes32 structHash = keccak256(
            abi.encode(
                INTENT_SIG_TYPEHASH,
                user,
                intentType,
                sourceChain,
                targetChainsHash,
                providedHash,
                expectedHash,
                constraintsHash,
                feePaymentHash,
                nonce,
                memoHash
            )
        );
        return _hashTypedDataV4(structHash);
    }

    function _hashTokenAmounts(
        CrossChainTypes.TokenAmount[] calldata amounts
    ) internal pure returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](amounts.length);
        for (uint256 i = 0; i < amounts.length; i++) {
            hashes[i] = keccak256(
                abi.encode(TOKEN_AMOUNT_TYPEHASH, amounts[i].token, amounts[i].chainId, amounts[i].amount)
            );
        }
        return keccak256(abi.encodePacked(hashes));
    }

    function acceptIntent(bytes32 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        if (intent.intentId == bytes32(0)) revert IntentNotFound();
        if (intent.status != IntentStatus.PENDING) revert IntentNotPending();

        SolverInfo storage solver = solvers[msg.sender];
        if (!solver.active) revert SolverNotActive();
        if (solver.collateral < SOLVER_COLLATERAL) revert SolverInsufficientCollateral();

        intent.status = IntentStatus.ACCEPTED;
        intent.solver = msg.sender;
        intent.acceptedAt = block.timestamp;

        emit IntentAccepted(intentId, msg.sender);
        if (address(eventsRegistry) != address(0)) {
            eventsRegistry.indexIntent(intentId, uint256(IntentStatus.ACCEPTED));
        }
    }

    function executeIntent(bytes32 intentId, bytes calldata /*executionProof*/) external nonReentrant {
        _executeIntent(intentId);
    }

    function _executeIntent(bytes32 intentId) internal {
        Intent storage intent = intents[intentId];
        if (intent.intentId == bytes32(0)) revert IntentNotFound();
        if (intent.status != IntentStatus.ACCEPTED) revert IntentNotAccepted();
        if (intent.solver != msg.sender) revert SolverNotActive();
        if (intent.constraints.deadline < block.timestamp) revert InvalidDeadline();
        if (intent.constraints.allowedExecutors.length > 0) {
            bool allowed = false;
            for (uint256 i = 0; i < intent.constraints.allowedExecutors.length; i++) {
                if (intent.constraints.allowedExecutors[i] == msg.sender) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed) revert SolverNotActive();
        }

        intent.status = IntentStatus.COMPLETED;

        for (uint256 i = 0; i < intent.provided.length; i++) {
            if (intent.provided[i].token != address(0) && intent.provided[i].amount > 0) {
                IERC20(intent.provided[i].token).safeTransfer(msg.sender, intent.provided[i].amount);
            }
        }

        SolverInfo storage solver = solvers[msg.sender];
        solver.totalExecuted += 1;
        solver.successfulExecutions += 1;
        solver.reputation += 1;

        emit IntentExecuted(intentId, msg.sender);
        if (address(eventsRegistry) != address(0)) {
            eventsRegistry.indexIntent(intentId, uint256(IntentStatus.COMPLETED));
            eventsRegistry.updateSolver(msg.sender, true);
        }
    }

    function executeIntentWithProof(
        bytes32 intentId,
        uint256 destinationChainId,
        bytes32 txHash,
        bytes32 txRoot,
        bytes calldata txProof,
        bytes calldata stateProof,
        bytes32 stateRoot
    ) external nonReentrant {
        address client = lightClients[destinationChainId];
        if (client == address(0)) revert LightClientMissing();
        bool txOk = ILightClient(client).verifyTransactionInclusion(txHash, txRoot, txProof);
        bool stateOk = ILightClient(client).verifyStateProof(stateProof, stateRoot);
        if (!txOk || !stateOk) revert InvalidProof();
        _executeIntent(intentId);
    }

    function getSolverScore(address solverAddress) external view returns (uint256) {
        SolverInfo storage solver = solvers[solverAddress];
        if (solver.totalExecuted == 0) return solver.reputation;
        uint256 successRate = (solver.successfulExecutions * 10_000) / solver.totalExecuted;
        return solver.reputation + successRate;
    }

    function disputeIntent(bytes32 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        if (intent.intentId == bytes32(0)) revert IntentNotFound();
        intent.status = IntentStatus.DISPUTED;

        if (intent.solver != address(0)) {
            SolverInfo storage solver = solvers[intent.solver];
            if (solver.collateral >= SOLVER_SLASH_AMOUNT) {
                solver.collateral -= SOLVER_SLASH_AMOUNT;
                if (address(treasury) != address(0)) {
                    (bool ok, ) = payable(address(treasury)).call{value: SOLVER_SLASH_AMOUNT}("");
                    require(ok, "treasury transfer failed");
                } else {
                    payable(intent.user).transfer(SOLVER_SLASH_AMOUNT);
                }
                emit SolverSlashed(intent.solver, SOLVER_SLASH_AMOUNT);
            }
            solver.failedExecutions += 1;
            if (solver.reputation > 0) {
                solver.reputation -= 1;
            }
        }

        emit IntentDisputed(intentId, msg.sender);
        if (address(eventsRegistry) != address(0)) {
            eventsRegistry.indexIntent(intentId, uint256(IntentStatus.DISPUTED));
            if (intent.solver != address(0)) {
                eventsRegistry.updateSolver(intent.solver, false);
            }
        }
    }

    function raiseDispute(
        bytes32 intentId,
        uint8 reason,
        bytes32 evidenceHash
    ) external payable nonReentrant returns (bytes32) {
        if (address(disputeResolver) == address(0)) revert DisputeResolverMissing();
        Intent storage intent = intents[intentId];
        if (intent.intentId == bytes32(0)) revert IntentNotFound();
        return disputeResolver.createDispute{value: msg.value}(intentId, intent.solver, reason, evidenceHash);
    }

    function expireIntent(bytes32 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        if (intent.intentId == bytes32(0)) revert IntentNotFound();
        if (block.timestamp <= intent.deadline) revert InvalidDeadline();
        intent.status = IntentStatus.EXPIRED;

        for (uint256 i = 0; i < intent.provided.length; i++) {
            if (intent.provided[i].token != address(0) && intent.provided[i].amount > 0) {
                IERC20(intent.provided[i].token).safeTransfer(intent.user, intent.provided[i].amount);
            }
        }

        emit IntentExpired(intentId);
        if (address(eventsRegistry) != address(0)) {
            eventsRegistry.indexIntent(intentId, uint256(IntentStatus.EXPIRED));
        }
    }

    function registerSolver(
        uint256[] calldata supportedChains,
        IntentType[] calldata supportedTypes
    ) external payable nonReentrant {
        SolverInfo storage solver = solvers[msg.sender];
        solver.collateral += msg.value;
        solver.active = true;
        if (solver.reputation == 0) {
            solver.reputation = 1;
        }

        delete solver.supportedChains;
        delete solver.supportedTypes;
        for (uint256 i = 0; i < supportedChains.length; i++) {
            solver.supportedChains.push(supportedChains[i]);
        }
        for (uint256 j = 0; j < supportedTypes.length; j++) {
            solver.supportedTypes.push(supportedTypes[j]);
        }

        emit SolverRegistered(msg.sender);
    }

    receive() external payable {}
}
