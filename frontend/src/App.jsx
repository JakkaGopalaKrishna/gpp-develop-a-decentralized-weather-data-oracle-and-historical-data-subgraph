import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import WeatherOracleABI from './contracts/WeatherOracle.json';
import WeatherForm from './components/WeatherForm';
import WeatherReportsList from './components/WeatherReportsList';

const weatherOracleAddress = import.meta.env.VITE_WEATHER_ORACLE_ADDRESS;
const subgraphUri = import.meta.env.VITE_SUBGRAPH_URL;

const client = new ApolloClient({
  uri: subgraphUri,
  cache: new InMemoryCache(),
});

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    if (window.ethereum && weatherOracleAddress) {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      setProvider(providerInstance);
      providerInstance.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const signerInstance = providerInstance.getSigner();
          setSigner(signerInstance);
          const contractInstance = new ethers.Contract(weatherOracleAddress, WeatherOracleABI.abi, signerInstance);
          setContract(contractInstance);
          providerInstance.getNetwork().then((net) => setNetwork(net.name || net.chainId));
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Install MetaMask to use this dApp.');
      return;
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);
    const signerInstance = new ethers.BrowserProvider(window.ethereum).getSigner();
    setSigner(signerInstance);
    const contractInstance = new ethers.Contract(weatherOracleAddress, WeatherOracleABI.abi, signerInstance);
    setContract(contractInstance);
    const net = await new ethers.BrowserProvider(window.ethereum).getNetwork();
    setNetwork(net.name || net.chainId);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1>Decentralized Weather Oracle</h1>
      <p>Connect your wallet, request a city forecast, and view historic weather reports from the subgraph.</p>
      {!account ? (
        <button onClick={connectWallet} style={{ padding: '10px 16px', fontSize: 16 }}>
          Connect Wallet
        </button>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <strong>Connected:</strong> {account}
          <br />
          <strong>Network:</strong> {network}
        </div>
      )}
      {contract && account ? <WeatherForm contract={contract} /> : null}
      <WeatherReportsList client={client} />
    </div>
  );
}

export default App;
