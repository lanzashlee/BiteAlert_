import React, { useState, useEffect } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedModal from '../UnifiedModal';
import './SuperAdminAccountManagement.css';
import LoadingSpinner from './DogLoadingSpinner.jsx';

const SuperAdminAccountManagement = () => {
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('');
  const [centers, setCenters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      
      if (currentUser) {
        await logAuditTrail(currentUser.id, 'Signed out');
        localStorage.removeItem('currentUser');
      }
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during sign out:', error);
      showToast('Error signing out. Please try again.', 'error');
    }
  };

  // Fetch centers for dropdown (from Center Data Management)
  const fetchCenters = async () => {
    try {
      const res = await fetch('/api/centers');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || data.centers || []);
      const activeOnly = (list || []).filter(c => !c.isArchived);
      const names = activeOnly
        .map(c => c.centerName)
        .filter(Boolean)
        .sort((a,b)=>String(a).localeCompare(String(b)));
      setCenters(names);
    } catch (e) {
      setCenters([]);
    }
  };

  // Fetch admin accounts
  const fetchAdminAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch admin accounts');
      }
      const payload = await response.json();
      const accounts = Array.isArray(payload)
        ? payload
        : (payload?.data || payload?.accounts || payload?.value || []);
      // Filter out superadmin accounts - only show regular admin accounts
      const adminOnlyAccounts = accounts.filter(account => 
        account.role.toLowerCase() !== 'superadmin'
      );
      setAdminAccounts(adminOnlyAccounts);
      setFilteredAccounts(adminOnlyAccounts);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load admin accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  // Handle search and filtering
  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
    applyFilters(searchValue, statusFilter, centerFilter);
  };

  const handleStatusFilter = (event) => {
    const status = event.target.value;
    setStatusFilter(status);
    applyFilters(searchTerm, status, centerFilter);
  };

  const handleCenterFilter = (event) => {
    const center = event.target.value;
    setCenterFilter(center);
    applyFilters(searchTerm, statusFilter, center);
  };


  const applyFilters = (search, status, center) => {
    let filtered = adminAccounts;

    // Apply search filter
    if (search !== '') {
      filtered = filtered.filter(account => 
        (account.username && account.username.toLowerCase().includes(search)) ||
        (account.fullName && account.fullName.toLowerCase().includes(search)) ||
        ((account.adminID || account.id) && (account.adminID || account.id).toLowerCase().includes(search)) ||
        (account.centerName && account.centerName.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(account => {
        if (status === 'active') return account.isActive === true;
        if (status === 'inactive') return account.isActive === false;
        return true;
      });
    }

    // Apply center filter (normalize variations like "Balong-Bato Center")
    if (center !== '') {
      const normalizeCenter = (val) => String(val || '')
        .toLowerCase()
        .replace(/\s*health\s*center$/i, '')
        .replace(/\s*center$/i, '')
        .replace(/-/g, ' ')
        .trim();

      const want = normalizeCenter(center);
      filtered = filtered.filter(account => normalizeCenter(account.centerName) === want);
    }

    setFilteredAccounts(filtered);
  };

  // Handle activation/deactivation
  const handleActivation = (accountId, activate) => {
    const account = adminAccounts.find(acc => acc.id === accountId);
    setSelectedAccount(account);
    setSelectedAction(activate);
    setModalMessage(`Are you sure you want to ${activate ? 'activate' : 'deactivate'} this account?`);
    setShowModal(true);
  };

  // Handle password change
  const handlePasswordChange = (accountId) => {
    const account = adminAccounts.find(acc => acc.id === accountId);
    setSelectedAccount(account);
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
        const response = await fetch(`/api/get-admin-password/${selectedAccount.id}`);
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

  // Confirm activation/deactivation
  const confirmAction = async () => {
    try {
      setProcessing(true);
      
      // Update UI immediately for better UX
      const updatedAccounts = adminAccounts.map(account => {
        if (account.id === selectedAccount.id) {
          return { ...account, isActive: selectedAction };
        }
        return account;
      });
      setAdminAccounts(updatedAccounts);
      setFilteredAccounts(updatedAccounts.filter(account => {
        const matchesSearch = searchTerm === '' || 
          (account.username && account.username.toLowerCase().includes(searchTerm)) ||
          (account.fullName && account.fullName.toLowerCase().includes(searchTerm)) ||
          ((account.adminID || account.id) && (account.adminID || account.id).toLowerCase().includes(searchTerm)) ||
          (account.centerName && account.centerName.toLowerCase().includes(searchTerm));
        
        const matchesCenter = centerFilter === '' || 
          (account.center && account.center.toLowerCase().includes(centerFilter.toLowerCase()));
        
        return matchesSearch && matchesCenter;
      }));

      // API call
      const [updateResponse, auditResponse] = await Promise.all([
        fetch('/api/update-account-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accountId: selectedAccount.id, 
            isActive: selectedAction 
          })
        }),
        logAuditTrail(selectedAccount.id, `${selectedAction ? 'Activated' : 'Deactivated'} account`)
      ]);

      if (!updateResponse.ok) {
        throw new Error('Failed to update account status');
      }

      showToast(`Account successfully ${selectedAction ? 'activated' : 'deactivated'}`, 'success');
      setShowModal(false);
      
    } catch (error) {
      console.error('Error updating account status:', error);
      showToast(error.message || 'Error updating account status', 'error');
      // Revert on error
      await fetchAdminAccounts();
    } finally {
      setProcessing(false);
    }
  };

  // Log audit trail
  const logAuditTrail = async (accountId, action) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      
      fetch('/api/audit-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || accountId,
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

      setProcessing(true);

      // API call to change password
      const response = await fetch('/api/change-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: selectedAccount.id, 
          newPassword: newPassword 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      // Log audit trail
      await logAuditTrail(selectedAccount.id, `Password changed for account: ${selectedAccount.username}`);

      showToast('Password changed successfully', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowAdminInfo(false);
      setSelectedAccount(null);
      
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(error.message || 'Error changing password', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
    setSelectedAction(null);
    setProcessing(false);
  };

  // Close password modal
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedAccount(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowAdminInfo(false);
    setProcessing(false);
  };

  useEffect(() => {
    fetchCenters();
    fetchAdminAccounts();
  }, []);

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <div className="main-content">
        <div className="page-header">
          <h2>Admin Account Management</h2>
          <button className="create-account-btn" onClick={() => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData'));
            const isSuperAdmin = currentUser?.role === 'superadmin';
            window.location.href = isSuperAdmin ? '/superadmin/create-account' : '/admin/create-account';
          }}>
            <i className="fa-solid fa-plus"></i>
            Create Account
          </button>
        </div>
        
        <div className="accounts-container">
          <div className="search-filter-container">
            <div className="search-container">
              <div className="search-box">
                <i className="fa-solid fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search by username, name, ID, or center..." 
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            
            <div className="filter-container">
              <select 
                className="filter-select" 
                value={centerFilter} 
                onChange={handleCenterFilter}
              >
                <option value="">All Centers</option>
                {centers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select 
                className="filter-select" 
                value={statusFilter} 
                onChange={handleStatusFilter}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Admin ID</th>
                  <th>Username</th>
                  <th>Center</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="loading-state">
                      <div className="responsive-loading"><div className="responsive-spinner"></div></div>
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">
                      {searchTerm ? 'No matching admin accounts found' : 'No admin accounts found'}
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map(account => (
                    <tr key={account.id || account.adminID}>
                      <td>{account.adminID || account.id || 'N/A'}</td>
                      <td>
                        <div className="user-info">
                          <span className="username">{account.username || 'N/A'}</span>
                          {account.fullName && <span className="fullname">{account.fullName}</span>}
                          <span className="role-badge">{account.role || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="center-name">
                          {account.centerName || (account.role === 'superadmin' ? 'All Centers' : 'N/A')}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <div className="status-container">
                            <span className={`status-indicator ${account.isActive ? 'active' : 'inactive'}`}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div className="table-actions">
                              <button 
                                className="btn-activate" 
                                onClick={() => handleActivation(account.id, true)}
                                style={{ display: account.isActive ? 'none' : 'block' }}
                              >
                                <i className="fa-solid fa-check-circle"></i> Activate
                              </button>
                              <button 
                                className="btn-deactivate" 
                                onClick={() => handleActivation(account.id, false)}
                                style={{ display: !account.isActive ? 'none' : 'block' }}
                              >
                                <i className="fa-solid fa-ban"></i> Deactivate
                              </button>
                              <button 
                                className="update-btn" 
                                onClick={() => handlePasswordChange(account.id)}
                                title="Change Password"
                              >
                                <i className="fa-solid fa-key"></i> Change Password
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <UnifiedModal
        isOpen={showModal}
        onClose={closeModal}
        title="Confirm Action"
        message={modalMessage}
        icon={<i className="fa-solid fa-question-circle"></i>}
        iconType="warning"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmAction}
        isLoading={processing}
        loadingText="Processing..."
      />

      {/* Password Change Modal */}
      <UnifiedModal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="Change Password"
        message={`Change password for admin account`}
        icon={<i className="fa-solid fa-key"></i>}
        iconType="info"
        confirmText="Change Password"
        cancelText="Cancel"
        onConfirm={confirmPasswordChange}
        isLoading={processing}
        loadingText="Changing Password..."
        customContent={
          <div className="password-change-form">
            {/* Admin Information Section - Only show after user starts typing */}
            {showAdminInfo && (
              <div className="admin-info-section">
                <h4>Admin Information</h4>
                <div className="admin-info-grid">
                  <div className="info-item">
                    <span className="info-label">Admin ID:</span>
                    <span className="info-value">{selectedAccount?.adminID || selectedAccount?.id || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Username:</span>
                    <span className="info-value">{selectedAccount?.username || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Full Name:</span>
                    <span className="info-value">{selectedAccount?.fullName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{selectedAccount?.role || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className={`info-value status-${selectedAccount?.isActive ? 'active' : 'inactive'}`}>
                      {selectedAccount?.isActive ? 'Active' : 'Inactive'}
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

      {/* Toast Notifications */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <i className={`fa-solid fa-${toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'exclamation-circle' : 'info-circle'}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAccountManagement;
