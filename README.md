# Decentralized Weather Data Oracle and Historical Data Subgraph

This repository implements a Chainlink-powered weather oracle smart contract, a subgraph for indexing weather reports, and a React frontend to request weather data and display historical reports.

## Project Structure

- `contracts/WeatherOracle.sol` - Solidity oracle contract that uses Chainlink Any API to request weather data.
- `scripts/deploy.js` - Hardhat deploy script for the WeatherOracle contract.
- `scripts/request-weather.js` - Script for submitting a weather request from CLI.
- `test/WeatherOracle.test.js` - Unit tests for request and fulfillment logic.
- `subgraph/` - Subgraph project for indexing `WeatherReported` events.
- `frontend/` - React frontend app that connects to MetaMask and queries the subgraph.
- `docker-compose.yml` - Local development container for running a Hardhat node.
- `.env.example` - Example environment variables for deployment and frontend.

## Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and populate values.
3. Install dependencies:
   - Root: `npm install`
   - Frontend: `cd frontend && npm install`
   - Subgraph: `cd subgraph && npm install`

## Running Locally

### Start local Hardhat node

```bash
docker-compose up
```

This starts a local Hardhat network on `http://127.0.0.1:8545`.

### Compile contracts

```bash
npm run compile
```

### Run tests

```bash
npm test
```

### Deploy to local network

Make sure `.env` contains `LINK_TOKEN_ADDRESS` and other config values for local deployment.

```bash
npm run deploy:local
```

### Request weather from CLI

```bash
npm run request-weather -- "London"
```

## Subgraph

### Codegen and build

```bash
cd subgraph
npm run codegen
npm run build
```

### Deploy

Update `subgraph/subgraph.yaml` to use your deployed contract address or use Graph CLI substitution with `{{WEATHER_ORACLE_ADDRESS}}`.

```bash
cd subgraph
npm run deploy
```

## Frontend

### Start the app

```bash
npm run frontend:start
```

Open the displayed Vite URL and connect MetaMask.

## Environment Variables

Configure the following in `.env`:

- `PRIVATE_KEY` - deployer wallet private key
- `SEPOLIA_RPC_URL` - RPC endpoint for testnet
- `LINK_TOKEN_ADDRESS` - LINK token contract address
- `CHAINLINK_ORACLE_ADDRESS` - Chainlink oracle node address
- `CHAINLINK_JOB_ID` - Chainlink job ID as hex or string
- `CHAINLINK_FEE` - LINK fee amount
- `WEATHER_ORACLE_ADDRESS` - deployed contract address
- `VITE_WEATHER_ORACLE_ADDRESS` - contract address for frontend
- `VITE_SUBGRAPH_URL` - GraphQL endpoint for the deployed subgraph

## Notes

- The smart contract stores weather reports on-chain and emits `WeatherRequested` and `WeatherReported` events.
- The subgraph indexes `WeatherReported` events into a `WeatherReport` entity.
- The frontend uses Apollo Client to query the subgraph and Ethers to submit oracle requests.

## Security and Gas Considerations

- Owner-only functions guard oracle and job configuration.
- The contract validates LINK balance and request parameters.
- Weather parsing is designed for simplified external adapter responses.
