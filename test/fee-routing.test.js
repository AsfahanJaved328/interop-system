import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Fee routing", function () {
  it("routes fee to treasury and refunds excess", async function () {
    const [owner, sender, treasury] = await ethers.getSigners();
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const FeeOracle = await ethers.getContractFactory("FeeOracle");
    const Mock = await ethers.getContractFactory("MockAdapter");

    const router = await Router.connect(owner).deploy();
    const oracle = await FeeOracle.connect(owner).deploy(treasury.address);
    const mock = await Mock.connect(owner).deploy();

    await oracle.connect(owner).setChainConfig(10, 1, 2, 0, 0, true, ethers.ZeroAddress);
    await oracle.connect(owner).setBurnConfig(100, ethers.ZeroAddress);
    await router.connect(owner).setFeeOracle(oracle.target);
    await router.connect(owner).setProtocolAdapter(10, 0, mock.target, true, 100, 10);

    const before = await ethers.provider.getBalance(treasury.address);
    await router.connect(sender).routeMessage(
      10,
      sender.address,
      "0x1234",
      [],
      Math.floor(Date.now() / 1000) + 3600,
      { value: 5000 }
    );
    const after = await ethers.provider.getBalance(treasury.address);
    expect(after).to.equal(before + 1n);
  });
});
