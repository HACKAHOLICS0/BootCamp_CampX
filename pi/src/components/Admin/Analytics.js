import React from 'react';
import './AdminStyle.css'
const Analytics = () => (
  <div className="content-section">
    <h2>Analytics Overview</h2>
    <div className="analytics-container">
      <div className="chart-placeholder">
        <h3>Revenue Chart</h3>
        <div className="mock-chart"></div>
      </div>
      <div className="chart-placeholder">
        <h3>User Growth</h3>
        <div className="mock-chart"></div>
      </div>
    </div>
  </div>
);

export default Analytics;