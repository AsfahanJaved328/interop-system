import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Protocol stats", function () {
  it("tracks total and successful deliveries", async function () {
    const [owner, sender] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const Mock = await ethers.getContractFactory("MockAdapter");
    const router = await Router.connect(owner).deploy();
    const mock = await Mock.connect(owner).deploy();

    await router.connect(owner).setProtocolAdapter(10, 0, mock.target, true, 100, 10);

    const block = await ethers.provider.getBlock("latest");
    const tx = await router.connect(sender).routeMessage(
      10,
      sender.address,
      "0x1234",
      [0],
      block.timestamp + 3600
    );
    const receipt = await tx.wait();
    const evt = receipt.logs.find(log => log.fragment && log.fragment.name === "MessageRouted");
    const messageId = evt.args.messageId;

    await mock.connect(owner).deliverToRouter(router.target, messageId, 0, true);

    const stats = await router.getProtocolStats(0);
    expect(stats[0]).to.equal(1n);
    expect(stats[1]).to.equal(1n);

    const adapterStats = await router.getAdapterStats(10, 0);
    expect(adapterStats[0]).to.equal(10000n);
    const metrics = await router.getProtocolMetrics(0);
    expect(metrics[0]).to.equal(0n);
  });
});
