import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaSave, FaTimesCircle } from 'react-icons/fa'; // Icons for add, save, cancel

const VictimsPage = () => {
  const [formData, setFormData] = useState({
    type: 'victim', // Default to 'victim' or 'witness'
    anonymous: false,
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
    cases_involved: [], // Array of case IDs - will be populated by multi-select
    risk_assessment: {
      level: 'low',
      threats: [], // Array of strings
      protection_needed: false,
    },
    created_by: 'admin_user', // This could be dynamically set by authentication
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [casesList, setCasesList] = useState([]); // New state to store fetched cases
  const [casesLoading, setCasesLoading] = useState(true); // Loading state for cases
  const [casesError, setCasesError] = useState(null); // Error state for cases fetch

  const API_BASE_URL = 'http://localhost:8005'; // Your FastAPI backend URL

  // --- CSS Styles consistent with other admin pages ---
  const formContainerStyle = {
    backgroundColor: '#fff3e0', // Light orange background
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '800px',
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #ffe0b2',
  };

  const formGroupStyle = {
    marginBottom: '15px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '0.95em',
    color: '#e65100', // Darker orange for labels
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ffcc80', // Orange border
    borderRadius: '8px',
    fontSize: '1em',
    color: '#4e342e', // Dark text
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none', // Remove default dropdown arrow
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
    accentColor: '#ff9800', // Orange checkbox
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '30px',
  };

  const primaryButtonStyle = {
    padding: '12px 25px',
    backgroundColor: '#ff9800', // Main orange color
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
    backgroundColor: '#bdbdbd', // Grey for secondary/cancel
    color: '#333',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const messageStyle = (type) => ({
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: type === 'success' ? '#2e7d32' : '#c62828', // Green for success, red for error
    backgroundColor: type === 'success' ? '#e8f5e9' : '#ffebee', // Light green/red background
    border: `1px solid ${type === 'success' ? '#4caf50' : '#ef5350'}`,
  });

  // --- Handlers ---
  // Effect to fetch cases on component mount
  useEffect(() => {
    const fetchCases = async () => {
      setCasesLoading(true);
      setCasesError(null);
      try {
        // CHANGED: Now fetching from /cases/titles endpoint
        const response = await fetch(`${API_BASE_URL}/cases/titles`); 
        if (!response.ok) {
          throw new Error('Failed to fetch cases titles');
        }
        const data = await response.json();
        // data is an array of objects: [{ case_id: "...", title: "...", case_type: "..." }]
        setCasesList(data);
      } catch (err) {
        console.error("Error fetching cases:", err);
        setCasesError(err.message);
      } finally {
        setCasesLoading(false);
      }
    };
    fetchCases();
  }, []); // Empty dependency array means this runs once on component mount

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    const [mainField, subField] = name.split('.');

    setFormData(prev => {
      if (mainField === 'demographics' || mainField === 'contact_info' || mainField === 'risk_assessment') {
        return {
          ...prev,
          [mainField]: {
            ...prev[mainField],
            [subField]: type === 'checkbox' ? checked : value,
          },
        };
      } else if (name === 'cases_involved') { // Handle multi-select for cases_involved
        const selectedValues = Array.from(options)
                               .filter(option => option.selected)
                               .map(option => option.value);
        return {
          ...prev,
          cases_involved: selectedValues,
        };
      } else if (name === 'threats_input') { // Temporary input for threats
        return {
            ...prev,
            risk_assessment: {
                ...prev.risk_assessment,
                threats: value.split(',').map(item => item.trim()).filter(item => item !== ''),
            },
        };
      }
      else {
        return {
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      // Prepare data as per FastAPI's VictimCreate model (individuals schema)
      const dataToSend = {
        type: formData.type,
        anonymous: formData.anonymous,
        demographics: { // Ensure numbers are numbers, not strings from inputs
            gender: formData.demographics.gender,
            age: formData.demographics.age ? parseInt(formData.demographics.age, 10) : undefined,
            ethnicity: formData.demographics.ethnicity,
            occupation: formData.demographics.occupation,
        },
        contact_info: formData.contact_info.email || formData.contact_info.phone || formData.contact_info.secure_messaging
            ? formData.contact_info
            : undefined, // Send only if not empty
        cases_involved: formData.cases_involved,
        risk_assessment: {
            level: formData.risk_assessment.level,
            threats: formData.risk_assessment.threats,
            protection_needed: formData.risk_assessment.protection_needed,
        },
        created_by: formData.created_by,
      };

      // Clean up empty nested objects before sending
      if (dataToSend.demographics && Object.values(dataToSend.demographics).every(val => val === '' || val === null || val === undefined || (Array.isArray(val) && val.length === 0))) {
        delete dataToSend.demographics;
      }
      if (dataToSend.contact_info && Object.values(dataToSend.contact_info).every(val => val === '' || val === null || val === undefined || (Array.isArray(val) && val.length === 0))) {
        delete dataToSend.contact_info;
      }
      if (dataToSend.risk_assessment && Object.values(dataToSend.risk_assessment).every(val => val === '' || val === null || val === undefined || (Array.isArray(val) && val.length === 0))) {
        delete dataToSend.risk_assessment;
      }


      const response = await fetch(`${API_BASE_URL}/victims/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization token if needed
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add individual (Victim/Witness)');
      }

      const result = await response.json();
      setMessage(`✅ Individual added successfully! ID: ${result.individual_id}`);
      setMessageType('success');
      // Reset form after successful submission to initial state matching new schema
      setFormData({
        type: 'victim',
        anonymous: false,
        demographics: { gender: '', age: '', ethnicity: '', occupation: '' },
        contact_info: { email: '', phone: '', secure_messaging: '' },
        cases_involved: [],
        risk_assessment: { level: 'low', threats: [], protection_needed: false },
        created_by: 'admin_user',
      });
    } catch (err) {
      console.error("Error adding individual:", err);
      setMessage(`❌ Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to initial state
    setFormData({
      type: 'victim',
      anonymous: false,
      demographics: { gender: '', age: '', ethnicity: '', occupation: '' },
      contact_info: { email: '', phone: '', secure_messaging: '' },
      cases_involved: [],
      risk_assessment: { level: 'low', threats: [], protection_needed: false },
      created_by: 'admin_user',
    });
    setMessage('');
    setMessageType('');
  };

  return (
    <div style={{ padding: '3rem', backgroundColor: '#fffbe6', minHeight: '100vh', position: 'relative' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '1.5rem', color: '#e65100', textAlign: 'center' }}>
        <FaUserPlus style={{ marginRight: '10px', fontSize: '1.2em' }} /> Add New Victim/Witness
      </h1>

      <div style={formContainerStyle}>
        {message && <div style={messageStyle(messageType)}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {/* Type (Individual Type) */}
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

            {/* Anonymous Checkbox */}
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

            {/* Demographics Section */}
            <div style={{...formGroupStyle, border: '1px dashed #ffcc80', padding: '15px', borderRadius: '10px', opacity: formData.anonymous ? 0.6 : 1 }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Demographics (Sensitive - consider encryption):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="demographics.gender" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Gender:</label>
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
                  <label htmlFor="demographics.age" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Age:</label>
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
                  <label htmlFor="demographics.ethnicity" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Ethnicity:</label>
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
                  <label htmlFor="demographics.occupation" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Occupation:</label>
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

            {/* Contact Info Section */}
            <div style={{...formGroupStyle, border: '1px dashed #ffcc80', padding: '15px', borderRadius: '10px', opacity: formData.anonymous ? 0.6 : 1 }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Contact Information (Sensitive - consider encryption):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="contact_info.email" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Email:</label>
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
                  <label htmlFor="contact_info.phone" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Phone:</label>
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
                <div style={{ gridColumn: 'span 2' }}> {/* Span full width for secure messaging */}
                  <label htmlFor="contact_info.secure_messaging" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Secure Messaging:</label>
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
            
            {/* Cases Involved - Now a Multi-Select Dropdown */}
            <div style={formGroupStyle}>
              <label htmlFor="cases_involved" style={labelStyle}>Cases Involved:</label>
              <select
                id="cases_involved"
                name="cases_involved"
                multiple // Enable multiple selections
                value={formData.cases_involved} // Array of selected values
                onChange={handleChange}
                style={{ ...selectStyle, height: 'auto', minHeight: '100px' }} // Adjust height for multi-select
                disabled={casesLoading || casesError} // Disable if loading or error
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
                      {caseItem.title || caseItem.case_id} {caseItem.case_type ? `(${caseItem.case_type})` : ''} {/* Display title and type */}
                    </option>
                  ))
                )}
              </select>
              {casesError && <p style={{ color: '#c62828', fontSize: '0.85em', marginTop: '5px' }}>{casesError}</p>}
            </div>

            {/* Risk Assessment Section */}
            <div style={{...formGroupStyle, border: '1px dashed #ffcc80', padding: '15px', borderRadius: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Risk Assessment:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="risk_assessment.level" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Level:</label>
                  <select
                    id="risk_assessment.level"
                    name="risk_assessment.level"
                    value={formData.risk_assessment.level}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="threats_input" style={{...labelStyle, fontSize: '0.9em', marginBottom: '5px' }}>Threats (Comma-separated):</label>
                  <input
                    type="text"
                    id="threats_input"
                    name="threats_input" // Using a temp name for input, actual state is risk_assessment.threats
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

            {/* Created By (can be hidden and set programmatically) */}
            <div style={formGroupStyle}>
              <label htmlFor="created_by" style={labelStyle}>Created By:</label>
              <input
                type="text"
                id="created_by"
                name="created_by"
                value={formData.created_by}
                onChange={handleChange}
                style={inputStyle}
                readOnly // Make it read-only if it's set by auth
              />
            </div>
          </div>

          {/* Buttons */}
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
              disabled={loading || casesLoading} // Disable submit if cases are still loading
            >
              <FaSave style={{ fontSize: '1.2em' }} /> {loading ? 'Adding...' : 'Add Individual'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VictimsPage;
