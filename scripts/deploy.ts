import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const GovToken = await ethers.getContractFactory("GovToken");
  const token = await GovToken.deploy();
  await token.waitForDeployment();
  console.log("GovToken:", token.target);

  const Router = await ethers.getContractFactory("CrossChainRouter");
  const router = await Router.deploy();
  await router.waitForDeployment();
  console.log("Router:", router.target);

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  console.log("Treasury:", treasury.target);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
