// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";

/// @title Chainlink CCIP Adapter (Skeleton)
/// @notice Placeholder adapter with selector mapping and fee passthrough interface.
contract ChainlinkCCIPAdapter is Ownable, IProtocolAdapter {
    mapping(uint256 => uint64) public chainIdToSelector;
    address public router;

    event RouterUpdated(address indexed router);
    event ChainSelectorUpdated(uint256 indexed chainId, uint64 selector);

    error UnknownChain();

    constructor(address router_) Ownable(msg.sender) {
        router = router_;
    }

    function setRouter(address router_) external onlyOwner {
        router = router_;
        emit RouterUpdated(router_);
    }

    function setChainSelector(uint256 chainId, uint64 selector) external onlyOwner {
        chainIdToSelector[chainId] = selector;
        emit ChainSelectorUpdated(chainId, selector);
    }

    function sendMessage(
        uint256 destinationChainId,
        address /*receiver*/,
        bytes calldata /*payload*/,
        uint256 /*gasLimit*/
    ) external payable returns (bytes32) {
        if (chainIdToSelector[destinationChainId] == 0) revert UnknownChain();
        // Phase 1 skeleton: integrate CCIP router in Phase 2.
        return keccak256(abi.encode(destinationChainId, msg.sender, block.timestamp));
    }
}
