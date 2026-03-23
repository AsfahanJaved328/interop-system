import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Intent constraints", function () {
  it("rejects execution after deadline", async function () {
    const [owner, user, solver] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const intent = await Intent.connect(owner).deploy();

    await intent.connect(solver).registerSolver([1], [0], { value: ethers.parseEther("10") });

    const block = await ethers.provider.getBlock("latest");
    const now = block.timestamp;
    const tx = await intent.connect(user).createIntent(
      0,
      1,
      [10],
      [],
      [],
      {
        deadline: now + 10,
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
      1,
      "0x"
    );
    const receipt = await tx.wait();
    const intentId = receipt.logs.find(l => l.fragment && l.fragment.name === "IntentCreated").args.intentId;
    await intent.connect(solver).acceptIntent(intentId);

    await ethers.provider.send("evm_increaseTime", [20]);
    await ethers.provider.send("evm_mine", []);

    let threw = false;
    try {
      await intent.connect(solver).executeIntent(intentId, "0x");
    } catch (err) {
      threw = true;
    }
    expect(threw).to.equal(true);
  });

  it("enforces allowed executor list", async function () {
    const [owner, user, solver, other] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const intent = await Intent.connect(owner).deploy();

    await intent.connect(solver).registerSolver([1], [0], { value: ethers.parseEther("10") });
    await intent.connect(other).registerSolver([1], [0], { value: ethers.parseEther("10") });

    const block2 = await ethers.provider.getBlock("latest");
    const now = block2.timestamp;
    const tx = await intent.connect(user).createIntent(
      0,
      1,
      [10],
      [],
      [],
      {
        deadline: now + 3600,
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
      2,
      "0x"
    );
    const receipt = await tx.wait();
    const intentId = receipt.logs.find(l => l.fragment && l.fragment.name === "IntentCreated").args.intentId;
    await intent.connect(solver).acceptIntent(intentId);

    await expect(intent.connect(other).executeIntent(intentId, "0x")).to.be.reverted;
  });
});
