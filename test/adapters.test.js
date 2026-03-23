import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Protocol Adapters", function () {
  it("registers and routes via Axelar adapter", async function () {
    const [owner, sender] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.connect(owner).deploy();

    const Axelar = await ethers.getContractFactory("AxelarGMPAdapter");
    const adapter = await Axelar.connect(owner).deploy(owner.address);

    await router.connect(owner).setProtocolAdapter(10, 1, adapter.target, true, 9000, 50);

    const block = await ethers.provider.getBlock("latest");
    await router.connect(sender).routeMessage(10, sender.address, "0x1234", [1], block.timestamp + 3600);

    const stats = await router.getAdapterStats(10, 1);
    expect(stats[4]).to.equal(true);
  });

  it("registers and routes via LayerZero adapter", async function () {
    const [owner, sender] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.connect(owner).deploy();

    const LayerZero = await ethers.getContractFactory("LayerZeroAdapter");
    const adapter = await LayerZero.connect(owner).deploy(owner.address);

    await router.connect(owner).setProtocolAdapter(10, 2, adapter.target, true, 8000, 80);

    const block = await ethers.provider.getBlock("latest");
    await router.connect(sender).routeMessage(10, sender.address, "0x1234", [2], block.timestamp + 3600);

    const stats = await router.getAdapterStats(10, 2);
    expect(stats[4]).to.equal(true);
  });

  it("registers and routes via Wormhole adapter", async function () {
    const [owner, sender] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.connect(owner).deploy();

    const Wormhole = await ethers.getContractFactory("WormholeAdapter");
    const adapter = await Wormhole.connect(owner).deploy(owner.address);

    await router.connect(owner).setProtocolAdapter(10, 3, adapter.target, true, 8500, 70);

    const block = await ethers.provider.getBlock("latest");
    await router.connect(sender).routeMessage(10, sender.address, "0x1234", [3], block.timestamp + 3600);

    const stats = await router.getAdapterStats(10, 3);
    expect(stats[4]).to.equal(true);
  });

  it("registers and routes via Hyperlane adapter", async function () {
    const [owner, sender] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.connect(owner).deploy();

    const Hyperlane = await ethers.getContractFactory("HyperlaneAdapter");
    const adapter = await Hyperlane.connect(owner).deploy(owner.address);

    await router.connect(owner).setProtocolAdapter(10, 4, adapter.target, true, 8200, 60);

    const block = await ethers.provider.getBlock("latest");
    await router.connect(sender).routeMessage(10, sender.address, "0x1234", [4], block.timestamp + 3600);

    const stats = await router.getAdapterStats(10, 4);
    expect(stats[4]).to.equal(true);
  });
});
