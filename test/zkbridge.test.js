import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("ZKBridge", function () {
  it("deposits and withdraws after proof submission", async function () {
    const [admin, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockToken");
    const Bridge = await ethers.getContractFactory("ZKBridge");
    const Verifier = await ethers.getContractFactory("MockVerifier");
    const token = await Token.connect(admin).deploy();
    const bridge = await Bridge.connect(admin).deploy(admin.address);
    const verifier = await Verifier.connect(admin).deploy();

    await token.connect(admin).transfer(user.address, ethers.parseEther("100"));
    await token.connect(user).approve(bridge.target, ethers.parseEther("10"));
    const root = ethers.keccak256("0x01");
    await bridge.connect(user).deposit(token.target, ethers.parseEther("10"), root);

    await bridge.connect(admin).setVerifier(1, verifier.target);
    await bridge.connect(admin).setFinalityDelay(1, 1);
    await bridge.connect(admin).submitProof(1, root, "0x", "0x");
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);
    await bridge.connect(user).withdraw(token.target, ethers.parseEther("10"), 1, root);

    const balance = await token.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("100"));
  });
});
