import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Router = await ethers.getContractFactory("CrossChainRouter");
  const router = await Router.deploy();
  await router.waitForDeployment();
  console.log("Router:", router.target);

  const FeeOracle = await ethers.getContractFactory("FeeOracle");
  const feeOracle = await FeeOracle.deploy(deployer.address);
  await feeOracle.waitForDeployment();
  console.log("FeeOracle:", feeOracle.target);

  await router.setFeeOracle(feeOracle.target);
  await feeOracle.setChainConfig(1, ethers.parseEther("0.0005"), 1, 250, 100, true, ethers.ZeroAddress);
  await feeOracle.setChainConfig(137, ethers.parseEther("0.0003"), 1, 200, 80, true, ethers.ZeroAddress);
  await feeOracle.setChainConfig(42161, ethers.parseEther("0.00025"), 1, 180, 70, true, ethers.ZeroAddress);
  await feeOracle.setChainConfig(8453, ethers.parseEther("0.0002"), 1, 160, 60, true, ethers.ZeroAddress);
  await feeOracle.setChainConfig(43114, ethers.parseEther("0.00035"), 1, 220, 90, true, ethers.ZeroAddress);
  await feeOracle.setChainConfig(56, ethers.parseEther("0.00022"), 1, 150, 50, true, ethers.ZeroAddress);
  await feeOracle.setChainConfig(101, ethers.parseEther("0.0004"), 1, 200, 100, true, ethers.ZeroAddress);

  const Intent = await ethers.getContractFactory("IntentContract");
  const intent = await Intent.deploy();
  await intent.waitForDeployment();
  console.log("Intent:", intent.target);

  const envPath = path.resolve(__dirname, "..", "frontend", ".env.local");
  const content = [
    `NEXT_PUBLIC_INTENT_CONTRACT=${intent.target}`,
    `NEXT_PUBLIC_ROUTER_CONTRACT=${router.target}`,
    `NEXT_PUBLIC_FEE_ORACLE=${feeOracle.target}`,
    "NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545",
    "NEXT_PUBLIC_ADAPTER_AXELAR=",
    "NEXT_PUBLIC_ADAPTER_LAYERZERO=",
    "NEXT_PUBLIC_ADAPTER_WORMHOLE=",
    "NEXT_PUBLIC_ADAPTER_HYPERLANE="
  ].join("\n");
  fs.writeFileSync(envPath, content);
  console.log("Wrote frontend .env.local:", envPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
