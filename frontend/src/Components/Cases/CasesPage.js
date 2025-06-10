import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdVisibility, MdEdit, MdArchive } from 'react-icons/md';

const CasesPage = () => {
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState({
    locationCountry: '',
    locationRegion: '',
    violationType: '',
    status: '',
    priority: '',
    searchTerm: '', 
    dateOccurred: '', 
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFilters({
      locationCountry: params.get('location_country') || '',
      locationRegion: params.get('location_region') || '',
      violationType: params.get('violation_type') || '',
      status: params.get('status') || '',
      priority: params.get('priority') || '',
      searchTerm: params.get('search_term') || '', 
      dateOccurred: params.get('date_occurred') || '', 
    });
  }, [location.search]);

  const fetchCases = async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (filters.locationCountry) params.append('location_country', filters.locationCountry);
    if (filters.locationRegion) params.append('location_region', filters.locationRegion);
    if (filters.violationType) params.append('violation_type', filters.violationType);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.searchTerm) params.append('search_term', filters.searchTerm); 
    if (filters.dateOccurred) params.append('date_occurred', filters.dateOccurred); 

    try {
      const res = await api.get(`/cases/?${params.toString()}`);
      // This line is important for flexibility in case the backend sends a JSON string
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setCases(data);
    } catch (err) {
      console.error('❌ Error fetching cases:', err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filters]); 

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.locationCountry) params.set('location_country', filters.locationCountry);
    if (filters.locationRegion) params.set('location_region', filters.locationRegion);
    if (filters.violationType) params.set('violation_type', filters.violationType);
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.searchTerm) params.set('search_term', filters.searchTerm); 
    if (filters.dateOccurred) params.set('date_occurred', filters.dateOccurred); 

    navigate(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      locationCountry: '',
      locationRegion: '',
      violationType: '',
      status: '',
      priority: '',
      searchTerm: '', 
      dateOccurred: '', 
    });
    navigate(''); 
  };

  const archiveCase = async (caseId) => {
    const confirm = window.confirm("Are you sure you want to archive this case?");
    if (!confirm) return;

    try {
      await api.patch(`/cases/${caseId}`, { status: "archived" });
      alert("✅ Case archived successfully!");
      fetchCases(); 
    } catch (err) {
      console.error(err);
      alert("❌ Failed to archive case");
    }
  };

  // --- CSS Styles ---
  const thStyle = {
    padding: '14px',
    textAlign: 'left',
    // ... (rest of your thStyle remains the same)
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
    blue: { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
    yellow: { backgroundColor: 'rgba(255, 193, 7, 0.1)' },
    red: { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  };

  const filterInputStyle = {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    marginRight: '10px',
    width: '180px',
    boxSizing: 'border-box',
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

  return (
    <div style={{ padding: '3rem', backgroundColor: '#fffbe6', minHeight: '100vh', position: 'relative' }}>
      <h2 style={{ fontSize: '32px', marginBottom: '1.5rem', color: '#e65100' }}>
        📋 All Cases
      </h2>

      <button
        style={{
          ...primaryButtonStyle,
          position: 'absolute',
          top: '3rem',
          right: '3rem',
          marginBottom: '0',
          zIndex: '10',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#ffa726')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#ff9800')}
        onClick={() => navigate('/admin/cases/new')}
      >
        ➕ Add New Case
      </button>

      {/* Filter and Search Fields - Enhanced Layout */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* First Row of Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', marginBottom: '10px' }}>
          <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>Search Title/Desc:</label>
            <input
              type="text"
              name="searchTerm"
              placeholder="Search title or description"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }}
              style={filterInputStyle}
            />
          </div>

          <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>Country:</label>
            <input
              type="text"
              name="locationCountry"
              placeholder="Country"
              value={filters.locationCountry}
              onChange={handleFilterChange}
              onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }}
              style={filterInputStyle}
            />
          </div>

          {/* Date Occurred - Moved here */}
          <div style={{ flex: '1 1 auto', minWidth: '180px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>Date Occurred:</label>
            <input
              type="date"
              name="dateOccurred"
              value={filters.dateOccurred}
              onChange={handleFilterChange}
              onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }}
              style={filterInputStyle}
            />
          </div>

          <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>Region:</label>
            <input
              type="text"
              name="locationRegion"
              placeholder="Region"
              value={filters.locationRegion}
              onChange={handleFilterChange}
              onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }}
              style={filterInputStyle}
            />
          </div>
        </div>

        {/* Second Row of Filters (Status, Priority, Violation Type) and Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 auto', minWidth: '180px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>Violation Type:</label>
            <input
              type="text"
              name="violationType"
              placeholder="Violation Type"
              value={filters.violationType}
              onChange={handleFilterChange}
              onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }}
              style={filterInputStyle}
            />
          </div>

          <div style={{ flex: '1 1 auto', minWidth: '120px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>Status:</label>
            <input
              type="text"
              name="status"
              placeholder="Status"
              value={filters.status}
              onChange={handleFilterChange}
              onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }}
              style={filterInputStyle}
            />
          </div>

          <div style={{ flex: '1 1 auto', minWidth: '120px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>Priority:</label>
            <input
              type="text"
              name="priority"
              placeholder="Priority"
              value={filters.priority}
              onChange={handleFilterChange}
              onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }}
              style={filterInputStyle}
            />
          </div>

          <button
            onClick={applyFilters}
            style={{
              ...primaryButtonStyle,
              padding: '8px 16px',
              minWidth: 'unset',
              alignSelf: 'flex-end',
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#ffa726')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#ff9800')}
          >
            🔍 Apply Filters
          </button>
          <button
            onClick={clearFilters}
            style={{
              ...clearButtonStyle,
              minWidth: 'unset',
              alignSelf: 'flex-end',
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#FF5252')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#ef5350')}
          >
            Clear Filters
          </button>
        </div>
      </div> {/* End of Filter and Search Fields */}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#555' }}>Loading cases...</p>
      ) : (
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
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Violation Types</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Date Occurred</th>
                <th style={{ ...thStyle, minWidth: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(cases) && cases.length > 0 ? (
                cases.map((c, index) => (
                  <tr key={c.case_id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#fffbe6' }}>
                    {/* Displaying English value directly as per backend changes */}
                    <td style={tdStyle}>{c.title || '—'}</td>
                    
                    <td style={tdStyle}>{c.status || '—'}</td>
                    <td style={tdStyle}>
                      {Array.isArray(c.violation_types)
                        ? c.violation_types.join(', ') || '—'
                        : '—'}
                    </td>
                    <td style={tdStyle}>{c.priority || '—'}</td>
                    
                    <td style={tdStyle}>
                      {c.date_occurred ? new Date(c.date_occurred).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button
                        style={{ ...iconBtn, color: '#2196f3' }}
                        title="View"
                        onClick={() => navigate(`/admin/cases/${c.case_id}`)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = iconBtnHover.blue.backgroundColor}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MdVisibility />
                      </button>
                      <button
                        style={{ ...iconBtn, color: '#ffc107' }}
                        title="Edit"
                        onClick={() => navigate(`/admin/cases/${c.case_id}/edit`)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = iconBtnHover.yellow.backgroundColor}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MdEdit />
                      </button>
                      <button
                        style={{ ...iconBtn, color: '#f44336' }}
                        title="Archive"
                        onClick={() => archiveCase(c.case_id)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = iconBtnHover.red.backgroundColor}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MdArchive />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#a1887f',
                    fontSize: '16px',
                    backgroundColor: '#fff8e1'
                  }}>
                    😕 No cases available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CasesPage;