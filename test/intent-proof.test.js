import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Intent proof execution", function () {
  it("executes intent with light client proof", async function () {
    const [owner, user, solver] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const MockClient = await ethers.getContractFactory("MockLightClient");
    const intent = await Intent.connect(owner).deploy();
    const client = await MockClient.connect(owner).deploy();

    await intent.connect(owner).setLightClient(10, client.target);
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
      3,
      "0x"
    );
    const receipt = await tx.wait();
    const intentId = receipt.logs.find(l => l.fragment && l.fragment.name === "IntentCreated").args.intentId;
    await intent.connect(solver).acceptIntent(intentId);

    await intent.connect(solver).executeIntentWithProof(
      intentId,
      10,
      ethers.ZeroHash,
      ethers.ZeroHash,
      "0x",
      "0x",
      ethers.ZeroHash
    );

    const stored = await intent.intents(intentId);
    expect(stored.status).to.equal(3n);
  });
});
