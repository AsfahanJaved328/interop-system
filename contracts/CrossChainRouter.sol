// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CrossChainTypes} from "./CrossChainTypes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "./interfaces/IProtocolAdapter.sol";
import {ILightClient} from "./interfaces/ILightClient.sol";
import {FeeOracle} from "./FeeOracle.sol";
import {EventsRegistry} from "./EventsRegistry.sol";
import {AllowList} from "./security/AllowList.sol";
import {RateLimiter} from "./security/RateLimiter.sol";
import {CircuitBreaker} from "./security/CircuitBreaker.sol";
import {PauseGuardian} from "./security/PauseGuardian.sol";

/// @title Cross-chain Router (Phase 1 core)
contract CrossChainRouter is Ownable {
    using CrossChainTypes for CrossChainTypes.CrossChainMessage;

    enum Protocol {
        CHAINLINK_CCIP,
        AXELAR_GMP,
        LAYERZERO,
        WORMHOLE,
        HYPERLANE,
        CUSTOM
    }

    struct ProtocolAdapter {
        Protocol protocol;
        address adapterAddress;
        bool active;
        uint256 reliabilityScore;
        uint256 avgLatency;
        uint256 totalMessages;
        uint256 successfulMessages;
    }

    struct RoutingPath {
        bytes32 messageId;
        uint256 sourceChain;
        uint256 destinationChain;
        address sender;
        address receiver;
        bytes payload;
        Protocol[] selectedProtocols;
        uint256 createdAt;
        uint256 deadline;
        bool executed;
        bool failed;
    }

    event MessageRouted(bytes32 indexed messageId, uint256 indexed destinationChain, address indexed receiver);
    event MessageDelivered(bytes32 indexed messageId, Protocol protocol, bool success);
    event ProtocolAdapterUpdated(uint256 indexed chainId, Protocol protocol, address adapter, bool active);
    event LightClientUpdated(uint256 indexed chainId, address lightClient);
    event FeeOracleUpdated(address indexed feeOracle);
    event EventsRegistryUpdated(address indexed registry);
    event ProtocolMetricsUpdated(Protocol protocol, uint256 reliabilityScore);

    mapping(uint256 => mapping(Protocol => ProtocolAdapter)) public adapters;
    mapping(bytes32 => RoutingPath) public messageRoutes;
    mapping(uint256 => address) public lightClients;
    mapping(Protocol => uint256) public protocolTotalMessages;
    mapping(Protocol => uint256) public protocolSuccessfulMessages;
    mapping(Protocol => uint256) public lastMetricsUpdate;

    FeeOracle public feeOracle;
    EventsRegistry public eventsRegistry;
    AllowList public allowList;
    RateLimiter public rateLimiter;
    CircuitBreaker public circuitBreaker;
    PauseGuardian public pauseGuardian;

    error NoActiveProtocols();
    error DeadlineExpired();
    error UnauthorizedAdapter();
    error AlreadyExecuted();
    error LightClientMissing();
    error InsufficientFee();
    error FeeTransferFailed();
    error ReceiverNotAllowed();
    error RouterPaused();
    error CircuitTripped();

    constructor() Ownable(msg.sender) {}

    function setProtocolAdapter(
        uint256 chainId,
        Protocol protocol,
        address adapter,
        bool active,
        uint256 reliabilityScore,
        uint256 avgLatency
    ) external onlyOwner {
        adapters[chainId][protocol] = ProtocolAdapter({
            protocol: protocol,
            adapterAddress: adapter,
            active: active,
            reliabilityScore: reliabilityScore,
            avgLatency: avgLatency,
            totalMessages: 0,
            successfulMessages: 0
        });
        emit ProtocolAdapterUpdated(chainId, protocol, adapter, active);
    }

    function setLightClient(uint256 chainId, address client) external onlyOwner {
        lightClients[chainId] = client;
        emit LightClientUpdated(chainId, client);
    }

    function setFeeOracle(address oracle) external onlyOwner {
        feeOracle = FeeOracle(oracle);
        emit FeeOracleUpdated(oracle);
    }

    function setEventsRegistry(address registry) external onlyOwner {
        eventsRegistry = EventsRegistry(registry);
        emit EventsRegistryUpdated(registry);
    }

    function setAllowList(address list) external onlyOwner {
        allowList = AllowList(list);
    }

    function setRateLimiter(address limiter) external onlyOwner {
        rateLimiter = RateLimiter(limiter);
    }

    function setCircuitBreaker(address breaker) external onlyOwner {
        circuitBreaker = CircuitBreaker(breaker);
    }

    function setPauseGuardian(address guardian) external onlyOwner {
        pauseGuardian = PauseGuardian(guardian);
    }

    function routeMessage(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        Protocol[] calldata preferredProtocols,
        uint256 deadline
    ) external payable returns (bytes32) {
        if (address(pauseGuardian) != address(0) && pauseGuardian.paused()) revert RouterPaused();
        if (address(circuitBreaker) != address(0) && circuitBreaker.tripped()) revert CircuitTripped();
        if (address(allowList) != address(0) && !allowList.isAllowed(receiver)) revert ReceiverNotAllowed();
        if (address(rateLimiter) != address(0)) {
            rateLimiter.consume(msg.value);
        }
        if (deadline < block.timestamp) revert DeadlineExpired();

        if (address(feeOracle) != address(0)) {
            uint256 requiredFee = feeOracle.estimateFee(
                destinationChainId,
                CrossChainTypes.MessageType.CONTRACT_CALL,
                0
            );
            if (requiredFee > 0 && msg.value < requiredFee) revert InsufficientFee();
            if (requiredFee > 0 && feeOracle.treasury() != address(0)) {
                (uint256 treasuryAmount, uint256 burnAmount) = feeOracle.splitFee(requiredFee);
                (bool ok, ) = payable(feeOracle.treasury()).call{value: treasuryAmount}("");
                if (!ok) revert FeeTransferFailed();
                if (burnAmount > 0 && feeOracle.burnAddress() != address(0)) {
                    (bool burnOk, ) = payable(feeOracle.burnAddress()).call{value: burnAmount}("");
                    if (!burnOk) revert FeeTransferFailed();
                }
                if (msg.value > requiredFee) {
                    (bool refundOk, ) = payable(msg.sender).call{value: msg.value - requiredFee}("");
                    if (!refundOk) revert FeeTransferFailed();
                }
            }
        }

        Protocol[] memory selected = preferredProtocols.length == 0
            ? selectOptimalProtocols(destinationChainId)
            : preferredProtocols;

        if (selected.length == 0) revert NoActiveProtocols();

        bytes32 messageId = keccak256(
            abi.encode(block.chainid, destinationChainId, msg.sender, receiver, payload, block.timestamp)
        );

        messageRoutes[messageId] = RoutingPath({
            messageId: messageId,
            sourceChain: block.chainid,
            destinationChain: destinationChainId,
            sender: msg.sender,
            receiver: receiver,
            payload: payload,
            selectedProtocols: selected,
            createdAt: block.timestamp,
            deadline: deadline,
            executed: false,
            failed: false
        });

        for (uint256 i = 0; i < selected.length; i++) {
            ProtocolAdapter memory adapter = adapters[destinationChainId][selected[i]];
            if (adapter.active && adapter.adapterAddress != address(0)) {
                IProtocolAdapter(adapter.adapterAddress).sendMessage(
                    destinationChainId,
                    receiver,
                    payload,
                    0
                );
            }
        }

        emit MessageRouted(messageId, destinationChainId, receiver);

        if (address(eventsRegistry) != address(0)) {
            eventsRegistry.indexMessage(messageId, msg.sender, receiver, destinationChainId);
        }

        return messageId;
    }

    function routeMessageWithLightClient(
        uint256 destinationChainId,
        address receiver,
        bytes calldata payload,
        Protocol[] calldata preferredProtocols,
        uint256 deadline,
        bytes calldata lightClientProof
    ) external payable returns (bytes32) {
        if (address(pauseGuardian) != address(0) && pauseGuardian.paused()) revert RouterPaused();
        if (address(circuitBreaker) != address(0) && circuitBreaker.tripped()) revert CircuitTripped();
        if (address(allowList) != address(0) && !allowList.isAllowed(receiver)) revert ReceiverNotAllowed();
        if (address(rateLimiter) != address(0)) {
            rateLimiter.consume(msg.value);
        }
        address client = lightClients[destinationChainId];
        if (client == address(0)) revert LightClientMissing();
        ILightClient(client).verifyHeader(payload, lightClientProof);
        if (address(feeOracle) != address(0)) {
            uint256 requiredFee = feeOracle.estimateFee(
                destinationChainId,
                CrossChainTypes.MessageType.STATE_SYNC,
                0
            );
            if (requiredFee > 0 && msg.value < requiredFee) revert InsufficientFee();
            if (requiredFee > 0 && feeOracle.treasury() != address(0)) {
                (uint256 treasuryAmount, uint256 burnAmount) = feeOracle.splitFee(requiredFee);
                (bool ok, ) = payable(feeOracle.treasury()).call{value: treasuryAmount}("");
                if (!ok) revert FeeTransferFailed();
                if (burnAmount > 0 && feeOracle.burnAddress() != address(0)) {
                    (bool burnOk, ) = payable(feeOracle.burnAddress()).call{value: burnAmount}("");
                    if (!burnOk) revert FeeTransferFailed();
                }
                if (msg.value > requiredFee) {
                    (bool refundOk, ) = payable(msg.sender).call{value: msg.value - requiredFee}("");
                    if (!refundOk) revert FeeTransferFailed();
                }
            }
        }
        Protocol[] memory selected = preferredProtocols.length == 0
            ? selectOptimalProtocols(destinationChainId)
            : preferredProtocols;

        if (selected.length == 0) revert NoActiveProtocols();

        bytes32 messageId = keccak256(
            abi.encode(block.chainid, destinationChainId, msg.sender, receiver, payload, block.timestamp)
        );

        messageRoutes[messageId] = RoutingPath({
            messageId: messageId,
            sourceChain: block.chainid,
            destinationChain: destinationChainId,
            sender: msg.sender,
            receiver: receiver,
            payload: payload,
            selectedProtocols: selected,
            createdAt: block.timestamp,
            deadline: deadline,
            executed: false,
            failed: false
        });

        for (uint256 i = 0; i < selected.length; i++) {
            ProtocolAdapter memory adapter = adapters[destinationChainId][selected[i]];
            if (adapter.active && adapter.adapterAddress != address(0)) {
                IProtocolAdapter(adapter.adapterAddress).sendMessage(
                    destinationChainId,
                    receiver,
                    payload,
                    0
                );
            }
        }

        emit MessageRouted(messageId, destinationChainId, receiver);

        if (address(eventsRegistry) != address(0)) {
            eventsRegistry.indexMessage(messageId, msg.sender, receiver, destinationChainId);
        }

        return messageId;
    }

    function deliverMessage(bytes32 messageId, Protocol protocol, bool success) external {
        RoutingPath storage path = messageRoutes[messageId];
        if (path.executed) revert AlreadyExecuted();

        ProtocolAdapter storage adapter = adapters[path.destinationChain][protocol];
        if (adapter.adapterAddress != msg.sender) revert UnauthorizedAdapter();

        adapter.totalMessages += 1;
        protocolTotalMessages[protocol] += 1;
        if (success) {
            adapter.successfulMessages += 1;
            protocolSuccessfulMessages[protocol] += 1;
            path.executed = true;
        }
        if (adapter.totalMessages > 0) {
            adapter.reliabilityScore = (adapter.successfulMessages * 10_000) / adapter.totalMessages;
        }
        lastMetricsUpdate[protocol] = block.timestamp;
        emit ProtocolMetricsUpdated(protocol, adapter.reliabilityScore);

        emit MessageDelivered(messageId, protocol, success);
    }

    function deliverMessageWithProof(
        uint256 destinationChainId,
        bytes32 messageId,
        Protocol protocol,
        bytes32 txHash,
        bytes32 txRoot,
        bytes calldata txProof,
        bytes calldata stateProof,
        bytes32 stateRoot
    ) external {
        address client = lightClients[destinationChainId];
        if (client == address(0)) revert LightClientMissing();
        bool txOk = ILightClient(client).verifyTransactionInclusion(txHash, txRoot, txProof);
        bool stateOk = ILightClient(client).verifyStateProof(stateProof, stateRoot);
        RoutingPath storage path = messageRoutes[messageId];
        if (path.executed) revert AlreadyExecuted();

        ProtocolAdapter storage adapter = adapters[path.destinationChain][protocol];
        if (adapter.adapterAddress != msg.sender) revert UnauthorizedAdapter();

        adapter.totalMessages += 1;
        protocolTotalMessages[protocol] += 1;
        if (txOk && stateOk) {
            adapter.successfulMessages += 1;
            protocolSuccessfulMessages[protocol] += 1;
            path.executed = true;
        }
        if (adapter.totalMessages > 0) {
            adapter.reliabilityScore = (adapter.successfulMessages * 10_000) / adapter.totalMessages;
        }
        lastMetricsUpdate[protocol] = block.timestamp;
        emit ProtocolMetricsUpdated(protocol, adapter.reliabilityScore);

        emit MessageDelivered(messageId, protocol, txOk && stateOk);
    }

    function verifyDeliveryWithLightClient(
        uint256 destinationChainId,
        bytes32 txHash,
        bytes32 txRoot,
        bytes calldata proof
    ) external view returns (bool) {
        address client = lightClients[destinationChainId];
        if (client == address(0)) revert LightClientMissing();
        return ILightClient(client).verifyTransactionInclusion(txHash, txRoot, proof);
    }

    function verifyStateWithLightClient(
        uint256 destinationChainId,
        bytes calldata accountProof,
        bytes32 stateRoot
    ) external view returns (bool) {
        address client = lightClients[destinationChainId];
        if (client == address(0)) revert LightClientMissing();
        return ILightClient(client).verifyStateProof(accountProof, stateRoot);
    }

    function selectOptimalProtocols(uint256 chainId) internal view returns (Protocol[] memory) {
        Protocol[] memory active = new Protocol[](6);
        uint256 count = 0;
        for (uint256 i = 0; i < 6; i++) {
            Protocol protocol = Protocol(i);
            if (adapters[chainId][protocol].active) {
                active[count] = protocol;
                count += 1;
            }
        }
        // Simple selection: prioritize reliability, then latency by doing a single pass swap
        for (uint256 x = 0; x + 1 < count; x++) {
            Protocol p1 = active[x];
            Protocol p2 = active[x + 1];
            ProtocolAdapter memory a1 = adapters[chainId][p1];
            ProtocolAdapter memory a2 = adapters[chainId][p2];
            if (a2.reliabilityScore > a1.reliabilityScore) {
                active[x] = p2;
                active[x + 1] = p1;
            } else if (a2.reliabilityScore == a1.reliabilityScore && a2.avgLatency < a1.avgLatency) {
                active[x] = p2;
                active[x + 1] = p1;
            }
        }

        Protocol[] memory trimmed = new Protocol[](count);
        for (uint256 j = 0; j < count; j++) {
            trimmed[j] = active[j];
        }
        return trimmed;
    }

    function getAdapterStats(uint256 chainId, Protocol protocol) external view returns (
        uint256 reliabilityScore,
        uint256 avgLatency,
        uint256 totalMessages,
        uint256 successfulMessages,
        bool active
    ) {
        ProtocolAdapter memory adapter = adapters[chainId][protocol];
        return (
            adapter.reliabilityScore,
            adapter.avgLatency,
            adapter.totalMessages,
            adapter.successfulMessages,
            adapter.active
        );
    }

    function getProtocolStats(Protocol protocol) external view returns (
        uint256 totalMessages,
        uint256 successfulMessages
    ) {
        return (protocolTotalMessages[protocol], protocolSuccessfulMessages[protocol]);
    }

    function getProtocolMetrics(Protocol protocol) external view returns (
        uint256 reliabilityScore,
        uint256 avgLatency,
        uint256 totalMessages,
        uint256 successfulMessages,
        uint256 lastUpdated
    ) {
        ProtocolAdapter memory adapter = adapters[block.chainid][protocol];
        return (
            adapter.reliabilityScore,
            adapter.avgLatency,
            adapter.totalMessages,
            adapter.successfulMessages,
            lastMetricsUpdate[protocol]
        );
    }

    function decayProtocolScore(Protocol protocol, uint256 bps) external onlyOwner {
        ProtocolAdapter storage adapter = adapters[block.chainid][protocol];
        if (adapter.reliabilityScore == 0) return;
        uint256 decay = (adapter.reliabilityScore * bps) / 10_000;
        adapter.reliabilityScore = adapter.reliabilityScore > decay ? adapter.reliabilityScore - decay : 0;
        lastMetricsUpdate[protocol] = block.timestamp;
        emit ProtocolMetricsUpdated(protocol, adapter.reliabilityScore);
    }
}
