// src/SubmitReportForm.js
import React, { useState, useEffect } from "react";
import 'leaflet/dist/leaflet.css'; // لا تزال هذه ضرورية لـ Leaflet
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icon (crucial!)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// LocationPicker component (moved outside for conditional loading)
function LocationPicker({ selectedMapCoordinates, setSelectedMapCoordinates, setReportData, clearLocationError }) {
    const PALESTINE_CENTER = [31.7683, 35.2137];
    const mapInitialPosition = selectedMapCoordinates || PALESTINE_CENTER;

    function LocationMarker() {
        useMapEvents({
            click(e) {
                const coords = [e.latlng.lat, e.latlng.lng];
                setSelectedMapCoordinates(coords);
                reverseGeocode(coords);
                clearLocationError();
            }
        });
        return selectedMapCoordinates ? <Marker position={selectedMapCoordinates} /> : null;
    }

    const reverseGeocode = ([lat, lng]) => {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
                const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                // Removed specific country, region, city as per request
                // setReportData(prev => ({
                //     ...prev,
                //     incident_details: {
                //         ...prev.incident_details,
                //         location: {
                //             ...prev.incident_details.location,
                //             country: data.address.country || "",
                //             region: data.address.state || data.address.region || "",
                //             city: data.address.city || data.address.town || data.address.village || "",
                //             address: address
                //         }
                //     }
                // }));
                setReportData(prev => ({
                    ...prev,
                    incident_details: {
                        ...prev.incident_details,
                        location: {
                            address: address, // Only general address is kept
                            coordinates: {
                                type: "Point",
                                coordinates: [lng, lat] // Store as [longitude, latitude] for MongoDB GeoJSON
                            }
                        }
                    }
                }));
            })
            .catch(err => {
                console.error("Failed to fetch address:", err);
                setReportData(prev => ({
                    ...prev,
                    incident_details: {
                        ...prev.incident_details,
                        location: {
                            address: `${lat.toFixed(5)}, ${lng.toFixed(5)} (Could not retrieve full address)`,
                            coordinates: {
                                type: "Point",
                                coordinates: [lng, lat]
                            }
                        }
                    }
                }));
            });
    };

    return (
        <MapContainer
            center={mapInitialPosition}
            zoom={8}
            scrollWheelZoom={true}
            style={{ height: '350px', width: '100%', marginBottom: '25px', borderRadius: '12px', border: '3px solid #ff9800', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationMarker />
        </MapContainer>
    );
}

function SubmitReportForm() {
    const [isClient, setIsClient] = useState(false);
    const [errors, setErrors] = useState({});
    // const [otherCaseType, setOtherCaseType] = useState(""); // Removed
    const [violationOptions, setViolationOptions] = useState([]);
    // const [casesOptions, setCasesOptions] = useState([]); // Removed

    const [selectedMapCoordinates, setSelectedMapCoordinates] = useState(null);

    const [reportData, setReportData] = useState({
        reporter_type: "victim",
        anonymous: false,
        pseudonym: "",
        contact_info: { email: "", phone: "", preferred_contact: "email" },
        incident_details: {
            date: "",
            description: "",
            violation_types: [],
            // suggested_case_name: "", // Removed
            location: {
                // country: "", // Removed
                // region: "", // Removed
                // city: "", // Removed
                address: "", // Keep only general address
                coordinates: {
                    type: "Point",
                    coordinates: [null, null]
                }
            },
        },
        status: "pending_review",
        priority: "medium",
        // related_case_id: "", // Removed
        evidence: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsClient(true);

        fetch("http://localhost:8005/cases/violation_types?lang=en")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                // console.log("Fetched violation options:", data); // No longer needed
                setViolationOptions(data);
            })
            .catch(err => console.error("Failed to fetch violation types:", err));

        // Removed fetch for casesOptions as per request
        // fetch("http://localhost:8003/cases/")
        //     .then(res => {
        //         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        //         return res.json();
        //     })
        //     .then(data => setCasesOptions(data))
        //     .catch(err => console.error("Failed to fetch cases:", err));

    }, []);


    const clearLocationError = () =>
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.location;
            return newErrors;
        });

    const validateForm = () => {
        const newErrors = {};
        const { incident_details, contact_info, anonymous } = reportData;

        if (!incident_details.description) newErrors.description = "Description is required.";
        if (!incident_details.date) newErrors.date = "Date is required.";

        if (!selectedMapCoordinates) {
            newErrors.location = "Please select a location on the map.";
        } else if (!incident_details.location.address) { // Ensure address is populated after map click
             newErrors.location = "Location address could not be determined. Please try clicking on the map again or manually enter coordinates.";
        }


        if (!anonymous && !contact_info.email) newErrors.email = "Email is required.";

        if (incident_details.violation_types.length === 0) { // Simplified validation
            newErrors.violation_types = "Please select at least one violation type.";
        }

        if (contact_info.email && !/\S+@\S+\.\S+/.test(contact_info.email)) {
            newErrors.email = "Please provide a valid email address.";
        }

        if (contact_info.phone && !/^((\+|00)?970|0)5[0-9]{8}$/.test(contact_info.phone)) {
            newErrors.phone = "Please provide a valid phone number (e.g., 0599123456 or +970599123456).";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setReportData(prev => {
            let newData = { ...prev };

            if (name === "anonymous") {
                newData[name] = checked;
                if (checked) {
                    newData.contact_info = { email: "", phone: "", preferred_contact: "email" };
                } else {
                    newData.pseudonym = "";
                }
            } else if (name.startsWith("contact_info.")) {
                const field = name.split(".")[1];
                newData.contact_info = { ...prev.contact_info, [field]: value };
            } else if (name.startsWith("incident_details.location.")) {
                // This block is no longer needed if only 'address' is a direct input,
                // but keeping it for robustness if other location fields were added
                const field = name.split(".")[2];
                newData.incident_details.location = { ...prev.incident_details.location, [field]: value };
            } else if (name.startsWith("incident_details.")) {
                const field = name.split(".")[1];
                newData.incident_details = { ...prev.incident_details, [field]: value };
            } else {
                newData[name] = value;
            }
            return newData;
        });

        const fieldNameForError = name.includes('.') ? name.split('.').pop() : name;
        if (errors[fieldNameForError]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldNameForError];
                return newErrors;
            });
        }
    };

    const handleViolationTypesChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, opt => opt.value);
        setReportData(prev => ({
            ...prev,
            incident_details: {
                ...prev.incident_details,
                violation_types: selectedOptions,
                // suggested_case_name: "" // Removed this line
            },
        }));
        if (errors.violation_types) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.violation_types;
                return newErrors;
            });
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            alert("Maximum 5 files allowed.");
            e.target.value = null;
            setReportData(prev => ({ ...prev, evidence: [] }));
            return;
        }
        setReportData(prev => ({ ...prev, evidence: files }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            alert("Please correct the errors in the form before submitting.");
            return;
        }

        setIsSubmitting(true);

        // Removed logic for 'otherCaseType' and submitting case suggestions
        // if (reportData.incident_details.violation_types.includes("other") && !otherCaseType) {
        //     alert("Please suggest a valid case type.");
        //     setIsSubmitting(false);
        //     return;
        // }
        // if (reportData.incident_details.violation_types.includes("other") && otherCaseType) {
        //     try {
        //         const suggestRes = await fetch("http://localhost:8000/case-types", {
        //             method: "POST",
        //             headers: { "Content-Type": "application/json" },
        //             body: JSON.stringify({ name: otherCaseType }),
        //         });
        //         const suggestResult = await suggestRes.json();
        //         if (!suggestRes.ok) throw new Error(suggestResult.message || "Failed to suggest case type.");
        //         console.log("Suggestion submitted successfully:", suggestResult);
        //     } catch (err) {
        //         alert("Failed to submit suggestion: " + err.message);
        //         console.error("Suggestion error:", err);
        //         setIsSubmitting(false);
        //         return;
        //     }
        // }

        const formData = new FormData();
formData.append("reporter_type", reportData.reporter_type);
formData.append("anonymous", reportData.anonymous);
formData.append("pseudonym", reportData.pseudonym || "");
formData.append("status", reportData.status);
formData.append("priority", reportData.priority);
formData.append("created_by", localStorage.getItem("username") || "anonymous");

// Ensure GeoJSON coords are [lng, lat]
const coords = selectedMapCoordinates
    ? { type: "Point", coordinates: [selectedMapCoordinates[1], selectedMapCoordinates[0]] }
    : { type: "Point", coordinates: [null, null] };

const incident_details = {
    ...reportData.incident_details,
    date: new Date(reportData.incident_details.date).toISOString(),
    location: {
        ...reportData.incident_details.location,
        coordinates: coords,
    },
};

formData.append("incident_details", JSON.stringify(incident_details));

if (!reportData.anonymous) {
    formData.append("contact_info", JSON.stringify(reportData.contact_info));
}

// Files
if (reportData.evidence && reportData.evidence.length > 0) {
    Array.from(reportData.evidence).forEach((file) => {
        formData.append("evidence", file);
    });
}


        try {
            const token = localStorage.getItem("jwt_token");
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

           const res = await fetch("http://localhost:8005/reports/", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token") || ""}`
    },
    body: formData,
});


            const result = await res.json();
            if (!res.ok) {
                let errorMessage = "Failed to submit report.";
                if (result.detail) {
                    if (Array.isArray(result.detail)) {
                        errorMessage = result.detail.map(err => `${err.loc.join(' -> ')}: ${err.msg}`).join('\n');
                    } else if (typeof result.detail === 'string') {
                        errorMessage = result.detail;
                    }
                }
                throw new Error(errorMessage);
            }

            alert("Report submitted successfully! Report ID: " + result.report_id);
            console.log("Report created:", result.report_id);

            // Reset form
            setReportData({
                reporter_type: "victim",
                anonymous: false,
                pseudonym: "",
                contact_info: { email: "", phone: "", preferred_contact: "email" },
                incident_details: {
                    date: "",
                    description: "",
                    violation_types: [],
                    // suggested_case_name: "", // Removed
                    location: {
                        // country: "", // Removed
                        // region: "", // Removed
                        // city: "", // Removed
                        address: "", // Keep only general address
                        coordinates: { type: "Point", coordinates: [null, null] }
                    },
                },
                status: "pending_review",
                priority: "medium",
                // related_case_id: "", // Removed
                evidence: [],
            });
            // setOtherCaseType(""); // Removed
            setErrors({});
            setSelectedMapCoordinates(null);
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';

        } catch (err) {
            alert("Submission failed: " + err.message);
            console.error("Submission error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- CSS Styles adapted from CasesPage ---
    const primaryOrange = '#ff9800';
    const darkOrange = '#e65100';
    const lightOrange = '#fff3e0';
    const darkText = '#4e342e';
    const lightGrayBorder = '#ffe0b2'; // Used for table borders in CasesPage, adapting for form borders

    const inputBorderRadius = '6px';
    const buttonBorderRadius = '8px';
    const containerBorderRadius = '12px'; // For form sections and main container

    const formContainerStyle = {
        padding: '40px',
        backgroundColor: '#fff',
        borderRadius: containerBorderRadius,
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
        maxWidth: '900px',
        width: '100%',
        margin: '20px auto',
        boxSizing: 'border-box',
    };

    const formTitleStyle = {
        fontSize: '32px',
        marginBottom: '1.5rem',
        color: darkOrange,
        textAlign: 'center',
        position: 'relative',
        paddingBottom: '10px',
    };

    const formTitleAfterStyle = { // Pseudo-element for the line under title
        content: "''",
        display: 'block',
        width: '60px',
        height: '4px',
        backgroundColor: primaryOrange,
        margin: '10px auto 0',
        borderRadius: '2px',
    };

    const sectionHeadingStyle = {
        fontSize: '24px',
        color: darkText,
        marginBottom: '1rem',
        borderBottom: `2px solid ${lightOrange}`,
        paddingBottom: '10px',
        marginTop: '30px',
    };

    const subHeadingStyle = {
        fontSize: '20px',
        color: primaryOrange,
        marginBottom: '10px',
        marginTop: '20px',
    };

    const formGroupStyle = {
        marginBottom: '15px',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        color: darkText,
        fontSize: '0.95em',
    };

    const inputStyle = {
        width: 'calc(100% - 20px)', // Account for padding
        padding: '10px',
        border: `1px solid ${lightGrayBorder}`,
        borderRadius: inputBorderRadius,
        fontSize: '1em',
        color: darkText,
        boxSizing: 'border-box',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    };

    const textareaStyle = {
        ...inputStyle,
        resize: 'vertical',
        minHeight: '100px',
    };

    const selectStyle = {
        ...inputStyle,
        height: '40px', // Standard height for selects
    };

    const checkboxContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px',
    };

    const checkboxInputStyle = {
        marginRight: '10px',
        appearance: 'none',
        width: '20px',
        height: '20px',
        border: `2px solid ${primaryOrange}`,
        borderRadius: '4px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    };

    const errorMessageStyle = {
        color: '#d32f2f', // A darker red for errors
        fontSize: '0.85em',
        marginTop: '5px',
        borderLeft: '3px solid #d32f2f',
        paddingLeft: '5px',
    };

    const formErrorsBoxStyle = {
        color: '#d32f2f',
        marginBottom: '20px',
        border: '1px solid #ef9a9a', // Lighter red border
        padding: '15px',
        borderRadius: '8px',
        background: '#ffebee', // Very light red background
        fontSize: '0.9em',
        boxShadow: '0 2px 8px rgba(211, 47, 47, 0.1)',
    };

    const mapLoadingPlaceholderStyle = {
        height: '350px',
        width: '100%',
        marginBottom: '25px',
        borderRadius: '12px',
        border: `2px dashed ${primaryOrange}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: lightOrange,
        color: darkText,
        fontSize: '1.1em',
        fontWeight: '500',
    };

    const selectedCoordinatesStyle = {
        fontSize: '0.9em',
        color: darkText,
        marginTop: '10px',
        backgroundColor: lightOrange,
        padding: '8px 12px',
        borderRadius: '5px',
        border: `1px solid ${primaryOrange}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const clearSelectionButtonStyle = {
        background: 'none',
        border: 'none',
        color: '#d32f2f',
        cursor: 'pointer',
        fontSize: '0.85em',
        marginLeft: '15px',
        padding: '5px 10px',
        borderRadius: '5px',
        transition: 'background-color 0.2s ease, color 0.2s ease',
    };

    const hintTextStyle = {
        fontSize: '0.8em',
        color: '#757575',
        marginTop: '5px',
        fontStyle: 'italic',
    };

    const fileInputStyle = {
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: `1px solid ${lightGrayBorder}`,
        cursor: 'pointer',
        width: 'calc(100% - 20px)',
        boxSizing: 'border-box',
    };

    const fileButtonCommonStyle = {
        backgroundColor: primaryOrange,
        color: 'white',
        padding: '8px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '15px',
        transition: 'background-color 0.3s ease',
    };

    const selectedFilesInfoStyle = {
        fontSize: '0.9em',
        color: darkText,
        marginTop: '10px',
        backgroundColor: lightOrange,
        padding: '8px 12px',
        borderRadius: '5px',
        border: `1px solid ${primaryOrange}`,
    };

    const submitButtonStyle = {
        display: 'block',
        width: '100%',
        padding: '15px',
        backgroundColor: primaryOrange,
        color: 'white',
        border: 'none',
        borderRadius: buttonBorderRadius,
        fontSize: '1.2em',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '30px',
        transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
        boxShadow: `0 5px 15px rgba(255, 152, 0, 0.3)`,
    };

    return (
        <>
            {/* Embedded CSS Styles */}
            <style>
                {`
                    .form-container:hover {
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                    }

                    .form-title::after {
                        content: '';
                        display: block;
                        width: 60px;
                        height: 4px;
                        background-color: ${primaryOrange};
                        margin: 10px auto 0;
                        border-radius: 2px;
                    }

                    input[type="text"]:focus,
                    input[type="email"]:focus,
                    input[type="tel"]:focus,
                    input[type="date"]:focus,
                    select:focus,
                    textarea:focus {
                        border-color: ${primaryOrange};
                        box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
                        outline: none;
                    }

                    .checkbox-group input[type="checkbox"]:checked {
                        background-color: ${primaryOrange};
                        border-color: ${primaryOrange};
                    }

                    .checkbox-group input[type="checkbox"]:checked::before {
                        content: '✓';
                        display: block;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        font-size: 14px;
                    }

                    .clear-selection-button:hover {
                        background-color: #ffebee;
                        color: #c62828;
                    }

                    .file-upload-group input[type="file"]::file-selector-button {
                        background-color: ${fileButtonCommonStyle.backgroundColor};
                        color: ${fileButtonCommonStyle.color};
                        padding: ${fileButtonCommonStyle.padding};
                        border: ${fileButtonCommonStyle.border};
                        border-radius: ${fileButtonCommonStyle.borderRadius};
                        cursor: ${fileButtonCommonStyle.cursor};
                        margin-right: ${fileButtonCommonStyle.marginRight};
                        transition: ${fileButtonCommonStyle.transition};
                    }

                    .file-upload-group input[type="file"]::file-selector-button:hover {
                        background-color: ${darkOrange};
                    }

                    .submit-button:hover:not(:disabled) {
                        background-color: ${darkOrange};
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(255, 152, 0, 0.4);
                    }

                    .submit-button:disabled {
                        background-color: #ffcc80;
                        cursor: not-allowed;
                        box-shadow: none;
                    }

                    /* Responsive Adjustments */
                    @media (max-width: 768px) {
                        .form-container {
                            padding: 25px;
                            margin: 15px;
                        }

                        .form-title {
                            font-size: 1.8em;
                            margin-bottom: 20px;
                        }

                        h3 {
                            font-size: 1.4em;
                        }

                        h4 {
                            font-size: 1.1em;
                        }

                        input[type="text"],
                        input[type="email"],
                        input[type="tel"],
                        input[type="date"],
                        select,
                        textarea {
                            padding: 10px;
                            font-size: 0.95em;
                        }
                    }

                    @media (max-width: 480px) {
                        .form-container {
                            padding: 15px;
                            margin: 10px;
                        }

                        .form-title {
                            font-size: 1.5em;
                        }

                        .selected-coordinates {
                            flex-direction: column;
                            align-items: flex-start;
                        }

                        .clear-selection-button {
                            margin-left: 0;
                            margin-top: 5px;
                        }
                    }
                `}
            </style>

            <div style={formContainerStyle} className="form-container">
                <form onSubmit={handleSubmit} className="submit-report-form">
                    <h2 style={formTitleStyle} className="form-title">Submit a New Report</h2>
                    {/* The ::after pseudo-element for the line under title is handled by the .form-title CSS class */}

                    {Object.keys(errors).length > 0 && (
                        <div style={formErrorsBoxStyle}>
                            <p>Please correct the following errors:</p>
                            <ul style={{ listStyleType: 'disc', marginLeft: '20px', padding: '0' }}>
                                {Object.values(errors).map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <section style={{ marginBottom: '25px', padding: '25px', backgroundColor: '#fff', borderRadius: containerBorderRadius, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1px solid ${lightGrayBorder}` }}>
                        <h3 style={sectionHeadingStyle}>Reporter Information</h3>
                        <div style={formGroupStyle}>
                            <label htmlFor="reporter_type" style={labelStyle}>Reporter Type:</label>
                            <select id="reporter_type" name="reporter_type" value={reportData.reporter_type} onChange={handleChange} style={selectStyle}>
                                <option value="victim">Victim</option>
                                <option value="witness">Witness</option>
                            </select>
                        </div>

                        <div style={checkboxContainerStyle} className="checkbox-group">
                            <input type="checkbox" id="anonymous" name="anonymous" checked={reportData.anonymous} onChange={handleChange} style={checkboxInputStyle} />
                            <label htmlFor="anonymous" style={{ ...labelStyle, marginBottom: '0' }}>Submit Anonymously</label>
                        </div>

                        {reportData.anonymous ? (
                            <div style={formGroupStyle}>
                                <label htmlFor="pseudonym" style={labelStyle}>Pseudonym (Optional):</label>
                                <input type="text" id="pseudonym" name="pseudonym" value={reportData.pseudonym} onChange={handleChange} placeholder="Enter a pseudonym" style={inputStyle} />
                            </div>
                        ) : (
                            <>
                                <div style={formGroupStyle}>
                                    <label htmlFor="contact_email" style={labelStyle}>Email (Required):</label>
                                    <input type="email" id="contact_email" name="contact_info.email" value={reportData.contact_info.email} onChange={handleChange} placeholder="your.email@example.com" style={inputStyle} />
                                    {errors.email && <p style={errorMessageStyle}>{errors.email}</p>}
                                </div>
                                <div style={formGroupStyle}>
                                    <label htmlFor="contact_phone" style={labelStyle}>Phone Number (Optional):</label>
                                    <input type="tel" id="contact_phone" name="contact_info.phone" value={reportData.contact_info.phone} onChange={handleChange} placeholder="+970591234567" style={inputStyle} />
                                    {errors.phone && <p style={errorMessageStyle}>{errors.phone}</p>}
                                </div>
                                <div style={formGroupStyle}>
                                    <label htmlFor="preferred_contact" style={labelStyle}>Preferred Contact Method:</label>
                                    <select id="preferred_contact" name="contact_info.preferred_contact" value={reportData.contact_info.preferred_contact} onChange={handleChange} style={selectStyle}>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                        <option value="whatsapp">WhatsApp</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </section>

                    <section style={{ marginBottom: '25px', padding: '25px', backgroundColor: '#fff', borderRadius: containerBorderRadius, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1px solid ${lightGrayBorder}` }}>
                        <h3 style={sectionHeadingStyle}>Incident Details</h3>
                        <div style={formGroupStyle}>
                            <label htmlFor="incident_date" style={labelStyle}>Date of Incident:</label>
                            <input type="date" id="incident_date" name="incident_details.date" value={reportData.incident_details.date} onChange={handleChange} style={inputStyle} />
                            {errors.date && <p style={errorMessageStyle}>{errors.date}</p>}
                        </div>

                        <div style={formGroupStyle}>
                            <label htmlFor="incident_description" style={labelStyle}>Description of Incident (Required):</label>
                            <textarea id="incident_description" name="incident_details.description" value={reportData.incident_details.description} onChange={handleChange} placeholder="Provide a detailed description of what happened..." style={textareaStyle}></textarea>
                            {errors.description && <p style={errorMessageStyle}>{errors.description}</p>}
                        </div>

                        <div style={formGroupStyle}>
                            <label htmlFor="violation_types" style={labelStyle}>Violation Types (Select one or more):</label>
                            <select
                                id="violation_types"
                                name="incident_details.violation_types"
                                multiple
                                value={reportData.incident_details.violation_types}
                                onChange={handleViolationTypesChange}
                                style={{ ...selectStyle, height: 'auto', minHeight: '100px' }}
                            >
                                {violationOptions.map((type, index) => (
                                    <option key={index} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            {errors.violation_types && <p style={errorMessageStyle}>{errors.violation_types}</p>}
                        </div>


                        <h4 style={subHeadingStyle}>Incident Location</h4>
                        <p style={hintTextStyle}>Click on the map to select the incident location.</p>
                        {isClient ? (
                            <LocationPicker
                                selectedMapCoordinates={selectedMapCoordinates}
                                setSelectedMapCoordinates={setSelectedMapCoordinates}
                                setReportData={setReportData}
                                clearLocationError={clearLocationError}
                            />
                        ) : (
                            <div style={mapLoadingPlaceholderStyle}>Loading Map...</div>
                        )}
                        {selectedMapCoordinates && (
                            <div style={selectedCoordinatesStyle} className="selected-coordinates">
                                <span>
                                    Selected Location: {reportData.incident_details.location.address || `Lat: ${selectedMapCoordinates[0].toFixed(5)}, Lng: ${selectedMapCoordinates[1].toFixed(5)}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMapCoordinates(null);
                                        setReportData(prev => ({
                                            ...prev,
                                            incident_details: {
                                                ...prev.incident_details,
                                                location: {
                                                    address: "",
                                                    coordinates: { type: "Point", coordinates: [null, null] }
                                                }
                                            }
                                        }));
                                    }}
                                    style={clearSelectionButtonStyle}
                                    className="clear-selection-button"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                        {errors.location && <p style={errorMessageStyle}>{errors.location}</p>}

                    </section>

                    <section style={{ marginBottom: '25px', padding: '25px', backgroundColor: '#fff', borderRadius: containerBorderRadius, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1px solid ${lightGrayBorder}` }}>
                        <h3 style={sectionHeadingStyle}>Evidence (Optional)</h3>
                        <div style={formGroupStyle} className="file-upload-group">
                            <label htmlFor="evidence" style={labelStyle}>Upload Files (Max 5 files, max 10MB each):</label>
                            <input
                                type="file"
                                id="evidence"
                                name="evidence"
                                multiple
                                onChange={handleFileChange}
                                accept="image/*,video/*,application/pdf"
                                style={fileInputStyle}
                            />
                            <p style={hintTextStyle}>Supported formats: Images (jpg, png, gif), Videos (mp4, mov), PDFs.</p>
                            {reportData.evidence.length > 0 && (
                                <div style={selectedFilesInfoStyle}>
                                    <p>Selected Files:</p>
                                    <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
                                        {Array.from(reportData.evidence).map((file, index) => (
                                            <li key={index}>{file.name} ({file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : (file.size / 1024).toFixed(2) + ' KB'})</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </section>

                    <button type="submit" style={submitButtonStyle} disabled={isSubmitting} className="submit-button">
                        {isSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                </form>
            </div>
        </>
    );
}

export default SubmitReportForm;