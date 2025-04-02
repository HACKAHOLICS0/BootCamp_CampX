import React from 'react';

const Analytics = () => {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100%', 
      padding: '20px'
    }}>
      <object
        data="/assets/CAMPXDashboard.pdf"
        type="application/pdf"
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#f5f5f5'
        }}
      >
        <p>It appears you don't have a PDF plugin for this browser.
          You can <a href="/assets/CAMPXDashboard.pdf" download>click here to download the PDF file.</a>
        </p>
      </object>
    </div>
  );
};

export default Analytics;
