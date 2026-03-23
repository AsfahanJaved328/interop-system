import hardhat from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = hardhat;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveFrontendEnvPath() {
  const requested = process.env.FRONTEND_ENV_FILE;
  if (requested) return path.resolve(requested);
  return path.resolve(__dirname, "..", "frontend", ".env.local");
}

function readRouterAddressFromEnvFile(envPath: string) {
  if (!fs.existsSync(envPath)) return "";
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^NEXT_PUBLIC_ROUTER_CONTRACT=(.+)$/m);
  return match ? match[1].trim() : "";
}

function upsertEnvValue(content: string, key: string, value: string) {
  const filtered = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.startsWith(`${key}=`));
  filtered.push(`${key}=${value}`);
  return `${filtered.join("\n")}\n`;
}

async function main() {
  const envPath = resolveFrontendEnvPath();
  const routerAddress = process.env.ROUTER_ADDRESS || readRouterAddressFromEnvFile(envPath);
  if (!routerAddress) throw new Error("ROUTER_ADDRESS env var is required");

  const [deployer] = await ethers.getSigners();
  const router = await ethers.getContractAt("CrossChainRouter", routerAddress, deployer);

  const Axelar = await ethers.getContractFactory("AxelarGMPAdapter");
  const LayerZero = await ethers.getContractFactory("LayerZeroAdapter");
  const Wormhole = await ethers.getContractFactory("WormholeAdapter");
  const Hyperlane = await ethers.getContractFactory("HyperlaneAdapter");

  const axelar = await Axelar.deploy(deployer.address);
  const layerZero = await LayerZero.deploy(deployer.address);
  const wormhole = await Wormhole.deploy(deployer.address);
  const hyperlane = await Hyperlane.deploy(deployer.address);

  await router.setProtocolAdapter(10, 1, axelar.target, true, 9000, 50);
  await router.setProtocolAdapter(10, 2, layerZero.target, true, 8500, 70);
  await router.setProtocolAdapter(10, 3, wormhole.target, true, 8700, 60);
  await router.setProtocolAdapter(10, 4, hyperlane.target, true, 8600, 65);

  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  env = upsertEnvValue(env, "NEXT_PUBLIC_ADAPTER_AXELAR", String(axelar.target));
  env = upsertEnvValue(env, "NEXT_PUBLIC_ADAPTER_LAYERZERO", String(layerZero.target));
  env = upsertEnvValue(env, "NEXT_PUBLIC_ADAPTER_WORMHOLE", String(wormhole.target));
  env = upsertEnvValue(env, "NEXT_PUBLIC_ADAPTER_HYPERLANE", String(hyperlane.target));
  fs.writeFileSync(envPath, `${env.trim()}\n`);

  console.log("Adapters deployed:");
  console.log("Axelar:", axelar.target);
  console.log("LayerZero:", layerZero.target);
  console.log("Wormhole:", wormhole.target);
  console.log("Hyperlane:", hyperlane.target);
  console.log("Updated frontend env:", envPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
