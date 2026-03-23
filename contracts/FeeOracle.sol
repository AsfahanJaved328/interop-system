// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CrossChainTypes} from "./CrossChainTypes.sol";

/// @title Fee Oracle (Phase 1)
contract FeeOracle is Ownable {
    struct ChainFeeConfig {
        uint256 baseFee;
        uint256 gasPrice;
        uint256 congestionMultiplierBps;
        uint256 protocolPremiumBps;
        bool active;
        address feeToken;
    }

    event ChainConfigUpdated(uint256 indexed chainId, ChainFeeConfig config);
    event TreasuryUpdated(address indexed treasury);

    mapping(uint256 => ChainFeeConfig) public chainConfigs;
    address public treasury;
    uint256 public burnBps;
    address public burnAddress;

    constructor(address treasury_) Ownable(msg.sender) {
        treasury = treasury_;
        burnAddress = address(0x000000000000000000000000000000000000dEaD);
    }

    function setChainConfig(
        uint256 chainId,
        uint256 baseFee,
        uint256 gasPrice,
        uint256 congestionMultiplierBps,
        uint256 protocolPremiumBps,
        bool active,
        address feeToken
    ) external onlyOwner {
        chainConfigs[chainId] = ChainFeeConfig({
            baseFee: baseFee,
            gasPrice: gasPrice,
            congestionMultiplierBps: congestionMultiplierBps,
            protocolPremiumBps: protocolPremiumBps,
            active: active,
            feeToken: feeToken
        });
        emit ChainConfigUpdated(chainId, chainConfigs[chainId]);
    }

    function setTreasury(address treasury_) external onlyOwner {
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function setBurnConfig(uint256 burnBps_, address burnAddress_) external onlyOwner {
        require(burnBps_ <= 10_000, "bps");
        burnBps = burnBps_;
        burnAddress = burnAddress_;
    }

    function splitFee(uint256 amount) external view returns (uint256 treasuryAmount, uint256 burnAmount) {
        burnAmount = (amount * burnBps) / 10_000;
        treasuryAmount = amount - burnAmount;
    }

    function estimateFee(
        uint256 destinationChainId,
        CrossChainTypes.MessageType messageType,
        uint256 gasLimit
    ) external view returns (uint256) {
        ChainFeeConfig memory cfg = chainConfigs[destinationChainId];
        if (!cfg.active) return 0;
        uint256 typePremium = messageType == CrossChainTypes.MessageType.BATCH_OPERATION ? 50 : 10;
        uint256 fee = cfg.baseFee + (cfg.gasPrice * gasLimit);
        fee = (fee * (10_000 + cfg.congestionMultiplierBps + cfg.protocolPremiumBps + typePremium)) / 10_000;
        return fee;
    }
}
