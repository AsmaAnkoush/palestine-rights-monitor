import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaSave, FaTimesCircle, FaEye, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const VictimsPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: 'victim',
    anonymous: false,
    pseudonym: '',
    first_name: '',
    last_name: '',
    demographics: {
      gender: '',
      age: '',
      ethnicity: '',
      occupation: '',
    },
    contact_info: {
      email: '',
      phone: '',
      secure_messaging: '',
    },
    cases_involved: [],
    risk_assessment: {
      level: 'low',
      threats: [],
      protection_needed: false,
    },
    support_services: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [casesList, setCasesList] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState(null);

  const [individuals, setIndividuals] = useState([]);
  const [individualsLoading, setIndividualsLoading] = useState(true);
  const [individualsError, setIndividualsError] = useState(null);
  const [editingRiskLevelId, setEditingRiskLevelId] = useState(null);
  const [currentRiskLevel, setCurrentRiskLevel] = useState('');

  const API_BASE_URL = 'http://localhost:8006';

  // --- Styles (remain the same) ---
  const formContainerStyle = {
    backgroundColor: '#fff3e0',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '800px',
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #ffe0b2',
    marginBottom: '30px',
  };

  const formGroupStyle = {
    marginBottom: '15px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '0.95em',
    color: '#e65100',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ffcc80',
    borderRadius: '8px',
    fontSize: '1em',
    color: '#4e342e',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23e65100'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1.2em',
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    color: '#4e342e',
  };

  const checkboxStyle = {
    marginRight: '10px',
    width: '18px',
    height: '18px',
    accentColor: '#ff9800',
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '30px',
  };

  const primaryButtonStyle = {
    padding: '12px 25px',
    backgroundColor: '#ff9800',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const secondaryButtonStyle = {
    ...primaryButtonStyle,
    backgroundColor: '#bdbdbd',
    color: '#333',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const messageStyle = (type) => ({
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: type === 'success' ? '#2e7d32' : '#c62828',
    backgroundColor: type === 'success' ? '#e8f5e9' : '#ffebee',
    border: `1px solid ${type === 'success' ? '#4caf50' : '#ef5350'}`,
  });

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  };

  const thTableStyle = {
    padding: '14px',
    textAlign: 'left',
    borderBottom: '2px solid #ffe0b2',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e65100',
    backgroundColor: '#fff3e0',
  };

  const tdTableStyle = {
    padding: '14px',
    borderBottom: '1px solid #ffe0b2',
    fontSize: '14px',
    color: '#4e342e',
  };

  const actionButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2em',
    margin: '0 5px',
    color: '#ff9800',
    transition: 'color 0.2s ease',
  };
  // --- End Styles ---

  const fetchCases = async () => {
    setCasesLoading(true);
    setCasesError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/cases/titles`);
      if (!response.ok) {
        throw new Error('Failed to fetch cases titles');
      }
      const data = await response.json();
      setCasesList(data);
    } catch (err) {
      console.error("Error fetching cases:", err);
      setCasesError(err.message);
    } finally {
      setCasesLoading(false);
    }
  };

  const fetchIndividuals = async () => {
    setIndividualsLoading(true);
    setIndividualsError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/victims/`);
      if (!response.ok) {
        throw new Error('Failed to fetch individuals');
      }
      const data = await response.json();
      setIndividuals(data);
    } catch (err) {
      console.error("Error fetching individuals:", err);
      setIndividualsError(err.message);
    } finally {
      setIndividualsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchIndividuals();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    const [mainField, subField] = name.split('.');

    setFormData(prev => {
      let newState = { ...prev };

      if (mainField === 'demographics' || mainField === 'contact_info' || mainField === 'risk_assessment' || mainField === 'support_services') {
        newState[mainField] = {
          ...prev[mainField],
          [subField]: type === 'checkbox' ? checked : value,
        };
      } else if (name === 'cases_involved') {
        const selectedValues = Array.from(options)
          .filter(option => option.selected)
          .map(option => option.value);
        newState.cases_involved = selectedValues;
      } else if (name === 'threats_input') {
        newState.risk_assessment = {
          ...prev.risk_assessment,
          threats: value.split(',').map(item => item.trim()).filter(item => item !== ''),
        };
      } else if (name === 'anonymous') {
        newState.anonymous = checked;
        if (checked) {
          newState.first_name = '';
          newState.last_name = '';
          newState.demographics = { gender: '', age: '', ethnicity: '', occupation: '' };
          newState.contact_info = { email: '', phone: '', secure_messaging: '' };
        } else {
          newState.pseudonym = '';
        }
      } else if (name === 'type') {
        newState.type = value;
      } else {
        newState[name] = type === 'checkbox' ? checked : value;
      }
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const dataToSend = { ...formData };

      if (!dataToSend.anonymous) {
        if (!dataToSend.first_name || !dataToSend.last_name) {
          throw new Error("First name and last name are required for non-anonymous individuals.");
        }
        dataToSend.pseudonym = undefined;
      } else {
        if (!dataToSend.pseudonym) {
          throw new Error("Pseudonym is required for anonymous individuals.");
        }
        dataToSend.first_name = undefined;
        dataToSend.last_name = undefined;
        dataToSend.demographics = undefined;
        dataToSend.contact_info = undefined;
      }

      if (dataToSend.demographics && dataToSend.demographics.age) {
        dataToSend.demographics.age = parseInt(dataToSend.demographics.age, 10);
      }

      if (
        dataToSend.demographics &&
        Object.values(dataToSend.demographics).every(val => val === '' || val === null || val === undefined)
      ) {
        dataToSend.demographics = undefined;
      }

      if (
        dataToSend.contact_info &&
        Object.values(dataToSend.contact_info).every(val => val === '' || val === null || val === undefined)
      ) {
        dataToSend.contact_info = undefined;
      }

      // --- REMOVE THESE LINES ---
      // const token = localStorage.getItem("jwt_token");
      // if (!token) {
      //   throw new Error("Authentication token not found. Please log in.");
      // }
      // --- END REMOVAL ---

      const response = await fetch(`${API_BASE_URL}/victims/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`, // REMOVE THIS LINE TOO
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();

        let message = 'Failed to add individual';

        if (Array.isArray(errorData.detail)) {
          message = errorData.detail.map(e => {
            const field = e.loc ? e.loc.join('.') : 'field';
            return `${field}: ${e.msg}`;
          }).join(', ');
        } else if (typeof errorData.detail === 'object') {
          message = JSON.stringify(errorData.detail);
        } else if (typeof errorData.detail === 'string') {
          message = errorData.detail;
        }

        throw new Error(message);
      }

      const result = await response.json();
      setMessage(`✅ Individual added successfully! ID: ${result.id}`);
      setMessageType('success');
      setFormData({
        type: 'victim',
        anonymous: false,
        pseudonym: '',
        first_name: '',
        last_name: '',
        demographics: { gender: '', age: '', ethnicity: '', occupation: '' },
        contact_info: { email: '', phone: '', secure_messaging: '' },
        cases_involved: [],
        risk_assessment: { level: 'low', threats: [], protection_needed: false },
        support_services: [],
      });
      fetchIndividuals();
    } catch (err) {
      console.error("Error adding individual:", err);
      setMessage(`❌ Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      type: 'victim',
      anonymous: false,
      pseudonym: '',
      first_name: '',
      last_name: '',
      demographics: { gender: '', age: '', ethnicity: '', occupation: '' },
      contact_info: { email: '', phone: '', secure_messaging: '' },
      cases_involved: [],
      risk_assessment: { level: 'low', threats: [], protection_needed: false },
      support_services: [],
    });
    setMessage('');
    setMessageType('');
  };

  const handleEditRiskLevelClick = (individualId, currentLevel) => {
    setEditingRiskLevelId(individualId);
    setCurrentRiskLevel(currentLevel);
  };

  const handleSaveRiskLevel = async (individualId) => {
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      // --- REMOVE THESE LINES ---
      // const token = localStorage.getItem("jwt_token");
      // if (!token) {
      //   throw new Error("Authentication token not found. Please log in.");
      // }
      // --- END REMOVAL ---

      const response = await fetch(`${API_BASE_URL}/victims/${individualId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`, // REMOVE THIS LINE TOO
        },
        body: JSON.stringify({ risk_assessment: { level: currentRiskLevel } }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to update risk level';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(e => e.msg).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        }
        throw new Error(errorMessage);
      }

      setMessage(`✅ Risk level for individual ${individualId.substring(0, 8)}... updated successfully!`);
      setMessageType('success');
      setEditingRiskLevelId(null);
      fetchIndividuals();
    } catch (err) {
      console.error("Error updating risk level:", err);
      setMessage(`❌ Error updating risk level: ${err.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRiskLevelEdit = () => {
    setEditingRiskLevelId(null);
    setCurrentRiskLevel('');
  };

  return (
    <div style={{ padding: '3rem', backgroundColor: '#fffbe6', minHeight: '100vh', position: 'relative' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '1.5rem', color: '#e65100', textAlign: 'center' }}>
        <FaUserPlus style={{ marginRight: '10px', fontSize: '1.2em' }} /> Add New Individual
      </h1>

      {/* Form Section */}
      <div style={formContainerStyle}>
        {message && <div style={messageStyle(messageType)}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div style={formGroupStyle}>
              <label htmlFor="type" style={labelStyle}>Individual Type:</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={selectStyle}
                required
              >
                <option value="victim">Victim</option>
                <option value="witness">Witness</option>
              </select>
            </div>

            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                id="anonymous"
                name="anonymous"
                checked={formData.anonymous}
                onChange={handleChange}
                style={checkboxStyle}
              />
              <label htmlFor="anonymous" style={{ ...labelStyle, marginBottom: '0', fontWeight: 'normal' }}>
                Mark as Anonymous
              </label>
            </div>

            {formData.anonymous ? (
              <div style={formGroupStyle}>
                <label htmlFor="pseudonym" style={labelStyle}>Pseudonym:</label>
                <input
                  type="text"
                  id="pseudonym"
                  name="pseudonym"
                  value={formData.pseudonym}
                  onChange={handleChange}
                  placeholder="Enter a pseudonym"
                  style={inputStyle}
                  required
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={formGroupStyle}>
                  <label htmlFor="first_name" style={labelStyle}>First Name:</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={formGroupStyle}>
                  <label htmlFor="last_name" style={labelStyle}>Last Name:</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
            )}

            <div style={{ ...formGroupStyle, border: '1px dashed #ffcc80', padding: '15px', borderRadius: '10px', opacity: formData.anonymous ? 0.6 : 1 }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Demographics (Sensitive - consider encryption):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="demographics.gender" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Gender:</label>
                  <input
                    type="text"
                    id="demographics.gender"
                    name="demographics.gender"
                    value={formData.demographics.gender}
                    onChange={handleChange}
                    placeholder="e.g., female"
                    style={inputStyle}
                    disabled={formData.anonymous}
                  />
                </div>
                <div>
                  <label htmlFor="demographics.age" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Age:</label>
                  <input
                    type="number"
                    id="demographics.age"
                    name="demographics.age"
                    value={formData.demographics.age}
                    onChange={handleChange}
                    placeholder="e.g., 34"
                    style={inputStyle}
                    disabled={formData.anonymous}
                  />
                </div>
                <div>
                  <label htmlFor="demographics.ethnicity" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Ethnicity:</label>
                  <input
                    type="text"
                    id="demographics.ethnicity"
                    name="demographics.ethnicity"
                    value={formData.demographics.ethnicity}
                    onChange={handleChange}
                    placeholder="e.g., Kurdish"
                    style={inputStyle}
                    disabled={formData.anonymous}
                  />
                </div>
                <div>
                  <label htmlFor="demographics.occupation" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Occupation:</label>
                  <input
                    type="text"
                    id="demographics.occupation"
                    name="demographics.occupation"
                    value={formData.demographics.occupation}
                    onChange={handleChange}
                    placeholder="e.g., teacher"
                    style={inputStyle}
                    disabled={formData.anonymous}
                  />
                </div>
              </div>
            </div>

            <div style={{ ...formGroupStyle, border: '1px dashed #ffcc80', padding: '15px', borderRadius: '10px', opacity: formData.anonymous ? 0.6 : 1 }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Contact Information (Sensitive - consider encryption):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="contact_info.email" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Email:</label>
                  <input
                    type="email"
                    id="contact_info.email"
                    name="contact_info.email"
                    value={formData.contact_info.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    style={inputStyle}
                    disabled={formData.anonymous}
                  />
                </div>
                <div>
                  <label htmlFor="contact_info.phone" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Phone:</label>
                  <input
                    type="tel"
                    id="contact_info.phone"
                    name="contact_info.phone"
                    value={formData.contact_info.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    style={inputStyle}
                    disabled={formData.anonymous}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="contact_info.secure_messaging" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Secure Messaging:</label>
                  <input
                    type="text"
                    id="contact_info.secure_messaging"
                    name="contact_info.secure_messaging"
                    value={formData.contact_info.secure_messaging}
                    onChange={handleChange}
                    placeholder="e.g., Signal, WhatsApp"
                    style={inputStyle}
                    disabled={formData.anonymous}
                  />
                </div>
              </div>
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="cases_involved" style={labelStyle}>Cases Involved:</label>
              <select
                id="cases_involved"
                name="cases_involved"
                multiple
                value={formData.cases_involved}
                onChange={handleChange}
                style={{ ...selectStyle, height: 'auto', minHeight: '100px' }}
                disabled={casesLoading || casesError}
              >
                {casesLoading ? (
                  <option disabled>Loading cases...</option>
                ) : casesError ? (
                  <option disabled>Error loading cases: {casesError}</option>
                ) : casesList.length === 0 ? (
                  <option disabled>No cases available</option>
                ) : (
                  casesList.map(caseItem => (
                    <option key={caseItem.case_id} value={caseItem.case_id}>
                      {caseItem.title || caseItem.case_id} {caseItem.case_type ? `(${caseItem.case_type})` : ''}
                    </option>
                  ))
                )}
              </select>
              {casesError && <p style={{ color: '#c62828', fontSize: '0.85em', marginTop: '5px' }}>{casesError}</p>}
            </div>

            <div style={{ ...formGroupStyle, border: '1px dashed #ffcc80', padding: '15px', borderRadius: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Risk Assessment:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="risk_assessment.level" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Level:</label>
                  <select
                    id="risk_assessment.level"
                    name="risk_assessment.level"
                    value={formData.risk_assessment.level}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="threats_input" style={{ ...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Threats (Comma-separated):</label>
                  <input
                    type="text"
                    id="threats_input"
                    name="threats_input"
                    value={formData.risk_assessment.threats.join(', ')}
                    onChange={handleChange}
                    placeholder="e.g., intimidation, surveillance"
                    style={inputStyle}
                  />
                </div>
                <div style={checkboxContainerStyle}>
                  <input
                    type="checkbox"
                    id="risk_assessment.protection_needed"
                    name="risk_assessment.protection_needed"
                    checked={formData.risk_assessment.protection_needed}
                    onChange={handleChange}
                    style={checkboxStyle}
                  />
                  <label htmlFor="risk_assessment.protection_needed" style={{ ...labelStyle, marginBottom: '0', fontWeight: 'normal' }}>
                    Protection Needed
                  </label>
                </div>
              </div>
            </div>

            <div style={{ ...formGroupStyle, border: '1px dashed #ffcc80', padding: '15px', borderRadius: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Support Services (Optional):</label>
              <input
                type="text"
                id="support_service_type_input"
                name="support_service_type_input"
                value={formData.support_services.length > 0 ? formData.support_services[0].type : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    support_services: value ? [{ type: value, provider: '', status: '' }] : [],
                  }));
                }}
                placeholder="e.g., legal, medical, psychological"
                style={inputStyle}
              />
            </div>

          </div>

          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                ...secondaryButtonStyle,
                ':hover': { backgroundColor: '#9e9e9e' },
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#9e9e9e')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#bdbdbd')}
            >
              <FaTimesCircle style={{ fontSize: '1.2em' }} /> Cancel
            </button>
            <button
              type="submit"
              style={{
                ...primaryButtonStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                ':hover': { backgroundColor: '#ffa726' },
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ffa726')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ff9800')}
              disabled={loading || casesLoading}
            >
              <FaSave style={{ fontSize: '1.2em' }} /> {loading ? 'Adding...' : 'Add Individual'}
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ fontSize: '28px', marginBottom: '1.5rem', color: '#e65100', textAlign: 'center', marginTop: '40px' }}>
        Existing Individuals
      </h2>
      {individualsLoading ? (
        <p style={{ textAlign: 'center', color: '#555' }}>Loading individuals...</p>
      ) : individualsError ? (
        <p style={{ textAlign: 'center', color: '#f44336' }}>Error fetching individuals: {individualsError}</p>
      ) : individuals.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#a1887f' }}>No individuals found.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTableStyle}>ID</th>
                <th style={thTableStyle}>Type</th>
                <th style={thTableStyle}>Name/Pseudonym</th>
                <th style={thTableStyle}>Risk Level</th>
                <th style={thTableStyle}>Cases Involved</th>
                <th style={thTableStyle}>Created By</th>
                <th style={thTableStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {individuals.map((individual, index) => (
                <tr key={individual.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#fffbe6' }}>
                  <td style={tdTableStyle}>{individual.id.substring(0, 8)}...</td>
                  <td style={tdTableStyle}>{individual.type}</td>
                  <td style={tdTableStyle}>
                    {individual.anonymous
                      ? individual.pseudonym || 'Anonymous'
                      : `${individual.first_name || ''} ${individual.last_name || ''}`.trim() || 'N/A'}
                  </td>
                  <td style={tdTableStyle}>
                    {editingRiskLevelId === individual.id ? (
                      <select
                        value={currentRiskLevel}
                        onChange={(e) => setCurrentRiskLevel(e.target.value)}
                        style={{ ...selectStyle, width: 'auto', display: 'inline-block' }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    ) : (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75em',
                        fontWeight: '600',
                        color: individual.risk_assessment?.level === 'High' ? '#c62828' :
                          individual.risk_assessment?.level === 'Medium' ? '#f57f17' : '#2e7d32',
                        backgroundColor: individual.risk_assessment?.level === 'High' ? '#ffebee' :
                          individual.risk_assessment?.level === 'Medium' ? '#fffde7' : '#e8f5e9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}>
                        {individual.risk_assessment?.level || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td style={tdTableStyle}>
                    {individual.cases_involved && individual.cases_involved.length > 0
                      ? individual.cases_involved.join(', ')
                      : 'None'}
                  </td>
                  <td style={tdTableStyle}>{individual.created_by || 'Unknown'}</td>
                  <td style={tdTableStyle}>
                    <button
                      onClick={() => navigate(`/admin/victims/${individual.id}`)}
                      style={actionButtonStyle}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    {editingRiskLevelId === individual.id ? (
                      <>
                        <button
                          onClick={() => handleSaveRiskLevel(individual.id)}
                          style={{ ...actionButtonStyle, color: '#2e7d32' }}
                          title="Save Risk Level"
                          disabled={loading}
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={handleCancelRiskLevelEdit}
                          style={{ ...actionButtonStyle, color: '#bdbdbd' }}
                          title="Cancel Edit"
                          disabled={loading}
                        >
                          <FaTimesCircle />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditRiskLevelClick(individual.id, individual.risk_assessment?.level || 'Low')}
                        style={{ ...actionButtonStyle, color: '#ff9800' }}
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
      )}
    </div>
  );
};

export default VictimsPage;