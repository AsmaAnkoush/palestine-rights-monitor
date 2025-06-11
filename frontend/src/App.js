import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Hero from './Components/Hero';
import Login from './Components/Login';
import VictimDetailsPage from './pages/VictimDetailsPage'; // تأكد من وجود الملف

// Admin-specific pages
import AdminDashboard from './pages/AdminDashboard'; // Assuming this is Admin's main layout
import CasesPage from './Components/Cases/CasesPage';
import CaseForm from './Components/Cases/CaseForm';
import CaseDetailsPage from './Components/Cases/CaseDetailsPage';
import EditCasePage from './Components/Cases/EditCasePage';
import IncidentReportsPage from './pages/IncidentReportsPage'; // Corrected path based on your file structure
import VictimsPage from './pages/VictimsPage'; // Import the new VictimsPage

// Institution-specific pages
import InstitutionDashboard from './pages/InstitutionDashboard'; // Institution's main layout
import SubmitReportForm from './SubmitReportForm'; // تأكد أن المسار صحيح بناءً على مكان SubmitReportForm.js

import Navbar from './Components/Navbar';

function App() {
  return (
    <Router>
      {/* ✅ يظهر دائماً في كل الصفحات */}
      <Navbar />

      <Routes>
        {/* 🌐 صفحات عامة */}
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />

        {/* 🧑‍💻 صفحات المشرف */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="cases" replace />} /> {/* Default route for /admin */}
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/new" element={<CaseForm />} />
          <Route path="cases/:id" element={<CaseDetailsPage />} />
          <Route path="cases/:id/edit" element={<EditCasePage />} />
          {/* Route for Incident Reports page */}
          <Route path="reports" element={<IncidentReportsPage />} />
          {/* New route for VictimsPage */}
          <Route path="victims" element={<VictimsPage />} />
          <Route path="victims/:id" element={<VictimDetailsPage />} />

          {/* Add other admin-specific routes here, e.g., analytics, user management */}
        </Route>

        {/* 🏫 صفحات المؤسسة */}
        <Route path="/institution" element={<InstitutionDashboard />}>
          {/* توجيه المسار الافتراضي للمؤسسة مباشرة إلى add-report */}
          <Route index element={<Navigate to="add-report" replace />} />
          {/* ✅ استخدام SubmitReportForm كـ component للمسار /institution/add-report */}
          <Route path="add-report" element={<SubmitReportForm />} />
          {/* تم إزالة المسارات الأخرى مثل "cases" و "reports" لأنك تريد فقط صفحة تقديم الريبورت هنا */}
        </Route>

        {/* Fallback for undefined routes */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
