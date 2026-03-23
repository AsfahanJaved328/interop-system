import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Governance", function () {
  it("creates and executes proposal after timelock", async function () {
    const [admin] = await ethers.getSigners();
    const Gov = await ethers.getContractFactory("Governance");
    const gov = await Gov.connect(admin).deploy(admin.address);

    const data = gov.interface.encodeFunctionData("setTimelockDelay", [2]);
    const tx = await gov.createProposal(gov.target, 0, data);
    const receipt = await tx.wait();
    const evt = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated");
    const proposalId = evt.args.id;

    // bypass voting in this MVP test
    await gov.connect(admin).setQuorum(0);
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);

    await gov.executeProposal(proposalId);
    const delay = await gov.timelockDelay();
    expect(delay).to.equal(2n);
  });
});
