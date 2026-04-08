import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_WEATHER_REPORTS = gql`
  query GetWeatherReports {
    weatherReports(first: 20, orderBy: timestamp, orderDirection: desc) {
      id
      city
      temperature
      description
      timestamp
      requester
    }
  }
`;

export default function WeatherReportsList({ client }) {
  const { loading, error, data } = useQuery(GET_WEATHER_REPORTS, { client });

  if (loading) return <p>Loading historical weather reports...</p>;
  if (error) return <p style={{ color: 'red' }}>GraphQL error: {error.message}</p>;

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Historical Weather Reports</h2>
      {data.weatherReports.length === 0 ? (
        <p>No weather reports indexed yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {data.weatherReports.map((report) => (
            <div key={report.id} style={{ padding: 16, border: '1px solid #e0e0e0', borderRadius: 12 }}>
              <h3>{report.city}</h3>
              <p><strong>Temperature:</strong> {report.temperature}°</p>
              <p><strong>Description:</strong> {report.description}</p>
              <p><strong>Requester:</strong> {report.requester}</p>
              <p><strong>Timestamp:</strong> {new Date(Number(report.timestamp) * 1000).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
