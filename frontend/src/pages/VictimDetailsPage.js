import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

const VictimDetailsPage = () => {
  const { id } = useParams();
  const [victim, setVictim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVictimDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Corrected API_BASE_URL and path
        const response = await fetch(`http://localhost:8006/victims/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch victim details: ${response.statusText}`);
        }
        const data = await response.json();
        setVictim(data);
      } catch (err) {
        console.error("Error fetching victim:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVictimDetails();
  }, [id]);

  if (loading) return <p>Loading victim details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!victim) return <p>Victim not found.</p>;

  // Basic styling for details page
  const detailContainerStyle = {
    backgroundColor: '#fff3e0',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '800px',
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #ffe0b2',
    color: '#4e342e',
  };

  const headingStyle = {
    fontSize: '28px',
    marginBottom: '1.5rem',
    color: '#e65100',
    textAlign: 'center',
  };

  const detailItemStyle = {
    marginBottom: '10px',
    fontSize: '1.1em',
  };

  const spanLabelStyle = {
    fontWeight: 'bold',
    color: '#e65100',
    marginRight: '8px',
  };

  return (
    <div style={{ padding: '3rem', backgroundColor: '#fffbe6', minHeight: '100vh' }}>
      <div style={detailContainerStyle}>
        <h2 style={headingStyle}>Individual Details</h2>
        <p style={detailItemStyle}><span style={spanLabelStyle}>ID:</span> {victim.id}</p>
        <p style={detailItemStyle}><span style={spanLabelStyle}>Type:</span> {victim.type}</p>
        
        {victim.anonymous ? (
          <p style={detailItemStyle}><span style={spanLabelStyle}>Pseudonym:</span> {victim.pseudonym || 'N/A'}</p>
        ) : (
          <>
            <p style={detailItemStyle}><span style={spanLabelStyle}>Full Name:</span> {victim.first_name} {victim.last_name}</p>
            {victim.demographics && (
              <div style={{ borderTop: '1px dashed #ffcc80', paddingTop: '15px', marginTop: '15px' }}>
                <h3 style={{ ...headingStyle, fontSize: '22px', textAlign: 'left', marginBottom: '10px' }}>Demographics:</h3>
                <p style={detailItemStyle}><span style={spanLabelStyle}>Gender:</span> {victim.demographics.gender || 'N/A'}</p>
                <p style={detailItemStyle}><span style={spanLabelStyle}>Age:</span> {victim.demographics.age || 'N/A'}</p>
                <p style={detailItemStyle}><span style={spanLabelStyle}>Ethnicity:</span> {victim.demographics.ethnicity || 'N/A'}</p>
                <p style={detailItemStyle}><span style={spanLabelStyle}>Occupation:</span> {victim.demographics.occupation || 'N/A'}</p>
              </div>
            )}
            {victim.contact_info && (
              <div style={{ borderTop: '1px dashed #ffcc80', paddingTop: '15px', marginTop: '15px' }}>
                <h3 style={{ ...headingStyle, fontSize: '22px', textAlign: 'left', marginBottom: '10px' }}>Contact Info:</h3>
                <p style={detailItemStyle}><span style={spanLabelStyle}>Email:</span> {victim.contact_info.email || 'N/A'}</p>
                <p style={detailItemStyle}><span style={spanLabelStyle}>Phone:</span> {victim.contact_info.phone || 'N/A'}</p>
                <p style={detailItemStyle}><span style={spanLabelStyle}>Secure Messaging:</span> {victim.contact_info.secure_messaging || 'N/A'}</p>
              </div>
            )}
          </>
        )}

        <div style={{ borderTop: '1px dashed #ffcc80', paddingTop: '15px', marginTop: '15px' }}>
          <h3 style={{ ...headingStyle, fontSize: '22px', textAlign: 'left', marginBottom: '10px' }}>Cases Involved:</h3>
          <p style={detailItemStyle}>
            {victim.cases_involved && victim.cases_involved.length > 0
              ? victim.cases_involved.join(", ")
              : "None"}
          </p>
        </div>

        {victim.risk_assessment && (
          <div style={{ borderTop: '1px dashed #ffcc80', paddingTop: '15px', marginTop: '15px' }}>
            <h3 style={{ ...headingStyle, fontSize: '22px', textAlign: 'left', marginBottom: '10px' }}>Risk Assessment:</h3>
            <p style={detailItemStyle}><span style={spanLabelStyle}>Level:</span> {victim.risk_assessment.level || 'N/A'}</p>
            <p style={detailItemStyle}><span style={spanLabelStyle}>Threats:</span> {victim.risk_assessment.threats?.join(", ") || 'N/A'}</p>
            <p style={detailItemStyle}><span style={spanLabelStyle}>Protection Needed:</span> {victim.risk_assessment.protection_needed ? 'Yes' : 'No'}</p>
          </div>
        )}

        {victim.support_services && victim.support_services.length > 0 && (
          <div style={{ borderTop: '1px dashed #ffcc80', paddingTop: '15px', marginTop: '15px' }}>
            <h3 style={{ ...headingStyle, fontSize: '22px', textAlign: 'left', marginBottom: '10px' }}>Support Services:</h3>
            {victim.support_services.map((service, index) => (
              <p key={index} style={detailItemStyle}>
                <span style={spanLabelStyle}>Type:</span> {service.type || 'N/A'},
                <span style={spanLabelStyle}>Provider:</span> {service.provider || 'N/A'},
                <span style={spanLabelStyle}>Status:</span> {service.status || 'N/A'}
              </p>
            ))}
          </div>
        )}

        <p style={detailItemStyle}><span style={spanLabelStyle}>Created By:</span> {victim.created_by || 'Unknown'}</p>
        <p style={detailItemStyle}><span style={spanLabelStyle}>Created At:</span> {new Date(victim.created_at).toLocaleString()}</p>
        <p style={detailItemStyle}><span style={spanLabelStyle}>Updated At:</span> {new Date(victim.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default VictimDetailsPage;
