const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const city = process.argv[2] || process.env.CITY || "London";
  const contractAddress = process.env.WEATHER_ORACLE_ADDRESS;
  if (!contractAddress) {
    throw new Error("Please set WEATHER_ORACLE_ADDRESS in .env or pass a city argument.");
  }

  const provider = new hre.ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const WeatherOracle = await hre.ethers.getContractFactory("WeatherOracle");
  const contract = WeatherOracle.connect(wallet).attach(contractAddress);

  console.log(`Requesting weather for: ${city}`);
  const tx = await contract.requestWeather(city);
  const receipt = await tx.wait();

  console.log("Transaction hash:", receipt.transactionHash);
  const event = receipt.events?.find((e) => e.event === "WeatherRequested");
  if (event) {
    console.log("Request ID:", event.args.requestId);
    console.log("Requester:", event.args.requester);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
