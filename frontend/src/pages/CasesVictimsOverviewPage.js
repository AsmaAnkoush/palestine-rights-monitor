// src/pages/CasesVictimsOverviewPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaFolderOpen, FaSpinner, FaExclamationCircle } from 'react-icons/fa'; // تم حذف FaEye

const CasesVictimsOverviewPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8006'; // Your FastAPI backend URL

  useEffect(() => {
    const fetchCasesAndVictims = async () => {
      setLoading(true);
      setError(null);
      try {
        const casesResponse = await fetch(`${API_BASE_URL}/cases`);
        if (!casesResponse.ok) {
          throw new Error('Failed to fetch cases');
        }
        let casesData = await casesResponse.json();
        setCases(casesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCasesAndVictims();
  }, []);

  // --- Styles (simplified for brevity, adopt your existing styles) ---
  const containerStyle = {
    padding: '3rem',
    backgroundColor: '#fffbe6',
    minHeight: 'calc(100vh - 6rem)',
    fontFamily: 'Arial, sans-serif',
  };

  const headerStyle = {
    fontSize: '32px',
    marginBottom: '1.5rem',
    color: '#e65100',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  };

  const tableContainerStyle = {
    backgroundColor: '#fff3e0',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '1200px',
    margin: 'auto',
    overflowX: 'auto',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  const thStyle = {
    padding: '14px',
    textAlign: 'left',
    borderBottom: '2px solid #ffe0b2',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e65100',
    backgroundColor: '#fff3e0',
  };

  const tdStyle = {
    padding: '12px 14px',
    borderBottom: '1px solid #ffe0b2',
    fontSize: '14px',
    color: '#4e342e',
  };

  const messageStyle = (type) => ({
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: type === 'error' ? '#c62828' : '#616161',
    backgroundColor: type === 'error' ? '#ffebee' : '#f5f5f5',
    border: `1px solid ${type === 'error' ? '#ef5350' : '#e0e0e0'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  });

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>
        <FaFolderOpen style={{ marginRight: '10px' }} /> Cases & Linked Individuals Overview
      </h1>

      <div style={tableContainerStyle}>
        {loading && (
          <div style={messageStyle('info')}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> Loading cases and individuals...
          </div>
        )}

        {error && (
          <div style={messageStyle('error')}>
            <FaExclamationCircle /> Error: {error}
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div style={messageStyle('info')}>
            No cases found.
          </div>
        )}

        {!loading && !error && cases.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Case ID</th>
                <th style={thStyle}>Case Title</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr key={caseItem.id}>
                  <td style={tdStyle}>{caseItem.case_id}</td>
                  <td style={tdStyle}>{caseItem.title}</td>
                  <td style={tdStyle}>{caseItem.status}</td>
                  <td style={tdStyle}>
                    {/* ✅ تم إزالة زر "View Case Details" من هنا */}
                    <Link
                      to={`/admin/victims/case/${caseItem.case_id}`}
                      title="View Linked Individuals"
                      style={{ color: '#007bff' }} // تأكد من اللون ليظهر بشكل جيد
                    >
                      <FaUsers />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CasesVictimsOverviewPage;