import React, { useEffect, useMemo, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedModal from '../UnifiedModal';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import './SuperAdminStaffManagement.css';
// import LoadingSpinner from './DogLoadingSpinner.jsx';

const SuperAdminStaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
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
  const [selectedStaff, setSelectedStaff] = useState(null);

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
  const handlePasswordChange = (staffId) => {
    const staffMember = staff.find(s => s._id === staffId);
    setSelectedStaff(staffMember);
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
        const response = await fetch(`/api/get-staff-password/${selectedStaff._id}`);
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
      const response = await fetch('/api/change-staff-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staffId: selectedStaff._id, 
          newPassword: newPassword 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      // Log audit trail
      await logAuditTrail(selectedStaff._id, `Password changed for staff: ${selectedStaff.fullName}`);

      showNotification('Password changed successfully', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowAdminInfo(false);
      setSelectedStaff(null);
      
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification(error.message || 'Error changing password', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Log audit trail
  const logAuditTrail = async (staffId, action) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      
      fetch('/api/audit-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || staffId,
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
    setSelectedStaff(null);
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
        await fetch('/api/logout', {
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
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const userCenter = getUserCenter();
        
        // Build API URL with center filter for non-superadmin users
        let apiUrl = '/api/staffs';
        if (userCenter && userCenter !== 'all') {
          apiUrl += `?center=${encodeURIComponent(userCenter)}`;
        }
        
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data.success) {
          // Apply additional client-side filtering if needed
          const allStaff = data.staffs || [];
          
          // Map the data to match expected field names
          const mappedStaff = allStaff.map(staff => ({
            ...staff,
            fullName: staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
            center: staff.center || staff.centerName
          }));
          
          const filteredStaff = filterByCenter(mappedStaff, 'center');
          setStaff(filteredStaff);
        } else {
          showNotification('Failed to load staff data', 'error');
        }
      } catch (error) {
        showNotification('Error loading staff data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(staff.map(s => s.role).filter(Boolean))];
    return roles.sort();
  }, [staff]);

  // Filtered staff data
  const filteredStaff = useMemo(() => {
    let filteredStaff = staff;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredStaff = filteredStaff.filter(s => 
        [s.fullName, s.email, s.phone, s.role]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(searchLower))
      );
    }

    // Role filter
    if (roleFilter) {
      filteredStaff = filteredStaff.filter(s => 
        s.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter) {
      filteredStaff = filteredStaff.filter(s => {
        if (statusFilter === 'pending') return !s.isApproved || !s.isVerified;
        if (statusFilter === 'active') return s.isApproved;
        if (statusFilter === 'inactive') return s.isApproved === false;
        return true;
      });
    }

    // Center filter
    if (centerFilter) {
      filteredStaff = filteredStaff.filter(s => 
        s.center && s.center.toLowerCase().includes(centerFilter.toLowerCase())
      );
    }

    return filteredStaff;
  }, [searchTerm, roleFilter, statusFilter, centerFilter, staff]);

  // Staff actions
  const handleApprove = async (staffId) => {
    try {
      const res = await fetch(`/api/staffs/${staffId}/approve`, { method: 'POST' });
      if (res.ok) {
        setStaff(staff.map(s => 
          s._id === staffId ? { ...s, isApproved: true } : s
        ));
        showNotification('Staff approved successfully', 'success');
      } else {
        showNotification('Failed to approve staff', 'error');
      }
    } catch (error) {
      showNotification('Error approving staff', 'error');
    }
  };

  const handleReject = async (staffId) => {
    try {
      const res = await fetch(`/api/staffs/${staffId}`, { method: 'DELETE' });
      if (res.ok) {
        setStaff(staff.filter(s => s._id !== staffId));
        showNotification('Staff rejected successfully', 'success');
      } else {
        showNotification('Failed to reject staff', 'error');
      }
    } catch (error) {
      showNotification('Error rejecting staff', 'error');
    }
  };

  const handleActivate = async (staffId) => {
    try {
      const res = await fetch(`/api/staffs/${staffId}/activate`, { method: 'POST' });
      if (res.ok) {
        setStaff(staff.map(s => 
          s._id === staffId ? { ...s, isApproved: true } : s
        ));
        showNotification('Staff activated successfully', 'success');
      } else {
        showNotification('Failed to activate staff', 'error');
      }
    } catch (error) {
      showNotification('Error activating staff', 'error');
    }
  };

  const handleDeactivate = async (staffId) => {
    try {
      const res = await fetch(`/api/staffs/${staffId}/deactivate`, { method: 'POST' });
      if (res.ok) {
        setStaff(staff.map(s => 
          s._id === staffId ? { ...s, isApproved: false } : s
        ));
        showNotification('Staff deactivated successfully', 'success');
      } else {
        showNotification('Failed to deactivate staff', 'error');
      }
    } catch (error) {
      showNotification('Error deactivating staff', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">
        <div className="content-header">
          <h2>Staff Account Management</h2>
        </div>

                <div className="accounts-container">
          {/* Search and Filters */}
          <div className="filters-container">
            <div className="search-box">
              <i className="fa fa-search" />
              <input
                type="text"
                placeholder="Search by name, email, phone or role..."
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
                <option value="Addition Hills">Addition Hills</option>
                <option value="Balong-Bato">Balong-Bato</option>
                <option value="Batis">Batis</option>
                <option value="Corazon De Jesus">Corazon De Jesus</option>
                <option value="Ermitaño">Ermitaño</option>
                <option value="Halo-halo">Halo-halo</option>
                <option value="Isabelita">Isabelita</option>
                <option value="Kabayanan">Kabayanan</option>
                <option value="Little Baguio">Little Baguio</option>
                <option value="Maytunas">Maytunas</option>
                <option value="Onse">Onse</option>
                <option value="Pasadeña">Pasadeña</option>
                <option value="Pedro Cruz">Pedro Cruz</option>
                <option value="Progreso">Progreso</option>
                <option value="Rivera">Rivera</option>
                <option value="Salapan">Salapan</option>
                <option value="San Perfecto">San Perfecto</option>
                <option value="Santa Lucia">Santa Lucia</option>
                <option value="Tibagan">Tibagan</option>
                <option value="West Crame">West Crame</option>
                <option value="Greenhills">Greenhills</option>
              </select>
                             <select 
                 value={roleFilter} 
                 onChange={(e) => setRoleFilter(e.target.value)}
                 className="filter-select"
               >
                 <option value="">All Roles</option>
                 {uniqueRoles.map(role => (
                   <option key={role} value={role}>{role}</option>
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
              <div className="responsive-loading"><div className="responsive-spinner"></div></div>
            </div>
          ) : (
            <div className="table-container">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => {
                    const isPending = !s.isApproved || !s.isVerified;
                    const statusText = isPending ? 'Pending' : (s.isApproved ? 'Active' : 'Inactive');
                    const statusClass = isPending ? 'pending' : (s.isApproved ? 'active' : 'inactive');

                    return (
                      <tr key={s._id}>
                        <td>{s.staffId || '-'}</td>
                        <td>{s.fullName || `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim()}</td>
                        <td>{s.role || '-'}</td>
                        <td>{s.phone || '-'}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {isPending ? (
                              <>
                                <button 
                                  className="btn-approve" 
                                  onClick={() => customConfirm(
                                    'Are you sure you want to approve this staff account?',
                                    { action: () => handleApprove(s._id) }
                                  )}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn-reject" 
                                  onClick={() => customConfirm(
                                    'Are you sure you want to reject this staff account?',
                                    { action: () => handleReject(s._id) }
                                  )}
                                >
                                  Reject
                                </button>
                              </>
                            ) : s.isApproved ? (
                              <>
                                <button
                                  className="btn-deactivate"
                                  onClick={() => customConfirm(
                                    'Are you sure you want to deactivate this staff account?',
                                    { action: () => handleDeactivate(s._id) }
                                  )}
                                >
                                  Deactivate
                                </button>
                                <button
                                  className="btn-password"
                                  onClick={() => handlePasswordChange(s._id)}
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
                                    'Are you sure you want to activate this staff account?',
                                    { action: () => handleActivate(s._id) }
                                  )}
                                >
                                  Activate
                                </button>
                                <button
                                  className="btn-password"
                                  onClick={() => handlePasswordChange(s._id)}
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
        message={`Change password for staff account`}
        icon={<i className="fa-solid fa-key"></i>}
        iconType="info"
        confirmText="Change Password"
        cancelText="Cancel"
        onConfirm={confirmPasswordChange}
        isLoading={isProcessing}
        loadingText="Changing Password..."
        customContent={
          <div className="password-change-form">
            {/* Staff Information Section - Only show after user starts typing */}
            {showAdminInfo && (
              <div className="admin-info-section">
                <h4>Staff Information</h4>
                <div className="admin-info-grid">
                  <div className="info-item">
                    <span className="info-label">Staff ID:</span>
                    <span className="info-value">{selectedStaff?.staffId || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Full Name:</span>
                    <span className="info-value">{selectedStaff?.fullName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{selectedStaff?.role || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{selectedStaff?.phone || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className={`info-value status-${selectedStaff?.isApproved ? 'active' : 'inactive'}`}>
                      {selectedStaff?.isApproved ? 'Active' : 'Inactive'}
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

export default SuperAdminStaffManagement;
