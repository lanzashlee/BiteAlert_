import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Dashboards
import Dashboard from './components/Dashboard/Dashboard';

// Admin - Using SuperAdmin Components with Role-Based Access

// Super Admin
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import SuperAdminProfile from './components/SuperAdmin/SuperAdminProfile';
import SuperAdminStock from './components/SuperAdmin/SuperAdminStock';
import SuperAdminGenerate from './components/SuperAdmin/SuperAdminGenerate';
import SuperAdminCreateAccount from './components/SuperAdmin/SuperAdminCreateAccount';
import SuperAdminAuditTrail from './components/SuperAdmin/SuperAdminAuditTrail';
import SuperAdminAccountManagement from './components/SuperAdmin/SuperAdminAccountManagement';
import SuperAdminCenter from './components/SuperAdmin/SuperAdminCenter';
import SuperAdminCenterArchive from './components/SuperAdmin/SuperAdminCenterArchive';
import SuperAdminCenterHours from './components/SuperAdmin/SuperAdminCenterHours';
import SuperAdminStaffManagement from './components/SuperAdmin/SuperAdminStaffManagement';
import SuperAdminPatientManagement from './components/SuperAdmin/SuperAdminPatientManagement';
import SuperAdminVaccinationSchedule from './components/SuperAdmin/SuperAdminVaccinationSchedule';
import SuperAdminPatients from './components/SuperAdmin/SuperAdminPatients';
import SuperAdminPrescriptiveAnalytics from './components/SuperAdmin/SuperAdminPrescriptiveAnalytics';
import PatientDiagnosisManagement from './components/SuperAdmin/PatientDiagnosisManagement';

// Analytics - Removed non-existent import

// Auth pages
import ActivateAccount from './components/Auth/ActivateAccount';
import CreateAccount from './components/Auth/CreateAccount';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* General dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Admin - Using SuperAdmin Components with Role-Based Access */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/management" element={<ProtectedRoute requiredRole="admin"><SuperAdminStaffManagement /></ProtectedRoute>} />
        <Route path="/admin/staff-management" element={<ProtectedRoute requiredRole="admin"><SuperAdminStaffManagement /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute requiredRole="admin"><SuperAdminProfile /></ProtectedRoute>} />
        <Route path="/admin/stock" element={<ProtectedRoute requiredRole="admin"><SuperAdminStock /></ProtectedRoute>} />
        <Route path="/admin/center" element={<ProtectedRoute requiredRole="admin"><SuperAdminCenter /></ProtectedRoute>} />
        <Route path="/admin/center-archive" element={<ProtectedRoute requiredRole="admin"><SuperAdminCenterArchive /></ProtectedRoute>} />
        <Route path="/admin/audit-trail" element={<ProtectedRoute requiredRole="admin"><SuperAdminAuditTrail /></ProtectedRoute>} />
        <Route path="/admin/generate-report" element={<ProtectedRoute requiredRole="admin"><SuperAdminGenerate /></ProtectedRoute>} />
        <Route path="/admin/center-hours" element={<ProtectedRoute requiredRole="admin"><SuperAdminCenterHours /></ProtectedRoute>} />
        <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><SuperAdminPatients /></ProtectedRoute>} />
        <Route path="/admin/patient-management" element={<ProtectedRoute requiredRole="admin"><SuperAdminPatientManagement /></ProtectedRoute>} />
        <Route path="/admin/vaccination-schedule" element={<ProtectedRoute requiredRole="admin"><SuperAdminVaccinationSchedule /></ProtectedRoute>} />
        <Route path="/admin/create-account" element={<ProtectedRoute requiredRole="admin"><SuperAdminCreateAccount /></ProtectedRoute>} />
        <Route path="/admin/prescriptive-analytics" element={<ProtectedRoute requiredRole="admin"><SuperAdminPrescriptiveAnalytics /></ProtectedRoute>} />

        {/* Super Admin */}
        <Route path="/superadmin" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/superadmin/dashboard" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/superadmin/profile" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminProfile /></ProtectedRoute>} />
        <Route path="/superadmin/stock" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminStock /></ProtectedRoute>} />
        <Route path="/superadmin/generate" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminGenerate /></ProtectedRoute>} />
        <Route path="/superadmin/create-account" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminCreateAccount /></ProtectedRoute>} />
        <Route path="/superadmin/audit-trail" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminAuditTrail /></ProtectedRoute>} />
        <Route path="/superadmin/account-management" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminAccountManagement /></ProtectedRoute>} />
        <Route path="/superadmin/center" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminCenter /></ProtectedRoute>} />
        <Route path="/superadmin/center-archive" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminCenterArchive /></ProtectedRoute>} />
        <Route path="/superadmin/center-hours" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminCenterHours /></ProtectedRoute>} />
        <Route path="/superadmin/staff-management" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminStaffManagement /></ProtectedRoute>} />
        <Route path="/superadmin/patient-management" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminPatientManagement /></ProtectedRoute>} />
        <Route path="/superadmin/vaccination-schedule" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminVaccinationSchedule /></ProtectedRoute>} />
        <Route path="/superadmin/patients" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminPatients /></ProtectedRoute>} />
        <Route path="/superadmin/prescriptive-analytics" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminPrescriptiveAnalytics /></ProtectedRoute>} />
        <Route path="/superadmin/diagnosis" element={<ProtectedRoute requiredRole="superadmin"><PatientDiagnosisManagement /></ProtectedRoute>} />

        {/* Analytics - Removed non-existent route */}

        {/* Auth */}
        <Route path="/activate-account" element={<ActivateAccount />} />
        <Route path="/create-account" element={<CreateAccount />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;


