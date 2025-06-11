import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Hero from './Components/Hero';
import Login from './Components/Login';
import VictimDetailsPage from './pages/VictimDetailsPage';

// Admin-specific pages
import AdminDashboard from './pages/AdminDashboard';
import CasesPage from './Components/Cases/CasesPage';
import CaseForm from './Components/Cases/CaseForm';
import CaseDetailsPage from './Components/Cases/CaseDetailsPage';
import EditCasePage from './Components/Cases/EditCasePage';
import IncidentReportsPage from './pages/IncidentReportsPage';
import VictimsPage from './pages/VictimsPage';
import VictimsByCase from './Components/VictimsByCase';
import CasesVictimsOverviewPage from './pages/CasesVictimsOverviewPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'; // ✅ Import the new Analytics Dashboard component

// Institution-specific pages
import InstitutionDashboard from './pages/InstitutionDashboard';
import SubmitReportForm from './SubmitReportForm';

import Navbar from './Components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* 🌐 Public Pages */}
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />

        {/* 🧑‍💻 Admin Pages */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="cases" replace />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/new" element={<CaseForm />} />
          <Route path="cases/:id" element={<CaseDetailsPage />} />
          <Route path="cases/:id/edit" element={<EditCasePage />} />
          <Route path="reports" element={<IncidentReportsPage />} />
          <Route path="victims" element={<VictimsPage />} />
          <Route path="victims/:id" element={<VictimDetailsPage />} />
          <Route path="victims/case/:caseId" element={<VictimsByCase />} />
          <Route path="cases-victims-overview" element={<CasesVictimsOverviewPage />} />
          {/* ✅ New route for the Analytics Dashboard page */}
          <Route path="analytics" element={<AnalyticsDashboardPage />} />
        </Route>

        {/* 🏫 Institution Pages */}
        <Route path="/institution" element={<InstitutionDashboard />}>
          {/*
            ✅ Updated:
            - The index route now redirects to "reports/new" for consistency.
            - The SubmitReportForm route is now "reports/new" to match the InstitutionDashboard's menu item.
          */}
          <Route index element={<Navigate to="reports/new" replace />} />
          <Route path="reports/new" element={<SubmitReportForm />} />
        </Route>

        {/* Fallback for undefined routes */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;