import { run } from "hardhat";

async function main() {
  const address = process.env.VERIFY_ADDRESS;
  if (!address) {
    throw new Error("VERIFY_ADDRESS is required");
  }
  await run("verify:verify", {
    address,
    constructorArguments: []
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
