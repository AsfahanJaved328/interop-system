import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Intent fee payment", function () {
  it("transfers fee token to treasury on create", async function () {
    const [owner, user] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const Token = await ethers.getContractFactory("MockToken");
    const Treasury = await ethers.getContractFactory("Treasury");

    const intent = await Intent.connect(owner).deploy();
    const token = await Token.connect(owner).deploy();
    const treasury = await Treasury.connect(owner).deploy(owner.address);

    await intent.connect(owner).setTreasury(treasury.target);
    await token.connect(owner).transfer(user.address, ethers.parseEther("100"));
    await token.connect(user).approve(intent.target, ethers.parseEther("10"));

    const block = await ethers.provider.getBlock("latest");
    await intent.connect(user).createIntent(
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
        token: token.target,
        paymentChain: 1,
        amount: ethers.parseEther("10"),
        sponsor: ethers.ZeroAddress,
        usePaymaster: false
      },
      11,
      "0x"
    );

    const bal = await token.balanceOf(treasury.target);
    expect(bal).to.equal(ethers.parseEther("10"));
  });
});
