import React, { useState } from 'react';

export default function WeatherForm({ contract }) {
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const requestWeather = async (event) => {
    event.preventDefault();
    setStatus('Sending request...');
    setError('');

    try {
      const tx = await contract.requestWeather(city);
      setStatus('Transaction sent, waiting for confirmation...');
      await tx.wait();
      setStatus('Weather request submitted successfully. Check subgraph for updates.');
      setCity('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Request failed.');
      setStatus('');
    }
  };

  return (
    <div style={{ margin: '24px 0', padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
      <h2>Request Weather</h2>
      <form onSubmit={requestWeather}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name"
          style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 16px', fontSize: 16 }} disabled={!city}>
          Request Weather
        </button>
      </form>
      {status && <p style={{ color: '#0a6', marginTop: 12 }}>{status}</p>}
      {error && <p style={{ color: '#c00', marginTop: 12 }}>{error}</p>}
    </div>
  );
}
