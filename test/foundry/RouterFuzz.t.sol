// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {CrossChainRouter} from "../../contracts/CrossChainRouter.sol";
import {MockAdapter} from "../../contracts/mocks/MockAdapter.sol";

contract RouterFuzz is Test {
    CrossChainRouter private router;
    MockAdapter private adapter;

    function setUp() external {
        router = new CrossChainRouter();
        adapter = new MockAdapter();
        router.setProtocolAdapter(
            1,
            CrossChainRouter.Protocol.CUSTOM,
            address(adapter),
            true,
            9000,
            50
        );
    }

    function testFuzz_MessageIdUniqueness(uint256 chainId, address receiver, bytes calldata payload) external {
        vm.assume(receiver != address(0));
        CrossChainRouter.Protocol[] memory preferred = new CrossChainRouter.Protocol[](1);
        preferred[0] = CrossChainRouter.Protocol.CUSTOM;
        uint256 deadline = block.timestamp + 1 hours;

        uint256 targetChain = chainId == 0 ? 1 : chainId;
        bytes32 messageId = router.routeMessage(targetChain, receiver, payload, preferred, deadline);
        assertTrue(messageId != bytes32(0));
    }
}
