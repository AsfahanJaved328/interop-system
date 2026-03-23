import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("IntentContract", function () {
  it("creates intent with EIP-712 signature", async function () {
    const [owner, user] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const intent = await Intent.connect(owner).deploy();

    const block = await ethers.provider.getBlock("latest");
    const now = block.timestamp;

    const constraints = {
      deadline: now + 3600,
      maxSlippageBps: 50,
      minimumOutputs: [],
      allowedExecutors: []
    };

    const feePayment = {
      token: ethers.ZeroAddress,
      paymentChain: 1,
      amount: 0,
      sponsor: ethers.ZeroAddress,
      usePaymaster: false
    };

    const domain = {
      name: "InteropIntent",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: intent.target
    };

    const types = {
      IntentSig: [
        { name: "user", type: "address" },
        { name: "intentType", type: "uint8" },
        { name: "sourceChain", type: "uint256" },
        { name: "targetChainsHash", type: "bytes32" },
        { name: "providedHash", type: "bytes32" },
        { name: "expectedHash", type: "bytes32" },
        { name: "constraintsHash", type: "bytes32" },
        { name: "feePaymentHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
        { name: "memoHash", type: "bytes32" }
      ]
    };

    const tokenAmountTypeHash = ethers.keccak256(
      ethers.toUtf8Bytes("TokenAmount(address token,uint256 chainId,uint256 amount)")
    );
    const constraintsTypeHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        "ExecutionConstraints(uint256 deadline,uint256 maxSlippageBps,bytes32 minimumOutputsHash,bytes32 allowedExecutorsHash)"
      )
    );
    const feePaymentTypeHash = ethers.keccak256(
      ethers.toUtf8Bytes("FeePayment(address token,uint256 paymentChain,uint256 amount,address sponsor,bool usePaymaster)")
    );

    const providedHash = ethers.keccak256(ethers.solidityPacked(["bytes32[]"], [[]]));
    const expectedHash = ethers.keccak256(ethers.solidityPacked(["bytes32[]"], [[]]));
    const targetChainsHash = ethers.keccak256(ethers.solidityPacked(["uint256[]"], [[10]]));
    const minOutputsHash = ethers.keccak256(ethers.solidityPacked(["uint256[]"], [[]]));
    const allowedExecutorsHash = ethers.keccak256(ethers.solidityPacked(["address[]"], [[]]));
    const constraintsHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "uint256", "uint256", "bytes32", "bytes32"],
        [constraintsTypeHash, constraints.deadline, constraints.maxSlippageBps, minOutputsHash, allowedExecutorsHash]
      )
    );
    const feePaymentHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address", "uint256", "uint256", "address", "bool"],
        [
          feePaymentTypeHash,
          feePayment.token,
          feePayment.paymentChain,
          feePayment.amount,
          feePayment.sponsor,
          feePayment.usePaymaster
        ]
      )
    );

    const message = {
      user: user.address,
      intentType: 0,
      sourceChain: 1,
      targetChainsHash,
      providedHash,
      expectedHash,
      constraintsHash,
      feePaymentHash,
      nonce: 0,
      memoHash: ethers.keccak256(ethers.toUtf8Bytes("memo"))
    };

    const signature = await user.signTypedData(domain, types, message);

    const tx = await intent.connect(owner).createIntentWithSig(
      user.address,
      0,
      1,
      [10],
      [],
      [],
      constraints,
      feePayment,
      0,
      ethers.toUtf8Bytes("memo"),
      signature
    );
    const receipt = await tx.wait();
    const evt = receipt.logs.find(log => log.fragment && log.fragment.name === "IntentCreated");
    expect(evt).to.not.equal(undefined);
  });

  it("creates and accepts intent", async function () {
    const [owner, user, solver] = await ethers.getSigners();
    const Intent = await ethers.getContractFactory("IntentContract");
    const intent = await Intent.connect(owner).deploy();

    await intent.connect(solver).registerSolver([1], [0], { value: ethers.parseEther("10") });

    const block = await ethers.provider.getBlock("latest");
    const now = block.timestamp;
    const tx = await intent.connect(user).createIntent(
      0,
      1,
      [10],
      [],
      [],
      {
        deadline: now + 3600,
        maxSlippageBps: 50,
        minimumOutputs: [],
        allowedExecutors: []
      },
      {
        token: ethers.ZeroAddress,
        paymentChain: 1,
        amount: 0,
        sponsor: ethers.ZeroAddress,
        usePaymaster: false
      },
      1,
      "0x"
    );

    const receipt = await tx.wait();
    const evt = receipt.logs.find(log => log.fragment && log.fragment.name === "IntentCreated");
    expect(evt).to.not.equal(undefined);

    const intentId = evt.args.intentId;
    await intent.connect(solver).acceptIntent(intentId);
  });
});
