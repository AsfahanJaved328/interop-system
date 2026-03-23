import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("CrossChainRouter", function () {
  it("routes message and emits id", async function () {
    const [owner, sender] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.connect(owner).deploy();

    const Mock = await ethers.getContractFactory("MockAdapter");
    const mock = await Mock.connect(owner).deploy();

    await router.connect(owner).setProtocolAdapter(
      10,
      0,
      mock.target,
      true,
      100,
      10
    );

    const block = await ethers.provider.getBlock("latest");
    const tx = await router.connect(sender).routeMessage(
      10,
      sender.address,
      "0x1234",
      [],
      block.timestamp + 3600
    );

    const receipt = await tx.wait();
    const evt = receipt.logs.find(log => log.fragment && log.fragment.name === "MessageRouted");
    expect(evt).to.not.equal(undefined);
  });

  it("verifies delivery with light client", async function () {
    const [owner] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.connect(owner).deploy();

    const MockClient = await ethers.getContractFactory("MockLightClient");
    const client = await MockClient.connect(owner).deploy();

    await router.connect(owner).setLightClient(10, client.target);

    const ok = await router.verifyDeliveryWithLightClient(
      10,
      ethers.ZeroHash,
      ethers.ZeroHash,
      "0x"
    );
    expect(ok).to.equal(true);
  });

  it("delivers with light client proof", async function () {
    const [owner, sender] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const router = await Router.connect(owner).deploy();

    const Mock = await ethers.getContractFactory("MockAdapter");
    const mock = await Mock.connect(owner).deploy();
    const MockClient = await ethers.getContractFactory("MockLightClient");
    const client = await MockClient.connect(owner).deploy();

    await router.connect(owner).setProtocolAdapter(10, 0, mock.target, true, 100, 10);
    await router.connect(owner).setLightClient(10, client.target);

    const block2 = await ethers.provider.getBlock("latest");
    const tx = await router.connect(sender).routeMessage(
      10,
      sender.address,
      "0x1234",
      [0],
      block2.timestamp + 3600
    );
    const receipt = await tx.wait();
    const evt = receipt.logs.find(log => log.fragment && log.fragment.name === "MessageRouted");
    const messageId = evt.args.messageId;

    await mock.connect(owner).deliverToRouterWithProof(router.target, 10, messageId, 0);
  });
});
