import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiConfig } from '../../config/api';

import ResponsiveSidebar from './ResponsiveSidebar';

import UnifiedModal from '../UnifiedModal';

import { getUserCenter, filterByCenter } from '../../utils/userContext';

import './SuperAdminPatientManagement.css';



const SuperAdminPatientManagement = () => {

  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [centerOptions, setCenterOptions] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);

  const [notification, setNotification] = useState(null);

  const [showSignoutModal, setShowSignoutModal] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  

  // Password change modal states

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');

  const [newPassword, setNewPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState('');

  const [showAdminInfo, setShowAdminInfo] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);



  // Show notification

  const showNotification = (message, type = 'success') => {

    setNotification({ message, type });

    setTimeout(() => setNotification(null), 3000);

  };



  // Custom confirmation modal

  const customConfirm = (message, actionObj) => {

    setConfirmAction({ message, action: actionObj.action });

    setShowConfirmModal(true);

  };



  const handleConfirm = async () => {

    try {

      setIsProcessing(true);

      if (confirmAction && confirmAction.action && typeof confirmAction.action === 'function') {

        await confirmAction.action();

      } else {

        console.error('Invalid action in confirmAction:', confirmAction);

      }

    } catch (error) {

      console.error('Error executing confirm action:', error);

      showNotification('Error executing action', 'error');

    } finally {

      setIsProcessing(false);

      setShowConfirmModal(false);

      setConfirmAction(null);

    }

  };



  const handleCancel = () => {

    setShowConfirmModal(false);

    setConfirmAction(null);

  };



  // Handle password change

  const handlePasswordChange = (patientId) => {

    const patient = patients.find(p => p._id === patientId);

    setSelectedPatient(patient);

    setCurrentPassword('');

    setNewPassword('');

    setConfirmPassword('');

    setPasswordError('');

    setShowAdminInfo(false);

    setShowPasswordModal(true);

  };



  // Handle new password input change

  const handleNewPasswordChange = async (value) => {

    setNewPassword(value);

    

    // Show admin info and fetch current password when user starts typing

    if (value.length > 0 && !showAdminInfo) {

      setShowAdminInfo(true);

      

      try {

        // Fetch current password for display
        const response = await apiFetch(`/api/get-patient-password/${selectedPatient._id}`);

        if (response.ok) {

          const data = await response.json();

          setCurrentPassword(data.currentPassword || '••••••••');

        } else {

          setCurrentPassword('••••••••');

        }

      } catch (error) {

        console.error('Error fetching current password:', error);

        setCurrentPassword('••••••••');

      }

    }

  };



  // Validate password

  const validatePassword = (password) => {

    if (password.length < 8) {

      return 'Password must be at least 8 characters long';

    }

    if (!/(?=.*[a-z])/.test(password)) {

      return 'Password must contain at least one lowercase letter';

    }

    if (!/(?=.*[A-Z])/.test(password)) {

      return 'Password must contain at least one uppercase letter';

    }

    if (!/(?=.*\d)/.test(password)) {

      return 'Password must contain at least one number';

    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {

      return 'Password must contain at least one special character (@$!%*?&)';

    }

    return '';

  };



  // Confirm password change

  const confirmPasswordChange = async () => {

    try {

      setPasswordError('');

      

      // Validate passwords

      const passwordValidation = validatePassword(newPassword);

      if (passwordValidation) {

        setPasswordError(passwordValidation);

        return;

      }

      

      if (newPassword !== confirmPassword) {

        setPasswordError('Passwords do not match');

        return;

      }



      setIsProcessing(true);



      // API call to change password

      const response = await apiFetch('/api/change-patient-password', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ 

          patientId: selectedPatient._id, 

          newPassword: newPassword 

        })

      });



      if (!response.ok) {

        throw new Error('Failed to change password');

      }



      // Log audit trail

      await logAuditTrail(selectedPatient._id, `Password changed for patient: ${selectedPatient.fullName || selectedPatient.firstName + ' ' + selectedPatient.lastName}`);



      showNotification('Password changed successfully', 'success');

      setShowPasswordModal(false);

      setCurrentPassword('');

      setNewPassword('');

      setConfirmPassword('');

      setShowAdminInfo(false);

      setSelectedPatient(null);

      

    } catch (error) {

      console.error('Error changing password:', error);

      showNotification(error.message || 'Error changing password', 'error');

    } finally {

      setIsProcessing(false);

    }

  };



  // Log audit trail

  const logAuditTrail = async (patientId, action) => {

    try {

      const currentUser = JSON.parse(localStorage.getItem('currentUser'));

      

      apiFetch('/api/audit-trail', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          userId: currentUser?.id || patientId,

          role: currentUser?.role || 'system',

          fullName: currentUser?.fullName || 'System',

          action,

          timestamp: new Date().toISOString()

        })

      }).catch(error => console.error('Error logging audit trail:', error));

      

      return { success: true };

    } catch (error) {

      console.error('Error in logAuditTrail:', error);

      return { success: false };

    }

  };



  // Close password modal

  const closePasswordModal = () => {

    setShowPasswordModal(false);

    setSelectedPatient(null);

    setCurrentPassword('');

    setNewPassword('');

    setConfirmPassword('');

    setPasswordError('');

    setShowAdminInfo(false);

    setIsProcessing(false);

  };



  // Handle sign out

  const handleSignOut = () => {

    setShowSignoutModal(true);

  };



  // Confirm sign out

  const confirmSignOut = async () => {

    try {

      let currentUser = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData'));

      

      if (currentUser && currentUser.email) {

        try {

          const res = await fetch(`/api/account-status/${encodeURIComponent(currentUser.email)}`);

          if (res.ok) {

            const data = await res.json();

            if (data.success && data.account) {

              currentUser = { ...currentUser, ...data.account };

            }

          }

        } catch (err) {

          console.warn('Failed to fetch account status for logout:', err);

        }

      }



      if (!currentUser) {

        throw new Error('No active session found');

      }



      const logoutData = {

        role: currentUser.role,

        firstName: currentUser.firstName,

        middleName: currentUser.middleName || '',

        lastName: currentUser.lastName,

        action: 'Signed out'

      };



      if (currentUser.role === 'admin' && currentUser.adminID) {

        logoutData.adminID = currentUser.adminID;

      } else if (currentUser.role === 'superadmin' && currentUser.superAdminID) {

        logoutData.superAdminID = currentUser.superAdminID;

      }



      try {

        await apiFetch('/api/logout', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(logoutData)

        });

      } catch (err) {

        console.warn('Logout API call failed:', err);

      }



      localStorage.removeItem('currentUser');

      localStorage.removeItem('userData');

      localStorage.removeItem('token');

      

      window.location.replace('/login');

    } catch (error) {

      console.error('Error during sign out:', error);

      alert(error.message || 'Error signing out. Please try again.');

    } finally {

      setShowSignoutModal(false);

    }

  };



  useEffect(() => {

    const fetchPatients = async () => {

      try {

        setLoading(true);

        const userCenter = getUserCenter();
        
        // Build API URL with center filter for non-superadmin users
        let apiUrl = `${apiConfig.endpoints.patients}?page=1&limit=1000`;
        if (userCenter && userCenter !== 'all') {
          apiUrl += `&center=${encodeURIComponent(userCenter)}`;
        }

        const res = await apiFetch(apiUrl);

        const data = await res.json();

        if (data.success) {

          // Apply additional client-side filtering if needed
          const allPatients = data.data || [];
          const filteredPatients = filterByCenter(allPatients, 'center');

          // Derive center directly from common fields
          const withCenterDerived = filteredPatients.map(p => ({
            ...p,
            center: p.center || p.centerName || p.healthCenter || p.facility || p.treatmentCenter || p.clinic || p.hospital || p.locationCenter || p.centerID || p.centerId || p.center_id || ''
          }));

          // If some patients still lack center, try to enrich from bitecases
          const needsEnrich = withCenterDerived.some(p => !p.center);
          if (needsEnrich) {
            try {
              const bcRes = await apiFetch(apiConfig.endpoints.bitecases);
              const bcJson = await bcRes.json();
              const cases = Array.isArray(bcJson) ? bcJson : (Array.isArray(bcJson.data) ? bcJson.data : []);
              const byPatientId = new Map();
              (cases || []).forEach(c => {
                const pid = String(c.patientId || c.patientID || c.pid || '').trim();
                const centerName = c.center || c.centerName || c.healthCenter || c.facility || c.treatmentCenter || '';
                if (pid && centerName && !byPatientId.has(pid)) byPatientId.set(pid, centerName);
              });
              const enriched = withCenterDerived.map(p => {
                if (p.center) return p;
                const pid = String(p._id || p.patientId || p.patientID || '').trim();
                const fromCase = (pid && byPatientId.get(pid)) || '';
                return { ...p, center: fromCase || '' };
              });
              setPatients(enriched);
            } catch (_) {
              setPatients(withCenterDerived);
            }
          } else {
            setPatients(withCenterDerived);
          }

        } else {

          showNotification('Failed to load patient data', 'error');

        }

      } catch (error) {

        console.error('Error fetching patients:', error);

        showNotification('Error loading patient data', 'error');

      } finally {

        setLoading(false);

      }

    };

    fetchPatients();

  }, []);

  // Load centers for dropdown
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await apiFetch('/api/centers');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        const names = Array.from(new Set((list || [])
          .filter(c => !c.isArchived)
          .map(c => String(c.centerName || c.name || '').trim())
          .filter(Boolean)))
          .sort((a,b)=>a.localeCompare(b));
        setCenterOptions(names);
      } catch (_) {
        setCenterOptions([]);
      }
    };
    fetchCenters();
  }, []);



  // Filtered patient data

  const filteredPatients = useMemo(() => {

    let filteredPatients = patients;



    // Search filter

    if (searchTerm.trim()) {

      const searchLower = searchTerm.toLowerCase();

      filteredPatients = filteredPatients.filter(p => 

        [p.fullName, p.email, p.phone, p.patientId, p.firstName, p.lastName]

          .filter(Boolean)

          .some(v => String(v).toLowerCase().includes(searchLower))

      );

    }



    // Status filter

    if (statusFilter) {

      filteredPatients = filteredPatients.filter(p => {

        if (statusFilter === 'pending') return !p.isVerified;

        if (statusFilter === 'active') return p.isVerified && p.status !== 'Inactive';

        if (statusFilter === 'inactive') return p.status === 'Inactive';

        return true;

      });

    }

    // Center filter
    if (centerFilter) {
      const norm = (v) => String(v || '')
        .toLowerCase()
        .replace(/\s*health\s*center$/i,'')
        .replace(/\s*center$/i,'')
        .replace(/-/g,' ')
        .trim();
      const want = norm(centerFilter);
      filteredPatients = filteredPatients.filter(p => norm(p.center || p.centerName) === want);
    }



    return filteredPatients;

  }, [searchTerm, statusFilter, centerFilter, patients]);



  // Patient actions

  const handleActivate = async (patientId) => {

    try {

      const res = await fetch(`/api/patients/${patientId}`, { 

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ status: 'Active' })

      });

      if (res.ok) {

        setPatients(patients.map(p => 

          p._id === patientId ? { ...p, status: 'Active' } : p

        ));

        showNotification('Patient activated successfully', 'success');

      } else {

        showNotification('Failed to activate patient', 'error');

      }

    } catch (error) {

      showNotification('Error activating patient', 'error');

    }

  };



  const handleDeactivate = async (patientId) => {

    try {

      const res = await fetch(`/api/patients/${patientId}`, { 

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ status: 'Inactive' })

      });

      if (res.ok) {

        setPatients(patients.map(p => 

          p._id === patientId ? { ...p, status: 'Inactive' } : p

        ));

        showNotification('Patient deactivated successfully', 'success');

      } else {

        showNotification('Failed to deactivate patient', 'error');

      }

    } catch (error) {

      showNotification('Error deactivating patient', 'error');

    }

  };



  return (

    <div className="dashboard-container">

      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">

        <div className="content-header">

          <h2>Patient Account Management</h2>

        </div>



        <div className="accounts-container">

          {/* Search and Filters */}

          <div className="filters-container">

            <div className="search-box">

              <i className="fa fa-search" />

              <input

                type="text"

                placeholder="Search by name, email, phone or patient ID..."

                value={searchTerm}

                onChange={(e) => setSearchTerm(e.target.value)}

              />

            </div>

            

            <div className="filter-controls">
              <select 
                value={centerFilter} 
                onChange={(e) => setCenterFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Centers</option>
                {centerOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

          </div>



          {loading ? (

            <div className="loading-state" aria-label="Loading">

              <i className="fa fa-spinner fa-spin"></i>

            </div>

          ) : (

            <div className="table-container">

              <table className="accounts-table">

                <thead>

                  <tr>

                    <th>Patient ID</th>

                    <th>Name</th>

                    <th>Email</th>

                    <th>Phone</th>

                    <th>Center</th>

                    <th>Status</th>

                    <th>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredPatients.map((p) => {

                    const isPending = !p.isVerified;

                    const isActive = p.status === 'Active' || (!p.status && p.isVerified);

                    const statusText = isPending ? 'Pending' : (isActive ? 'Active' : 'Inactive');

                    const statusClass = isPending ? 'pending' : (isActive ? 'active' : 'inactive');



                    return (

                      <tr key={p._id}>

                        <td>{p.patientId || '-'}</td>

                        <td>{p.fullName || `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim()}</td>

                        <td>{p.email || '-'}</td>

                        <td>{p.phone || '-'}</td>

                        <td>{p.center || p.centerName || '-'}</td>

                        <td>

                          <span className={`status-badge ${statusClass}`}>

                            {statusText}

                          </span>

                        </td>

                        <td>

                          <div className="action-buttons">

                            {isActive ? (

                              <>

                                <button

                                  className="btn-deactivate"

                                  onClick={() => customConfirm(

                                    'Are you sure you want to deactivate this patient account?',

                                    { action: () => handleDeactivate(p._id) }

                                  )}

                                >

                                  Deactivate

                                </button>

                                <button

                                  className="btn-password"

                                  onClick={() => handlePasswordChange(p._id)}

                                  title="Change Password"

                                >

                                  <i className="fa-solid fa-key"></i> Password

                                </button>

                              </>

                            ) : (

                              <>

                                <button

                                  className="btn-activate"

                                  onClick={() => customConfirm(

                                    'Are you sure you want to activate this patient account?',

                                    { action: () => handleActivate(p._id) }

                                  )}

                                >

                                  Activate

                                </button>

                                <button

                                  className="btn-password"

                                  onClick={() => handlePasswordChange(p._id)}

                                  title="Change Password"

                                >

                                  <i className="fa-solid fa-key"></i> Password

                                </button>

                              </>

                            )}

                          </div>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>



      {/* Notification */}

      {notification && (

        <div className={`notification ${notification.type}`}>

          {notification.message}

        </div>

      )}



      {/* Confirmation Modal */}

      <UnifiedModal

        isOpen={showConfirmModal}

        onClose={handleCancel}

        title="Confirm Action"

        message={confirmAction?.message}

        icon={<i className="fa-solid fa-question-circle"></i>}

        iconType="warning"

        confirmText="Confirm"

        cancelText="Cancel"

        onConfirm={handleConfirm}

        isLoading={isProcessing}

        loadingText="Processing..."

      />



      {/* Logout Modal */}

      <UnifiedModal

        isOpen={showSignoutModal}

        onClose={() => setShowSignoutModal(false)}

        title="Sign Out"

        message="Are you sure you want to sign out?"

        subtitle="You will need to log in again to access your account."

        icon={<i className="fa-solid fa-right-from-bracket"></i>}

        iconType="default"

        confirmText="Sign Out"

        cancelText="Cancel"

        onConfirm={confirmSignOut}

      />



      {/* Password Change Modal */}

      <UnifiedModal

        isOpen={showPasswordModal}

        onClose={closePasswordModal}

        title="Change Password"

        message={`Change password for patient account`}

        icon={<i className="fa-solid fa-key"></i>}

        iconType="info"

        confirmText="Change Password"

        cancelText="Cancel"

        onConfirm={confirmPasswordChange}

        isLoading={isProcessing}

        loadingText="Changing Password..."

        customContent={

          <div className="password-change-form">

            {/* Patient Information Section - Only show after user starts typing */}

            {showAdminInfo && (

              <div className="admin-info-section">

                <h4>Patient Information</h4>

                <div className="admin-info-grid">

                  <div className="info-item">

                    <span className="info-label">Patient ID:</span>

                    <span className="info-value">{selectedPatient?.patientId || 'N/A'}</span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">Full Name:</span>

                    <span className="info-value">{selectedPatient?.fullName || `${selectedPatient?.firstName || ''} ${selectedPatient?.lastName || ''}`.trim() || 'N/A'}</span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">Email:</span>

                    <span className="info-value">{selectedPatient?.email || 'N/A'}</span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">Phone:</span>

                    <span className="info-value">{selectedPatient?.phone || 'N/A'}</span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">Status:</span>

                    <span className={`info-value status-${selectedPatient?.status === 'Active' ? 'active' : 'inactive'}`}>

                      {selectedPatient?.status || 'N/A'}

                    </span>

                  </div>

                </div>

              </div>

            )}



            {/* Current Password Display - Only show after user starts typing */}

            {showAdminInfo && (

              <div className="form-group">

                <label htmlFor="currentPassword">Current Password</label>

                <input

                  type="text"

                  id="currentPassword"

                  value={currentPassword}

                  readOnly

                  className="password-input current-password-display"

                  placeholder="Loading current password..."

                />

              </div>

            )}



            {/* New Password Fields */}

            <div className="form-group">

              <label htmlFor="newPassword">New Password</label>

              <input

                type="password"

                id="newPassword"

                value={newPassword}

                onChange={(e) => handleNewPasswordChange(e.target.value)}

                placeholder="Enter new password"

                className="password-input"

              />

            </div>

            <div className="form-group">

              <label htmlFor="confirmPassword">Confirm New Password</label>

              <input

                type="password"

                id="confirmPassword"

                value={confirmPassword}

                onChange={(e) => setConfirmPassword(e.target.value)}

                placeholder="Confirm new password"

                className="password-input"

              />

            </div>

            {passwordError && (

              <div className="password-error">

                <i className="fa-solid fa-exclamation-triangle"></i>

                {passwordError}

              </div>

            )}

            <div className="password-requirements">

              <h4>Password Requirements:</h4>

              <ul>

                <li>At least 8 characters long</li>

                <li>Contains uppercase and lowercase letters</li>

                <li>Contains at least one number</li>

                <li>Contains at least one special character (@$!%*?&)</li>

              </ul>

            </div>

          </div>

        }

      />

    </div>

  );

};



export default SuperAdminPatientManagement;
