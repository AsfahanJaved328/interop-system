import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Governance voting", function () {
  it("requires quorum to execute", async function () {
    const [admin, voter] = await ethers.getSigners();
    const Gov = await ethers.getContractFactory("Governance");
    const Token = await ethers.getContractFactory("GovToken");
    const gov = await Gov.connect(admin).deploy(admin.address);
    const token = await Token.connect(admin).deploy();

    await gov.connect(admin).setVoteToken(token.target);
    await token.connect(admin).transfer(voter.address, ethers.parseEther("20000"));
    await token.connect(voter).delegate(voter.address);

    const data = gov.interface.encodeFunctionData("setTimelockDelay", [2]);
    const tx = await gov.createProposal(gov.target, 0, data);
    const receipt = await tx.wait();
    const id = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated").args.id;

    await gov.connect(voter).castVote(id, true);

    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);
    await gov.executeProposal(id);
    const delay = await gov.timelockDelay();
    expect(delay).to.equal(2n);
  });
});
