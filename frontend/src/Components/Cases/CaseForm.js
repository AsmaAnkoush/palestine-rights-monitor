import React, { useState } from 'react';
import api from '../../api';

const CaseForm = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    violation_types: [],
    status: 'new',
    priority: 'medium',
    country: '',
    region: '',
    date_occurred: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]); // <-- جديد: حالة لتخزين الملفات المختارة
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleViolationsInput = (e) => {
    const values = e.target.value.split(',').map((v) => v.trim());
    setForm((prev) => ({ ...prev, violation_types: values }));
  };

  // <-- دالة جديدة للتعامل مع اختيار الملفات
  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files)); // تحويل FileList إلى Array
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(''); // مسح الرسالة السابقة

    const formData = new FormData(); // <-- استخدم FormData لإرسال الملفات والبيانات معاً

    // 1. إضافة حقول النموذج النصية إلى FormData
    // **مهم:** يجب أن تتطابق أسماء الحقول هنا ('title', 'description', إلخ) 
    // مع أسماء البارامترات في دالة create_case في الـ Backend (مثال: title: str = Form(...))
    formData.append('title', form.title);
    formData.append('description', form.description);
    // 'violation_types' يتم إرسالها كسلسلة مفصولة بفاصلة
    formData.append('violation_types', form.violation_types.join(',')); 
    formData.append('status', form.status);
    formData.append('priority', form.priority);
    formData.append('country', form.country);
    formData.append('region', form.region);
    formData.append('date_occurred', form.date_occurred);

    // 2. إضافة الملفات المختارة إلى FormData
    // 'files' يجب أن تتطابق مع اسم البارامتر في الـ Backend (files: List[UploadFile] = File(None))
    selectedFiles.forEach((file) => {
      formData.append('files', file); 
    });

    try {
      // <-- أرسل FormData مباشرةً. Axios سيقوم تلقائياً بتعيين 'Content-Type: multipart/form-data'
      await api.post('/cases/', formData, {
        headers: {
          // رغم أن Axios يضبطها تلقائياً، يمكن تحديدها بوضوح لزيادة الوضوح
          'Content-Type': 'multipart/form-data', 
        },
      });

      setSuccessMessage('✅ Case created successfully!');
      // مسح النموذج بعد النجاح
      setForm({
        title: '',
        description: '',
        violation_types: [],
        status: 'new',
        priority: 'medium',
        country: '',
        region: '',
        date_occurred: '',
      });
      setSelectedFiles([]); // <-- مسح الملفات المختارة بعد الرفع الناجح
    } catch (err) {
      console.error('❌ Error creating case:', err.response ? err.response.data : err);
      alert('❌ Error creating case');
    }
  };

  const inputStyle = {
    padding: '12px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '10px',
    fontSize: '15px',
    width: '100%',
    color: '#333',
  };

  const labelStyle = {
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
    fontSize: '14px',
  };

  const fieldRow = {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    alignItems: 'center',
  };

  const formContainerStyle = {
    width: '100%',
    maxWidth: '700px',
    backgroundColor: '#fffbe6',
    padding: '2.5rem',
    borderRadius: '20px',
    marginTop: '-2rem',
    marginInlineStart: '2rem',
    boxShadow: '0 6px 25px rgba(0,0,0,0.1)',
  };

  const buttonStyle = {
    padding: '14px',
    backgroundColor: '#ff9800',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'background-color 0.3s ease',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '3rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={formContainerStyle}>
        <h2 style={{ fontSize: '28px', marginBottom: '1rem', textAlign: 'center', color: '#e65100' }}>
          🎯 Create New Case
        </h2>

        {successMessage && (
          <div style={{
            backgroundColor: '#dff0d8',
            color: '#3c763d',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '1px solid #d6e9c6',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input name="title" value={form.title} onChange={handleChange} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Violation Types (comma-separated)</label>
            <input value={form.violation_types.join(', ')} onChange={handleViolationsInput} style={inputStyle} />
          </div>

          <div style={fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                <option value="new">New</option>
                <option value="under_investigation">Under Investigation</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Country</label>
              <input name="country" value={form.country} onChange={handleChange} style={inputStyle} />
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Region</label>
              <input name="region" value={form.region} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Date Occurred</label>
            <input type="date" name="date_occurred" value={form.date_occurred} onChange={handleChange} style={inputStyle} />
          </div>

          {/* <-- حقل جديد لرفع الملفات --> */}
          <div>
            <label style={labelStyle}>Attachments (Images, PDFs, Videos, etc.)</label>
            <input
              type="file"
              multiple // للسماح باختيار ملفات متعددة
              onChange={handleFileChange}
              style={{ ...inputStyle, padding: '8px', cursor: 'pointer' }}
            />
            {/* عرض أسماء الملفات المختارة للمستخدم */}
            {selectedFiles.length > 0 && (
              <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                Selected: {selectedFiles.map(file => file.name).join(', ')}
              </p>
            )}
          </div>
          {/* نهاية حقل رفع الملفات */}

          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#ffa726')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#ff9800')}
          >
            🚀 Submit Case
          </button>
        </form>
      </div>
    </div>
  );
};

export default CaseForm;