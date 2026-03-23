import hardhat from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = hardhat;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function upsertEnvValue(content: string, key: string, value: string) {
  const filtered = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.startsWith(`${key}=`));
  filtered.push(`${key}=${value}`);
  return `${filtered.join("\n")}\n`;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Router = await ethers.getContractFactory("CrossChainRouter");
  const router = await Router.deploy();
  await router.waitForDeployment();

  const FeeOracle = await ethers.getContractFactory("FeeOracle");
  const feeOracle = await FeeOracle.deploy(deployer.address);
  await feeOracle.waitForDeployment();

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

  const envPath = path.resolve(__dirname, "..", "frontend", ".env.testnet");
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  content = upsertEnvValue(content, "NEXT_PUBLIC_INTENT_CONTRACT", String(intent.target));
  content = upsertEnvValue(content, "NEXT_PUBLIC_ROUTER_CONTRACT", String(router.target));
  content = upsertEnvValue(content, "NEXT_PUBLIC_FEE_ORACLE", String(feeOracle.target));
  content = upsertEnvValue(content, "NEXT_PUBLIC_RPC_URL", process.env.TESTNET_RPC_URL || "");
  content = upsertEnvValue(content, "NEXT_PUBLIC_ADAPTER_AXELAR", "");
  content = upsertEnvValue(content, "NEXT_PUBLIC_ADAPTER_LAYERZERO", "");
  content = upsertEnvValue(content, "NEXT_PUBLIC_ADAPTER_WORMHOLE", "");
  content = upsertEnvValue(content, "NEXT_PUBLIC_ADAPTER_HYPERLANE", "");
  fs.writeFileSync(envPath, `${content.trim()}\n`);

  console.log("Router:", router.target);
  console.log("FeeOracle:", feeOracle.target);
  console.log("Intent:", intent.target);
  console.log("Wrote frontend .env.testnet:", envPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
