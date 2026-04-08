const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WeatherOracle", function () {
  let linkToken;
  let weatherOracle;
  let owner;
  let requester;
  let oracleSigner;

  const jobId = ethers.zeroPadValue(ethers.hexlify(ethers.toUtf8Bytes("test-job")), 32);
  const fee = ethers.parseUnits("0.1", 18);

  beforeEach(async () => {
    [owner, requester, oracleSigner] = await ethers.getSigners();

    const LinkToken = await ethers.getContractFactory("MockLinkToken");
    linkToken = await LinkToken.deploy();
    await linkToken.waitForDeployment();

    const WeatherOracle = await ethers.getContractFactory("WeatherOracle");
    weatherOracle = await WeatherOracle.deploy(linkToken.target, oracleSigner.address, jobId, fee);
    await weatherOracle.waitForDeployment();

    await linkToken.transfer(weatherOracle.target, fee);
  });

  it("should request weather and emit WeatherRequested", async function () {
    const tx = await weatherOracle.connect(requester).requestWeather("Paris");
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return weatherOracle.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "WeatherRequested");

    expect(event).to.not.be.undefined;
    expect(event.args.city).to.equal("Paris");
    expect(event.args.requester).to.equal(requester.address);
  });

  it("should revert requestWeather without LINK balance", async function () {
    const other = await ethers.deployContract("WeatherOracle", [linkToken.target, oracleSigner.address, jobId, fee]);
    let error;
    try {
      await other.connect(requester).requestWeather("Paris");
    } catch (err) {
      error = err;
    }
    expect(error).to.not.be.undefined;
    expect(error.message).to.include("Insufficient LINK balance");
  });

  it("should fulfill weather data and store the report", async function () {
    const requestTx = await weatherOracle.connect(requester).requestWeather("Tokyo");
    const requestReceipt = await requestTx.wait();
    const requestEvent = requestReceipt.logs
      .map((log) => {
        try {
          return weatherOracle.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "WeatherRequested");
    const requestId = requestEvent.args.requestId;

    const payload = '{"temperature":25,"description":"clear sky"}';
    const fulfillTx = await weatherOracle.connect(oracleSigner).fulfill(requestId, payload);
    const fulfillReceipt = await fulfillTx.wait();

    const reportEvent = fulfillReceipt.logs
      .map((log) => {
        try {
          return weatherOracle.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "WeatherReported");
    expect(reportEvent).to.not.be.undefined;
    expect(reportEvent.args.requestId).to.equal(requestId);
    expect(reportEvent.args.city).to.equal("Tokyo");
    expect(reportEvent.args.temperature).to.equal(25n);
    expect(reportEvent.args.description).to.equal("clear sky");
    expect(reportEvent.args.requester).to.equal(requester.address);

    const report = await weatherOracle.weatherReports(requestId);
    expect(report.city).to.equal("Tokyo");
    expect(report.temperature).to.equal(25n);
    expect(report.description).to.equal("clear sky");
    expect(report.requester).to.equal(requester.address);
  });

  it("should allow only owner to set oracle address", async function () {
    let error;
    try {
      await weatherOracle.connect(requester).setChainlinkOracle(requester.address);
    } catch (err) {
      error = err;
    }
    expect(error).to.not.be.undefined;
    expect(error.message).to.include("Ownable: caller is not the owner");

    await weatherOracle.connect(owner).setChainlinkOracle(requester.address);
    expect(await weatherOracle.oracle()).to.equal(requester.address);
  });
});
