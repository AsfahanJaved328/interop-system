import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("UniversalAccount", function () {
  it("handles user op and increments nonce", async function () {
    const [admin, user] = await ethers.getSigners();
    const UA = await ethers.getContractFactory("UniversalAccount");
    const ua = await UA.connect(admin).deploy(admin.address);

    const op = {
      sender: user.address,
      nonce: 0,
      initCode: "0x",
      callData: "0x",
      callGasLimit: 0,
      verificationGasLimit: 0,
      preVerificationGas: 0,
      maxFeePerGas: 0,
      maxPriorityFeePerGas: 0,
      paymasterAndData: "0x",
      signature: "0x"
    };

    const hash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["address","uint256","bytes","bytes","uint256","uint256","uint256","uint256","uint256","bytes","uint256"],
      [op.sender, op.nonce, op.initCode, op.callData, op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas, op.paymasterAndData, (await ethers.provider.getNetwork()).chainId]
    ));

    const sig = await user.signMessage(ethers.getBytes(hash));
    op.signature = sig;

    await ua.connect(admin).handleCrossChainUserOp(op, [1, 10]);
    const next = await ua.nonces(user.address);
    expect(next).to.equal(1n);
  });

  it("handles aggregated op and increments aggregated nonce", async function () {
    const [admin, user] = await ethers.getSigners();
    const UA = await ethers.getContractFactory("UniversalAccount");
    const ua = await UA.connect(admin).deploy(admin.address);

    const op = {
      sender: user.address,
      nonce: 0,
      initCode: "0x",
      callData: "0x1234",
      callGasLimit: 0,
      verificationGasLimit: 0,
      preVerificationGas: 0,
      maxFeePerGas: 0,
      maxPriorityFeePerGas: 0,
      paymasterAndData: "0x",
      signature: "0x"
    };

    const hash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["address","uint256","bytes","uint256","uint256","uint256","uint256"],
      [op.sender, op.nonce, op.callData, op.callGasLimit, op.maxFeePerGas, op.maxPriorityFeePerGas, (await ethers.provider.getNetwork()).chainId]
    ));
    const sig = await user.signMessage(ethers.getBytes(hash));

    await ua.connect(admin).handleAggregatedOp(op, sig);
    const next = await ua.aggregatedNonces(user.address);
    expect(next).to.equal(1n);
  });
});
