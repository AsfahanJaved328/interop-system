import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Light clients", function () {
  it("stores Ethereum header and verifies state root", async function () {
    const [owner] = await ethers.getSigners();
    const Client = await ethers.getContractFactory("EthereumLightClient");
    const client = await Client.connect(owner).deploy();

    const header = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "bytes32", "bytes32", "uint256"],
      [1, ethers.keccak256("0x01"), ethers.keccak256("0x02"), 123]
    );
    await client.verifyHeader(header, "0x");

    const ok = await client.verifyStateProof("0x", ethers.keccak256("0x02"));
    expect(ok).to.equal(true);
  });

  it("stores ZK header and verifies state root", async function () {
    const [owner] = await ethers.getSigners();
    const Client = await ethers.getContractFactory("ZKLightClient");
    const client = await Client.connect(owner).deploy(owner.address, 1, ethers.ZeroHash);

    const header = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "bytes32", "bytes32"],
      [5, ethers.keccak256("0x03"), ethers.keccak256("0x04")]
    );
    await client.verifyHeader(header, "0x");

    const ok = await client.verifyStateProof("0x", ethers.keccak256("0x04"));
    expect(ok).to.equal(true);
  });
});
