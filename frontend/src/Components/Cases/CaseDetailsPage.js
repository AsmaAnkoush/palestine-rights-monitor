import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { MdPlace, MdErrorOutline, MdPeople, MdPriorityHigh, MdGavel, MdHistory } from 'react-icons/md';

const CaseDetailsPage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/cases/${id}`);
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        setCaseData(data);
      } catch (err) {
        console.error('❌ Error fetching case details:', err);
        setError('Failed to load case details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id]);

  const formattedDate = (d) => {
    if (!d) return 'N/A';
    try {
      const dateObj = new Date(d);
      return !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : 'N/A';
    } catch (e) {
      console.error('Error formatting date:', d, e);
      return 'N/A';
    }
  };

  const historyItemStyle = {
    marginBottom: '8px',
    fontSize: '14px',
    color: '#4a5568',
    paddingLeft: '10px',
    borderLeft: '3px solid #ffcc80',
    backgroundColor: '#fffaf0',
    padding: '10px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const historyLabelStyle = {
    fontWeight: 'bold',
    color: '#334155',
    minWidth: '100px',
  };

  const section = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
    marginBottom: '30px',
    transition: '0.3s',
  };

  const titleStyle = {
    fontSize: '20px',
    marginBottom: '16px',
    borderBottom: '2px solid #f1f1f1',
    paddingBottom: '8px',
    color: '#1e293b',
  };

  const item = {
    marginBottom: '14px',
    fontSize: '15px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const label = {
    fontWeight: 'bold',
    minWidth: '140px',
    color: '#111827',
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading case details...</p>;
  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error}</p>;
  if (!caseData) return <p style={{ padding: '2rem' }}>No case details available.</p>;


  return (
    <div style={{ padding: '3rem', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '36px', color: '#111827', marginBottom: '2rem' }}>
        📁 Case Overview
      </h1>

      <div style={section}>
        <h3 style={titleStyle}>📝 General Information</h3>

        <div style={item}><span style={label}>Case ID:</span> {caseData.case_id || '—'}</div>
        <div style={item}><span style={label}>Title:</span> {caseData.title || '—'}</div>
        <div style={item}><span style={label}>Description:</span> {caseData.description || '—'}</div>
        <div style={item}><span style={label}>Status:</span> {caseData.status || '—'}</div>
        <div style={item}><span style={label}>Priority:</span> <MdPriorityHigh /> {caseData.priority || '—'}</div>
        <div style={item}><span style={label}>Case Type:</span> {caseData.case_type || '—'}</div>
      </div>

      <div style={section}>
        <h3 style={titleStyle}>📌 Location & Timing</h3>

        <div style={item}><span style={label}><MdPlace /> Location:</span> {caseData.location?.country || '—'}, {caseData.location?.region || '—'}</div>
        {formattedDate(caseData.date_occurred) && (
          <div style={item}><span style={label}>Date Occurred:</span> {formattedDate(caseData.date_occurred)}</div>
        )}
        {formattedDate(caseData.date_reported) && (
          <div style={item}><span style={label}>Date Reported:</span> {formattedDate(caseData.date_reported)}</div>
        )}
      </div>

      <div style={section}>
        <h3 style={titleStyle}>⚖️ Violations & Evidence</h3>

        <div style={item}>
          <span style={label}><MdGavel /> Violation Types:</span>
          {Array.isArray(caseData.violation_types)
            ? caseData.violation_types.join(', ')
            : '—'}
        </div>
        <div style={item}>
          <span style={label}>Evidence Items:</span> {Array.isArray(caseData.attachments) ? caseData.attachments.length : 0}
        </div>
        {Array.isArray(caseData.attachments) && caseData.attachments.length > 0 && (
            <div style={{...item, marginTop: '10px', flexDirection: 'column', alignItems: 'flex-start'}}>
                <span style={{...label, marginBottom: '5px'}}>Attachments:</span>
                <ul style={{listStyle: 'none', padding: 0, margin: 0, width: '100%'}}>
                    {caseData.attachments.map((attachment, index) => (
                        <li key={index} style={{marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0'}}>
                            📄 <a 
                                href={`${api.defaults.baseURL}/attachments/${attachment.filename}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{color: '#2196f3', textDecoration: 'none'}}
                            >
                                {attachment.filename}
                            </a> 
                            <span style={{fontSize: '0.8em', color: '#666'}}>({(attachment.size / 1024).toFixed(2)} KB)</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>

      <div style={section}>
        <h3 style={titleStyle}>👥 People Involved</h3>

        <div style={item}><span style={label}><MdPeople /> Victims:</span> {Array.isArray(caseData.victims) ? caseData.victims.length : 0}</div>
        <div style={item}><span style={label}><MdErrorOutline /> Perpetrators:</span> {Array.isArray(caseData.perpetrators) ? caseData.perpetrators.length : 0}</div>
      </div>

      <div style={section}>
        <h3 style={titleStyle}><MdHistory style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Case Status History</h3>
        {Array.isArray(caseData.case_status_history) && caseData.case_status_history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {caseData.case_status_history.map((entry, index) => (
              <div key={index} style={historyItemStyle}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={historyLabelStyle}>Date:</span>
                    <span>{formattedDate(entry.change_date)}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={historyLabelStyle}>From:</span>
                    <span>{entry.old_status || 'Initial'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={historyLabelStyle}>To:</span>
                    <span style={{ fontWeight: 'bold', color: '#ef6c00' }}>{entry.new_status}</span>
                </div>
                {entry.changed_by && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={historyLabelStyle}>By:</span>
                        <span>{entry.changed_by}</span>
                    </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#78909c' }}>No status change history available.</p>
        )}
      </div>
    </div>
  );
};

export default CaseDetailsPage;
