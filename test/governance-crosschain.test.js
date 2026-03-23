import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Governance cross-chain routing", function () {
  it("routes proposal execution through router", async function () {
    const [admin, voter] = await ethers.getSigners();
    const Gov = await ethers.getContractFactory("Governance");
    const Token = await ethers.getContractFactory("GovToken");
    const Router = await ethers.getContractFactory("CrossChainRouter");
    const Mock = await ethers.getContractFactory("MockAdapter");

    const gov = await Gov.connect(admin).deploy(admin.address);
    const token = await Token.connect(admin).deploy();
    const router = await Router.connect(admin).deploy();
    const mock = await Mock.connect(admin).deploy();

    await gov.connect(admin).setVoteToken(token.target);
    await gov.connect(admin).setRouter(router.target);
    await router.connect(admin).setProtocolAdapter(10, 0, mock.target, true, 100, 10);

    await token.connect(admin).transfer(voter.address, ethers.parseEther("20000"));
    await token.connect(voter).delegate(voter.address);

    const data = gov.interface.encodeFunctionData("setTimelockDelay", [2]);
    const tx = await gov.createProposal(voter.address, 0, data);
    const receipt = await tx.wait();
    const id = receipt.logs.find((l) => l.fragment && l.fragment.name === "ProposalCreated").args.id;

    await gov.connect(voter).castVote(id, true);
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);

    await gov.executeCrossChain(id, 10);
    const p = await gov.proposals(id);
    expect(p.executed).to.equal(true);
  });
});
