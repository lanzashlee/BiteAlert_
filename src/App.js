import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Home & Auth
import Home from './components/Home/Home.jsx';
import Login from './components/Auth/Login';

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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* General dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Admin - Using SuperAdmin Components with Role-Based Access */}
        <Route path="/admin" element={<SuperAdminDashboard />} />
        <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/admin/management" element={<SuperAdminStaffManagement />} />
        <Route path="/admin/staff-management" element={<SuperAdminStaffManagement />} />
        <Route path="/admin/profile" element={<SuperAdminProfile />} />
        <Route path="/admin/stock" element={<SuperAdminStock />} />
        <Route path="/admin/center" element={<SuperAdminCenter />} />
        <Route path="/admin/center-archive" element={<SuperAdminCenterArchive />} />
        <Route path="/admin/audit-trail" element={<SuperAdminAuditTrail />} />
        <Route path="/admin/generate-report" element={<SuperAdminGenerate />} />
        <Route path="/admin/center-hours" element={<SuperAdminCenterHours />} />
        <Route path="/admin/patients" element={<SuperAdminPatients />} />
        <Route path="/admin/patient-management" element={<SuperAdminPatientManagement />} />
        <Route path="/admin/vaccination-schedule" element={<SuperAdminVaccinationSchedule />} />
        <Route path="/admin/create-account" element={<SuperAdminCreateAccount />} />
        <Route path="/admin/prescriptive-analytics" element={<SuperAdminPrescriptiveAnalytics />} />

        {/* Super Admin */}
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/profile" element={<SuperAdminProfile />} />
        <Route path="/superadmin/stock" element={<SuperAdminStock />} />
        <Route path="/superadmin/generate" element={<SuperAdminGenerate />} />
        <Route path="/superadmin/create-account" element={<SuperAdminCreateAccount />} />
        <Route path="/superadmin/audit-trail" element={<SuperAdminAuditTrail />} />
        <Route path="/superadmin/account-management" element={<SuperAdminAccountManagement />} />
        <Route path="/superadmin/center" element={<SuperAdminCenter />} />
        <Route path="/superadmin/center-archive" element={<SuperAdminCenterArchive />} />
        <Route path="/superadmin/center-hours" element={<SuperAdminCenterHours />} />
        <Route path="/superadmin/staff-management" element={<SuperAdminStaffManagement />} />
        <Route path="/superadmin/patient-management" element={<SuperAdminPatientManagement />} />
        <Route path="/superadmin/vaccination-schedule" element={<SuperAdminVaccinationSchedule />} />
        <Route path="/superadmin/patients" element={<SuperAdminPatients />} />
        <Route path="/superadmin/prescriptive-analytics" element={<SuperAdminPrescriptiveAnalytics />} />
        <Route path="/superadmin/diagnosis" element={<PatientDiagnosisManagement />} />

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


