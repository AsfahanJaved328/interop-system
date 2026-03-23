import "@nomicfoundation/hardhat-toolbox";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const config = {
  solidity: {
    version: "0.8.25",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL || "",
      accounts: process.env.TESTNET_PRIVATE_KEY ? [process.env.TESTNET_PRIVATE_KEY] : []
    }
  }
};

export default config;
