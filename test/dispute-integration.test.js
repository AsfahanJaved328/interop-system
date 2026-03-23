import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Dispute integration", function () {
  it("raises a dispute via resolver", async function () {
    const [owner, user, solver] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const Resolver = await ethers.getContractFactory("DisputeResolver");

    const intent = await Intent.connect(owner).deploy();
    const resolver = await Resolver.connect(owner).deploy(owner.address);

    await intent.connect(owner).setDisputeResolver(resolver.target);
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
      4,
      "0x"
    );
    const receipt = await tx.wait();
    const intentId = receipt.logs.find(l => l.fragment && l.fragment.name === "IntentCreated").args.intentId;
    await intent.connect(solver).acceptIntent(intentId);

    const fee = await resolver.disputeFee();
    const tx2 = await intent.connect(user).raiseDispute(intentId, 0, ethers.ZeroHash, { value: fee });
    const receipt2 = await tx2.wait();
    const found = receipt2.logs.some((l) => {
      try {
        const parsed = resolver.interface.parseLog(l);
        return parsed && parsed.name === "DisputeCreated";
      } catch {
        return false;
      }
    });
    expect(found).to.equal(true);
  });
});
