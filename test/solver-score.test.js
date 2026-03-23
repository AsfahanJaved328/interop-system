import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Solver score", function () {
  it("increases with successful execution", async function () {
    const [owner, user, solver] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const intent = await Intent.connect(owner).deploy();

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
        allowedExecutors: [solver.address]
      },
      {
        token: ethers.ZeroAddress,
        paymentChain: 1,
        amount: 0,
        sponsor: ethers.ZeroAddress,
        usePaymaster: false
      },
      12,
      "0x"
    );
    const receipt = await tx.wait();
    const intentId = receipt.logs.find(l => l.fragment && l.fragment.name === "IntentCreated").args.intentId;
    await intent.connect(solver).acceptIntent(intentId);
    await intent.connect(solver).executeIntent(intentId, "0x");

    const score = await intent.getSolverScore(solver.address);
    expect(score).to.be.greaterThan(0n);
  });
});
