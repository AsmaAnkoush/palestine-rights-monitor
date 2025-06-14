// src/SubmitReportForm.js
import React, { useState, useEffect } from "react";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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
                const country = data.address.country || "";

                setReportData(prev => ({
                    ...prev,
                    incident_location_address: address,
                    incident_location_country: country,
                }));
            })
            .catch(err => {
                console.error("Failed to fetch address:", err);
                setReportData(prev => ({
                    ...prev,
                    incident_location_address: `${lat.toFixed(5)}, ${lng.toFixed(5)} (Could not retrieve full address)`,
                    incident_location_country: "",
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
    const [violationOptions, setViolationOptions] = useState([]);
    const [selectedMapCoordinates, setSelectedMapCoordinates] = useState(null);

    const [reportData, setReportData] = useState({
        reporter_type: "victim",
        anonymous: false,
        pseudonym: "",
        contact_info: { email: "", phone: "", preferred_contact: "email" },
        title: "",
        description: "",
        violation_types: [],
        incident_date: "",
        incident_location_country: "",
        incident_location_address: "",
        status: "pending_review",
        priority: "medium",
        evidence: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsClient(true);

        fetch("http://localhost:8006/cases/violation_types?lang=en")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                setViolationOptions(data);
            })
            .catch(err => console.error("Failed to fetch violation types:", err));

    }, []);

    const clearLocationError = () =>
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.location;
            return newErrors;
        });

    const validateForm = () => {
        const newErrors = {};
        const { title, description, incident_date, incident_location_address, violation_types, contact_info, anonymous } = reportData;

        if (!title) newErrors.title = "Report Title is required.";
        if (!description) newErrors.description = "Description is required.";
        if (!incident_date) newErrors.incident_date = "Date of incident is required.";

        if (!selectedMapCoordinates) {
            newErrors.location = "Please select a location on the map.";
        } else if (!incident_location_address) {
            newErrors.location = "Location address could not be determined. Please try clicking on the map again or manually enter coordinates.";
        }

        if (!anonymous && !contact_info.email) newErrors.email = "Email is required if not anonymous.";

        if (violation_types.length === 0) {
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
            }
            else {
                newData[name] = value;
            }
            return newData;
        });

        const fieldNameForError = name.includes('.') ? name.split('.').pop() : name;
        if (errors[fieldNameForError] && ['description', 'title', 'incident_date', 'email', 'phone'].includes(fieldNameForError)) {
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
            violation_types: selectedOptions,
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

        const formData = new FormData();

        formData.append("reporter_type", reportData.reporter_type);
        formData.append("anonymous", reportData.anonymous);
        formData.append("pseudonym", reportData.pseudonym || "");
        formData.append("status", reportData.status);
        formData.append("priority", reportData.priority);
        formData.append("created_by", localStorage.getItem("username") || "anonymous");

        formData.append("title", reportData.title);
        formData.append("description", reportData.description);
        formData.append("violation_type", reportData.violation_types.join(','));

        let formattedIncidentDate = "";
        if (reportData.incident_date) {
            const dateObj = new Date(reportData.incident_date);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            formattedIncidentDate = `${year}-${month}-${day}`;
        }
        formData.append("incident_date", formattedIncidentDate);

        formData.append("incident_location_country", reportData.incident_location_country || "Palestine");
        formData.append("incident_location_address", reportData.incident_location_address || "");

        const coords = selectedMapCoordinates
            ? { type: "Point", coordinates: [selectedMapCoordinates[1], selectedMapCoordinates[0]] }
            : { type: "Point", coordinates: [null, null] };
        formData.append("incident_location_coordinates", JSON.stringify(coords));

        if (!reportData.anonymous) {
            formData.append("contact_info", JSON.stringify(reportData.contact_info));
        }

        if (reportData.evidence && reportData.evidence.length > 0) {
            Array.from(reportData.evidence).forEach((file) => {
                formData.append("evidence", file);
            });
        }

        try {
            const token = localStorage.getItem("jwt_token");
            const res = await fetch("http://localhost:8006/reports/", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token || ""}`
                },
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) {
                let errorMessage = "Failed to submit report.";
                if (result.detail) {
                    if (Array.isArray(result.detail)) {
                        errorMessage = result.detail.map(err => {
                            const loc = err.loc.join(' -> ');
                            const msg = err.msg;
                            return `${loc}: ${msg}`;
                        }).join('\n');
                    } else if (typeof result.detail === 'string') {
                        errorMessage = result.detail;
                    }
                }
                throw new Error(errorMessage);
            }

            alert("Report submitted successfully! Report ID: " + result.report_id);
            console.log("Report created:", result.report_id);

            setReportData({
                reporter_type: "victim",
                anonymous: false,
                pseudonym: "",
                contact_info: { email: "", phone: "", preferred_contact: "email" },
                title: '',
                description: '',
                violation_types: [],
                incident_date: '',
                incident_location_country: '',
                incident_location_address: '',
                status: "pending_review",
                priority: "medium",
                evidence: [],
            });
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

    const primaryOrange = '#ff9800';
    const darkOrange = '#e65100';
    const lightOrange = '#fff3e0';
    const darkText = '#4e342e';
    const lightGrayBorder = '#ffe0b2';

    const inputBorderRadius = '6px';
    const buttonBorderRadius = '8px';
    const containerBorderRadius = '12px';

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
        width: 'calc(100% - 20px)',
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
        height: '40px',
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
        color: '#d32f2f',
        fontSize: '0.85em',
        marginTop: '5px',
        borderLeft: '3px solid #d32f2f',
        paddingLeft: '5px',
    };

    const formErrorsBoxStyle = {
        color: '#d32f2f',
        marginBottom: '20px',
        border: '1px solid #ef9a9a',
        padding: '15px',
        borderRadius: '8px',
        background: '#ffebee',
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
                                    </select>
                                </div>
                            </>
                        )}
                    </section>

                    <section style={{ marginBottom: '25px', padding: '25px', backgroundColor: '#fff', borderRadius: containerBorderRadius, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1px solid ${lightGrayBorder}` }}>
                        <h3 style={sectionHeadingStyle}>Incident Details</h3>

                        <div style={formGroupStyle}>
                            <label htmlFor="title" style={labelStyle}>Report Title:</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={reportData.title}
                                onChange={handleChange}
                                placeholder="Summarize the incident"
                                style={inputStyle}
                                required
                            />
                            {errors.title && <p style={errorMessageStyle}>{errors.title}</p>}
                        </div>

                        <div style={formGroupStyle}>
                            <label htmlFor="description" style={labelStyle}>Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                value={reportData.description}
                                onChange={handleChange}
                                placeholder="Provide detailed information about the incident..."
                                rows="5"
                                style={textareaStyle}
                                required
                            />
                            {errors.description && <p style={errorMessageStyle}>{errors.description}</p>}
                        </div>

                        <div style={formGroupStyle}>
                            <label htmlFor="violation_types" style={labelStyle}>Violation Types:</label>
                            <select
                                id="violation_types"
                                name="violation_types"
                                multiple
                                value={reportData.violation_types}
                                onChange={handleViolationTypesChange}
                                style={{ ...selectStyle, height: 'auto', minHeight: '100px' }}
                                required
                            >
                                {violationOptions.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            {errors.violation_types && <p style={errorMessageStyle}>{errors.violation_types}</p>}
                            <p style={hintTextStyle}>Hold Ctrl/Cmd to select multiple types.</p>
                        </div>

                        <div style={formGroupStyle}>
                            <label htmlFor="incident_date" style={labelStyle}>Date of Incident:</label>
                            <input
                                type="date"
                                id="incident_date"
                                name="incident_date"
                                value={reportData.incident_date}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                            />
                            {errors.incident_date && <p style={errorMessageStyle}>{errors.incident_date}</p>}
                        </div>

                        <div style={formGroupStyle}>
                            <h4 style={subHeadingStyle}>Incident Location:</h4>
                            {isClient ? (
                                <LocationPicker
                                    selectedMapCoordinates={selectedMapCoordinates}
                                    setSelectedMapCoordinates={setSelectedMapCoordinates}
                                    setReportData={setReportData}
                                    clearLocationError={clearLocationError}
                                />
                            ) : (
                                <div style={mapLoadingPlaceholderStyle}>
                                    Loading Map...
                                </div>
                            )}
                            {errors.location && <p style={errorMessageStyle}>{errors.location}</p>}

                            {selectedMapCoordinates && (
                                <div style={selectedCoordinatesStyle} className="selected-coordinates">
                                    <span>
                                        Selected: {selectedMapCoordinates[0].toFixed(5)}, {selectedMapCoordinates[1].toFixed(5)}
                                        {reportData.incident_location_address && ` (${reportData.incident_location_address})`}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMapCoordinates(null);
                                            setReportData(prev => ({
                                                ...prev,
                                                incident_location_address: "",
                                                incident_location_country: ""
                                            }));
                                            setErrors(prev => ({ ...prev, location: "Please select a location on the map." }));
                                        }}
                                        style={clearSelectionButtonStyle}
                                        className="clear-selection-button"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            )}
                            <p style={hintTextStyle}>Click on the map to select the incident location.</p>
                            <div style={formGroupStyle}>
                                <label htmlFor="incident_location_address" style={labelStyle}>Location Address (Auto-filled):</label>
                                <input
                                    type="text"
                                    id="incident_location_address"
                                    name="incident_location_address"
                                    value={reportData.incident_location_address}
                                    onChange={handleChange}
                                    placeholder="Address will be filled from map selection"
                                    style={inputStyle}
                                    readOnly
                                />
                            </div>
                            <div style={formGroupStyle}>
                                <label htmlFor="incident_location_country" style={labelStyle}>Country (Auto-filled):</label>
                                <input
                                    type="text"
                                    id="incident_location_country"
                                    name="incident_location_country"
                                    value={reportData.incident_location_country}
                                    onChange={handleChange}
                                    placeholder="Country will be filled from map selection"
                                    style={inputStyle}
                                    readOnly
                                />
                            </div>
                        </div>
                    </section>

                    <section style={{ marginBottom: '25px', padding: '25px', backgroundColor: '#fff', borderRadius: containerBorderRadius, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1px solid ${lightGrayBorder}` }}>
                        <h3 style={sectionHeadingStyle}>Evidence (Optional)</h3>
                        <div style={formGroupStyle} className="file-upload-group">
                            <label htmlFor="evidence_files" style={labelStyle}>Upload Files (Images, Videos, Documents - Max 5 files):</label>
                            <input
                                type="file"
                                id="evidence_files"
                                name="evidence_files"
                                multiple
                                accept="image/*,video/*,.pdf,.doc,.docx"
                                onChange={handleFileChange}
                                style={fileInputStyle}
                            />
                            {reportData.evidence.length > 0 && (
                                <div style={selectedFilesInfoStyle}>
                                    Selected files: {reportData.evidence.map(file => file.name).join(', ')}
                                </div>
                            )}
                            <p style={hintTextStyle}>Supported formats: JPG, PNG, GIF, MP4, MOV, PDF, DOCX.</p>
                        </div>
                    </section>

                    <button type="submit" disabled={isSubmitting} style={submitButtonStyle} className="submit-button">
                        {isSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                </form>
            </div>
        </>
    );
}

export default SubmitReportForm;