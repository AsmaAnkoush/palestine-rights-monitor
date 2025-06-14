import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const UpdateCasePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/cases/${id}`)
      .then(res => {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

        if (data.location === null || data.location === undefined) {
            data.location = {};
        }

        if (Array.isArray(data.violation_types)) {
            data.violation_types = data.violation_types.map(v =>
                typeof v === 'object' && v !== null && v.hasOwnProperty('en') ? v.en : String(v || '')
            );
        }

        setCaseData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching case:', err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCaseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (parent, key, value) => {
    setCaseData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [key]: value
      }
    }));
  };

  const handleArrayChange = (field, index, value) => {
    const currentArray = caseData[field] ? [...caseData[field]] : [];
    currentArray[index] = value;
    setCaseData(prev => ({ ...prev, [field]: currentArray }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSend = JSON.parse(JSON.stringify(caseData));

    if (Array.isArray(dataToSend.violation_types)) {
        dataToSend.violation_types = dataToSend.violation_types.map(v => {
            if (typeof v === 'object' && v !== null && v.hasOwnProperty('en')) {
                return v.en;
            }
            return String(v || '');
        });
    }

    if (dataToSend.date_occurred !== undefined) {
        delete dataToSend.date_occurred;
    }

    api.put(`/cases/${id}`, dataToSend)
      .then(() => {
        alert('✅ Case updated successfully!');
        navigate(`/admin/cases/${id}`);
      })
      .catch(err => {
        console.error('❌ Error updating case:', err);
        let errorMessage = 'Failed to update case.';
        if (err.response && err.response.data) {
          if (err.response.data.detail) {
            errorMessage += '\nDetails: ' + JSON.stringify(err.response.data.detail, null, 2);
          } else if (typeof err.response.data === 'string') {
            errorMessage += '\nServer response: ' + err.response.data;
          }
        }
        alert(errorMessage);
      });
  };

  if (loading || !caseData) return <p style={{ padding: '2rem', color: '#555' }}>Loading...</p>;

  const baseFontStack = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

  const pageContainerStyle = {
    padding: '3rem',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontFamily: baseFontStack,
  };

  const formCardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
    maxWidth: '750px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  };

  const headingStyle = {
    fontSize: '2.2rem',
    marginBottom: '1.5rem',
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  };

  const subHeadingStyle = {
    fontSize: '20px',
    marginBottom: '16px',
    borderBottom: '2px solid #f1f1f1',
    paddingBottom: '8px',
    color: '#1e293b',
  };

  const formGroupStyle = {
    marginBottom: '0.75rem',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#111827',
    fontSize: '0.9rem',
    letterSpacing: '0.01em',
  };

  const inputBaseStyle = {
    width: '100%',
    padding: '0.9rem 1.2rem',
    border: '1px solid #ced4da',
    borderRadius: '8px',
    fontSize: '1rem',
    color: '#374151',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
    ':focus': {
        borderColor: '#ff9800',
        boxShadow: '0 0 0 0.2rem rgba(255, 152, 0, 0.25)',
        outline: 'none',
    }
  };

  const disabledInputStyle = {
    ...inputBaseStyle,
    backgroundColor: '#e9ecef',
    color: '#6c757d',
    cursor: 'not-allowed',
    borderColor: '#dee2e6',
  };

  const violationInputStyle = {
    ...inputBaseStyle,
    marginBottom: '0.6rem',
  };

  const submitButtonStyle = {
    padding: '1rem 2rem',
    backgroundColor: '#ff9800',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem',
    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.25)',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    ':hover': {
      backgroundColor: '#f57c00',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 15px rgba(255, 152, 0, 0.35)',
    },
    ':active': {
        transform: 'translateY(0)',
    }
  };

  return (
    <div style={pageContainerStyle}>
      <form onSubmit={handleSubmit} style={formCardStyle}>
        <h1 style={headingStyle}>
          <span role="img" aria-label="pencil">✏️</span> Edit Case Details
        </h1>

        <h3 style={subHeadingStyle}>📝 General Information</h3>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Case ID (Read-only):</label>
          <input type="text" value={caseData.case_id || ''} disabled style={disabledInputStyle} />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Title:</label>
          <input
            type="text"
            name="title"
            value={caseData.title || ''}
            onChange={handleChange}
            style={inputBaseStyle}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Description:</label>
          <textarea
            name="description"
            value={caseData.description || ''}
            onChange={handleChange}
            rows={4}
            style={inputBaseStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', ...formGroupStyle }}>
          <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
            <label style={labelStyle}>Status:</label>
            <input type="text" name="status" value={caseData.status || ''} onChange={handleChange} style={inputBaseStyle} />
          </div>
          <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
            <label style={labelStyle}>Priority:</label>
            <input type="text" name="priority" value={caseData.priority || ''} onChange={handleChange} style={inputBaseStyle} />
          </div>
        </div>

        <h3 style={subHeadingStyle}>📌 Location Details</h3>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', ...formGroupStyle }}>
          <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
            <label style={labelStyle}>Location - Country:</label>
            <input type="text" value={caseData.location?.country || ''} onChange={(e) => handleNestedChange('location', 'country', e.target.value)} style={inputBaseStyle} />
          </div>
          <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
            <label style={labelStyle}>Location - Region:</label>
            <input type="text" value={caseData.location?.region || ''} onChange={(e) => handleNestedChange('location', 'region', e.target.value)} style={inputBaseStyle} />
          </div>
        </div>

        <h3 style={subHeadingStyle}>⚖️ Violation Information</h3>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Violation Types:</label>
          {Array.isArray(caseData.violation_types) && caseData.violation_types.length > 0 ? (
            caseData.violation_types.map((v, i) => (
              <input
                key={i}
                type="text"
                value={v || ''}
                onChange={(e) => handleArrayChange('violation_types', i, e.target.value)}
                style={violationInputStyle}
              />
            ))
          ) : (
            <p style={{ color: '#888', fontSize: '0.9rem', paddingLeft: '0.5rem', marginTop: '0.5rem' }}>No violation types found.</p>
          )}
        </div>

        <button type="submit" style={submitButtonStyle}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default UpdateCasePage;
