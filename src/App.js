import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Critical components - loaded immediately
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import UnifiedSpinner from './components/Common/UnifiedSpinner';

// Lazy load non-critical components for code splitting
const SuperAdminDashboard = React.lazy(() => import('./components/SuperAdmin/SuperAdminDashboard'));
const SuperAdminProfile = React.lazy(() => import('./components/SuperAdmin/SuperAdminProfile'));
const SuperAdminStock = React.lazy(() => import('./components/SuperAdmin/SuperAdminStock'));
const SuperAdminGenerate = React.lazy(() => import('./components/SuperAdmin/SuperAdminGenerate'));
const SuperAdminCreateAccount = React.lazy(() => import('./components/SuperAdmin/SuperAdminCreateAccount'));
const SuperAdminAuditTrail = React.lazy(() => import('./components/SuperAdmin/SuperAdminAuditTrail'));
const SuperAdminAccountManagement = React.lazy(() => import('./components/SuperAdmin/SuperAdminAccountManagement'));
const SuperAdminCenter = React.lazy(() => import('./components/SuperAdmin/SuperAdminCenter'));
const SuperAdminCenterArchive = React.lazy(() => import('./components/SuperAdmin/SuperAdminCenterArchive'));
const SuperAdminCenterHours = React.lazy(() => import('./components/SuperAdmin/SuperAdminCenterHours'));
const SuperAdminStaffManagement = React.lazy(() => import('./components/SuperAdmin/SuperAdminStaffManagement'));
const SuperAdminPatientManagement = React.lazy(() => import('./components/SuperAdmin/SuperAdminPatientManagement'));
const SuperAdminVaccinationSchedule = React.lazy(() => import('./components/SuperAdmin/SuperAdminVaccinationSchedule'));
const SuperAdminPatients = React.lazy(() => import('./components/SuperAdmin/SuperAdminPatients'));
const SuperAdminPrescriptiveAnalytics = React.lazy(() => import('./components/SuperAdmin/SuperAdminPrescriptiveAnalytics'));
const PatientDiagnosisManagement = React.lazy(() => import('./components/SuperAdmin/PatientDiagnosisManagement'));
const ActivateAccount = React.lazy(() => import('./components/Auth/ActivateAccount'));
const CreateAccount = React.lazy(() => import('./components/Auth/CreateAccount'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <UnifiedSpinner text="Loading application..." />
);

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
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
      </Suspense>
    </BrowserRouter>
  );
};

export default App;


