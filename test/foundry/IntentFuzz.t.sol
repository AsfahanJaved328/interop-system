// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IntentContract} from "../../contracts/IntentContract.sol";
import {CrossChainTypes} from "../../contracts/CrossChainTypes.sol";

contract IntentFuzz is Test {
    IntentContract private intent;

    function setUp() external {
        intent = new IntentContract();
    }

    function testFuzz_CreateIntentDeadline(uint256 deadlineOffset) external {
        vm.assume(deadlineOffset > 1);
        uint256 deadline = block.timestamp + deadlineOffset;

        CrossChainTypes.TokenAmount[] memory provided = new CrossChainTypes.TokenAmount[](0);
        CrossChainTypes.TokenAmount[] memory expected = new CrossChainTypes.TokenAmount[](0);
        uint256[] memory targets = new uint256[](1);
        targets[0] = 1;

        IntentContract.ExecutionConstraints memory constraints = IntentContract.ExecutionConstraints({
            deadline: deadline,
            maxSlippageBps: 50,
            minimumOutputs: new uint256[](0),
            allowedExecutors: new address[](0)
        });

        IntentContract.FeePayment memory fee = IntentContract.FeePayment({
            token: address(0),
            paymentChain: 1,
            amount: 0,
            sponsor: address(0),
            usePaymaster: false
        });

        bytes32 intentId = intent.createIntent(
            IntentContract.IntentType.SWAP,
            1,
            targets,
            provided,
            expected,
            constraints,
            fee,
            0,
            ""
        );

        assertTrue(intentId != bytes32(0));
    }
}
