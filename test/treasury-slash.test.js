import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Treasury slashing", function () {
  it("routes slashed collateral to treasury", async function () {
    const [owner, user, solver, treasuryOwner] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const Treasury = await ethers.getContractFactory("Treasury");
    const intent = await Intent.connect(owner).deploy();
    const treasury = await Treasury.connect(treasuryOwner).deploy(treasuryOwner.address);

    await intent.connect(owner).setTreasury(treasury.target);
    await intent.connect(solver).registerSolver([1], [0], { value: ethers.parseEther("10") });

    const block = await ethers.provider.getBlock("latest");
    const tx = await intent.connect(user).createIntent(
      0,
      1,
      [10],
      [],
      [],
      {
        deadline: block.timestamp + 3600,
        maxSlippageBps: 50,
        minimumOutputs: [],
        allowedExecutors: []
      },
      {
        token: ethers.ZeroAddress,
        paymentChain: 1,
        amount: 0,
        sponsor: ethers.ZeroAddress,
        usePaymaster: false
      },
      9,
      "0x"
    );
    const receipt = await tx.wait();
    const intentId = receipt.logs.find(l => l.fragment && l.fragment.name === "IntentCreated").args.intentId;
    await intent.connect(solver).acceptIntent(intentId);

    const before = await ethers.provider.getBalance(treasury.target);
    await intent.connect(user).disputeIntent(intentId);
    const after = await ethers.provider.getBalance(treasury.target);
    expect(after - before).to.equal(ethers.parseEther("1"));
  });
});
