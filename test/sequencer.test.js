import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("Sequencer", function () {
  it("proposes and confirms batch", async function () {
    const [admin, seq] = await ethers.getSigners();
    const Sequencer = await ethers.getContractFactory("Sequencer");
    const seqNet = await Sequencer.connect(admin).deploy(admin.address);

    await seqNet.connect(admin).registerSequencer(seq.address);
    const batchId = ethers.keccak256("0x1234");

    await seqNet.connect(seq).proposeBatch(
      batchId,
      ["0xdeadbeef"],
      1,
      [10],
      "0x"
    );

    await seqNet.connect(seq).executeBatch(batchId);
    const stored = await seqNet.confirmedBatches(batchId);
    expect(stored.confirmed).to.equal(true);
  });
});
