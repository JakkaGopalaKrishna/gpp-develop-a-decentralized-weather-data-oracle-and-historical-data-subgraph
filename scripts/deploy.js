const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS;
  const oracleAddress = process.env.CHAINLINK_ORACLE_ADDRESS;
  const jobIdRaw = process.env.CHAINLINK_JOB_ID;
  const fee = hre.ethers.parseUnits(process.env.CHAINLINK_FEE || "0.1", 18);

  if (!linkTokenAddress || !oracleAddress || !jobIdRaw) {
    throw new Error("Missing LINK_TOKEN_ADDRESS, CHAINLINK_ORACLE_ADDRESS, or CHAINLINK_JOB_ID in .env");
  }

  const jobId = hre.ethers.isHexString(jobIdRaw, 32)
    ? jobIdRaw
    : hre.ethers.hexZeroPad(hre.ethers.toUtf8Bytes(jobIdRaw), 32);

  const WeatherOracle = await hre.ethers.getContractFactory("WeatherOracle");
  const weatherOracle = await WeatherOracle.deploy(linkTokenAddress, oracleAddress, jobId, fee);
  await weatherOracle.waitForDeployment();

  console.log("WeatherOracle deployed to:", weatherOracle.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
