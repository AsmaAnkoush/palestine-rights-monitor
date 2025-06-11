import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // أضفت Link
import { FaArrowLeft, FaExclamationCircle, FaSpinner } from 'react-icons/fa'; // أيقونات إضافية

const VictimsByCase = () => {
  const { caseId } = useParams(); // يجلب caseId من الـ URL (مثلاً: /victims/case/HRM-2023-0423)
  const [victims, setVictims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8006'; // تأكد أنه نفس عنوان الـ API تبعك

  useEffect(() => {
    const fetchVictimsForCase = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/victims/case/${caseId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch victims for this case.');
        }
        const data = await response.json();
        setVictims(data);
      } catch (err) {
        console.error("Error fetching victims by case:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) { // تأكد من وجود caseId قبل محاولة الجلب
      fetchVictimsForCase();
    }
  }, [caseId]); // أعد الجلب عندما يتغير caseId في الـ URL

  // --- أنماط CSS بسيطة للمظهر (يمكنك نقلها لملف CSS منفصل أو استخدام Tailwind/Styled Components) ---
  const containerStyle = {
    padding: '3rem',
    backgroundColor: '#fffbe6',
    minHeight: '100vh',
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
    overflowX: 'auto', // للسماح بالتمرير الأفقي للجداول الكبيرة
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

  const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#ff9800',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    marginBottom: '30px',
  };

  const backButtonHoverStyle = {
    backgroundColor: '#e65100',
  };

  return (
    <div style={containerStyle}>
      <Link 
        to="/admin/victims" 
        style={backButtonStyle}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = backButtonHoverStyle.backgroundColor}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = backButtonStyle.backgroundColor}
      >
        <FaArrowLeft /> Back to All Individuals
      </Link>

      <h1 style={headerStyle}>
        Individuals Linked to Case: <span style={{ color: '#ff9800' }}>{caseId}</span>
      </h1>

      <div style={tableContainerStyle}>
        {loading && (
          <div style={messageStyle('info')}>
            <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> Loading individuals...
          </div>
        )}

        {error && (
          <div style={messageStyle('error')}>
            <FaExclamationCircle /> Error: {error}
          </div>
        )}

        {!loading && !error && victims.length === 0 && (
          <div style={messageStyle('info')}>
            No individuals found linked to case ID: **{caseId}**.
          </div>
        )}

        {!loading && !error && victims.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Name / Pseudonym</th>
                <th style={thStyle}>Risk Level</th>
                <th style={thStyle}>Cases Involved</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Created At</th>
                {/* يمكنك إضافة المزيد من الأعمدة هنا إذا أردت */}
              </tr>
            </thead>
            <tbody>
              {victims.map((individual) => (
                <tr key={individual.id}>
                  <td style={tdStyle}>{individual.id.substring(0, 8)}...</td>
                  <td style={tdStyle}>{individual.type}</td>
                  <td style={tdStyle}>
                    {individual.anonymous
                      ? individual.pseudonym || 'Anonymous'
                      : `${individual.first_name || ''} ${individual.last_name || ''}`.trim() || 'N/A'}
                  </td>
                  <td style={tdStyle}>
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
                  </td>
                  <td style={tdStyle}>
                    {individual.cases_involved && individual.cases_involved.length > 0
                      ? individual.cases_involved.join(', ')
                      : 'None'}
                  </td>
                  <td style={tdStyle}>{individual.created_by || 'Unknown'}</td>
                  <td style={tdStyle}>{new Date(individual.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* ستايل بسيط للـ spinner */}
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

export default VictimsByCase;