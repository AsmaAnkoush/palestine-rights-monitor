import React, { useState, useEffect } from 'react';
import { FaEdit, FaRedoAlt, FaChartBar } from 'react-icons/fa'; // Added FaChartBar for analytics icon

const IncidentReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    incidentDate: '',
    location: '',
  });
  const [editingReportId, setEditingReportId] = useState(null);

  // New states for analytics data
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);


  const limit = 10;

  const API_BASE_URL = 'http://localhost:8003';

  // --- CSS Styles consistent with CasesPage ---
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
    padding: '14px',
    borderBottom: '1px solid #ffe0b2',
    fontSize: '14px',
    color: '#4e342e',
  };

  const iconBtn = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    marginRight: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease-in-out',
  };

  const iconBtnHover = {
    yellow: { backgroundColor: 'rgba(255, 193, 7, 0.1)' },
    orange: { backgroundColor: 'rgba(255, 152, 0, 0.1)' },
  };

  const filterInputStyle = {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    width: '100%',
    boxSizing: 'border-box',
    color: '#4e342e',
  };

  const primaryButtonStyle = {
    padding: '10px 18px',
    backgroundColor: '#ff9800',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'background-color 0.3s ease',
  };

  const clearButtonStyle = {
    ...primaryButtonStyle,
    backgroundColor: '#ef5350',
    padding: '8px 16px',
  };
  // --- End of CSS Styles ---

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.incidentDate) queryParams.append('incident_date', filters.incidentDate);
      if (filters.location) queryParams.append('location', filters.location);
      queryParams.append('limit', limit);

      const response = await fetch(`${API_BASE_URL}/reports/?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch reports');
      }
      const data = await response.json();
      setReports(data.reports);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/analytics`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalyticsData(data.analytics);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  useEffect(() => {
    fetchAnalytics(); // Fetch analytics data on component mount
  }, []); // Empty dependency array means this runs once on mount

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      incidentDate: '',
      location: '',
    });
  };

  const handleEditStatus = async (reportId, newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update report status');
      }

      setReports(prevReports =>
        prevReports.map(report =>
          report.report_id === reportId ? { ...report, status: newStatus } : report
        )
      );
      setEditingReportId(null);
    } catch (err) {
      console.error("Error updating report status:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem', backgroundColor: '#fffbe6', minHeight: '100vh', position: 'relative' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '1.5rem', color: '#e65100', textAlign: 'center' }}>
        📋 Incident Reports Dashboard
      </h1>

      {/* Analytics Section */}
      <div style={{ marginBottom: '2rem', backgroundColor: '#fff8e1', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #ffe0b2' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '1rem', color: '#e65100', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FaChartBar style={{ fontSize: '1.2em' }} /> Reports Analytics by Violation Type
        </h2>
        {analyticsLoading ? (
          <p style={{ textAlign: 'center', color: '#555' }}>Loading analytics...</p>
        ) : analyticsError ? (
          <p style={{ textAlign: 'center', color: '#f44336' }}>Error fetching analytics: {analyticsError}</p>
        ) : analyticsData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a1887f' }}>No analytics data available.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
            {analyticsData.map((item, index) => (
              <div key={index} style={{
                backgroundColor: '#ffecb3', // Lighter orange for analytics cards
                padding: '15px 20px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minWidth: '200px',
                textAlign: 'center',
                border: '1px solid #ffcc80',
                flexGrow: 1,
                maxWidth: 'calc(33% - 10px)', // Adjust as needed for responsiveness
              }}>
                <p style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#e65100', marginBottom: '5px' }}>
                  {item.violation_type.replace(/_/g, ' ')}
                </p>
                <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#ff9800' }}>
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Section - Enhanced Layout & Styling */}
      <div style={{ marginBottom: '1.5rem', backgroundColor: '#fff3e0', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginBottom: '10px' }}>
          <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <label htmlFor="status" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#e65100' }}>Status:</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={filterInputStyle}
            >
              <option value="">All</option>
              <option value="pending_review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Under Review">Under Review</option>
            </select>
          </div>
          <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
            <label htmlFor="incidentDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#e65100' }}>Incident Date:</label>
            <input
              type="date"
              id="incidentDate"
              name="incidentDate"
              value={filters.incidentDate}
              onChange={handleFilterChange}
              style={filterInputStyle}
            />
          </div>
          <div style={{ flex: '1 1 250px', minWidth: '200px' }}>
            <label htmlFor="location" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#e65100' }}>Location Address:</label>
            <input
              type="text"
              id="location"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="e.g., الخليل or Palestine"
              style={filterInputStyle}
            />
          </div>
          <button
            onClick={handleClearFilters}
            style={{
              ...clearButtonStyle,
              alignSelf: 'flex-end',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FF5252')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef5350')}
          >
            <FaRedoAlt style={{ fontSize: '1.2em' }} /> Clear Filters
          </button>
        </div>
      </div>

      {/* Loading, Error, and No Reports States */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#555' }}>Loading reports...</p>
      ) : error ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#f44336', fontWeight: 'bold' }}>Error: {error}</p>
      ) : reports.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#a1887f', fontSize: '16px', backgroundColor: '#fff8e1', borderRadius: '12px' }}>
          😕 No reports found matching your criteria.
        </p>
      ) : (
        <>
          {/* Reports Table - Enhanced Design */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <thead>
                <tr>
                  <th style={thStyle}>Report ID</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Incident Date</th>
                  <th style={thStyle}>Location Address</th>
                  <th style={thStyle}>Reporter Type</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Related Case</th>
                  <th style={{ ...thStyle, textAlign: 'center', minWidth: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={report.report_id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#fffbe6' }}>
                    <td style={tdStyle}>{report.report_id}</td>
                    <td style={tdStyle}>
                      {editingReportId === report.report_id ? (
                        <select
                          value={report.status}
                          onChange={(e) => handleEditStatus(report.report_id, e.target.value)}
                          style={{
                            padding: '5px',
                            borderRadius: '5px',
                            border: '1px solid #ff9800',
                            backgroundColor: '#fffbe6',
                            color: '#4e342e',
                            fontWeight: '600'
                          }}
                        >
                          <option value="pending_review">Pending Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Under Review">Under Review</option>
                        </select>
                      ) : (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75em',
                          fontWeight: '600',
                          color: report.status === 'Approved' ? '#2e7d32' :
                                  report.status === 'pending_review' ? '#f57f17' :
                                  report.status === 'Rejected' ? '#c62828' :
                                  report.status === 'Under Review' ? '#1565c0' : '#4e342e',
                          backgroundColor: report.status === 'Approved' ? '#e8f5e9' :
                                            report.status === 'pending_review' ? '#fffde7' :
                                            report.status === 'Rejected' ? '#ffebee' :
                                            report.status === 'Under Review' ? '#e3f2fd' : '#f5f5f5',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {report.incident_details?.date ? new Date(report.incident_details.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={tdStyle}>
                      {report.incident_details?.location?.address || 'N/A'}
                    </td>
                    <td style={tdStyle}>{report.reporter_type}</td>
                    <td style={tdStyle}>{report.priority}</td>
                    <td style={tdStyle}>
                      {report.related_case_id || 'N/A'}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {editingReportId === report.report_id ? (
                        <button
                          style={{ ...iconBtn, color: '#2e7d32', marginRight: '0' }}
                          title="Cancel Edit"
                          onClick={() => setEditingReportId(null)}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(46, 125, 50, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          style={{ ...iconBtn, color: '#ffc107', marginRight: '0' }}
                          title="Edit Report Status"
                          onClick={() => setEditingReportId(report.report_id)}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = iconBtnHover.yellow.backgroundColor}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <FaEdit />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default IncidentReportsPage;
