import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("FeeOracle", function () {
  it("estimates fee for chain", async function () {
    const [owner, treasury] = await ethers.getSigners();
    const FeeOracle = await ethers.getContractFactory("FeeOracle");
    const oracle = await FeeOracle.connect(owner).deploy(treasury.address);

    await oracle.connect(owner).setChainConfig(10, 1, 2, 0, 0, true, ethers.ZeroAddress);
    await oracle.connect(owner).setBurnConfig(100, ethers.ZeroAddress);

    const fee = await oracle.estimateFee(10, 1, 1000);
    expect(fee).to.equal(2003n);
  });
});
