import React, { useState, useEffect } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedModal from '../UnifiedModal';
import './SuperAdminAccountManagement.css';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import { apiFetch } from '../../config/api';
import { fullLogout } from '../../utils/auth';

const SuperAdminAccountManagement = () => {
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('');
  const [centers, setCenters] = useState([]);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 50;
  
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  // Handle sign out
  const handleSignOut = () => {
    setShowSignoutModal(true);
  };

  // Confirm sign out
  const confirmSignOut = async () => {
    try {
      setShowSignoutModal(false); // Close modal immediately
      await fullLogout(apiFetch);
    } catch (error) {
      console.error('Signout error:', error);
      setShowSignoutModal(false); // Close modal even on error
      await fullLogout(); // Fallback to basic logout
    }
  };

  // Fetch centers for dropdown (from Center Data Management)
  const fetchCenters = async () => {
    try {
      const res = await apiFetch('/api/centers');
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
      const response = await apiFetch('/api/admin-accounts');
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
    setPage(1); // Reset to first page when searching
    applyFilters(searchValue, statusFilter, centerFilter);
  };

  const handleStatusFilter = (event) => {
    const status = event.target.value;
    setStatusFilter(status);
    setPage(1); // Reset to first page when filtering
    applyFilters(searchTerm, status, centerFilter);
  };

  const handleCenterFilter = (event) => {
    const center = event.target.value;
    setCenterFilter(center);
    setPage(1); // Reset to first page when filtering
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

    // Calculate pagination
    const total = filtered.length;
    const totalPagesCount = Math.ceil(total / PAGE_SIZE);
    setTotalItems(total);
    setTotalPages(totalPagesCount);
    
    // Apply pagination
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    
    setFilteredAccounts(filtered.slice(startIndex, endIndex));
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
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  // Handle new password input change with real-time validation
  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    setPasswordError(''); // Clear previous errors
    
    // Real-time validation
    if (value.length > 0) {
      const validation = validatePassword(value);
      if (validation) {
        setPasswordError(validation);
      }
    }
  };

  // Handle confirm password change with real-time validation
  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setPasswordError(''); // Clear previous errors
    
    // Real-time validation for password match
    if (value.length > 0 && newPassword.length > 0) {
      if (value !== newPassword) {
        setPasswordError('Passwords do not match');
      } else {
        // Check if new password meets requirements
        const validation = validatePassword(newPassword);
        if (validation) {
          setPasswordError(validation);
        }
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
        apiFetch('/api/update-account-status', {
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
      
      apiFetch('/api/audit-trail', {
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

      if (!newPassword || !confirmPassword) {
        setPasswordError('Please fill in both password fields');
        return;
      }

      setProcessing(true);

      // Password change initiated for account

      // API call to change password
      const response = await apiFetch('/api/change-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId: selectedAccount.id, 
          newPassword: newPassword 
        })
      });

      // Password change response received

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Password change failed:', errorText);
        throw new Error(`Failed to change password: ${errorText}`);
      }

      const result = await response.json();
      // Password change completed successfully

      // Log audit trail
      await logAuditTrail(selectedAccount.id, `Password changed for account: ${selectedAccount.username}`);

      // Show success message
      setPasswordSuccess(true);
      setPasswordError('');
      showToast('Password changed successfully', 'success');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setSelectedAccount(null);
        setPasswordSuccess(false);
      }, 2000);
      
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
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
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
                aria-label="Filter by health center"
                title="Filter by health center"
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
                aria-label="Filter by account status"
                title="Filter by account status"
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
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="loading-state">
                      <UnifiedSpinner text="Loading accounts..." />
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      {searchTerm ? 'No matching admin accounts found' : 'No admin accounts found'}
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map(account => (
                    <tr key={account.id || account.adminID}>
                      <td>{account.adminID || account.id || 'N/A'}</td>
                      <td>{account.email || account.username || 'N/A'}</td>
                      <td>
                        <span className="role-badge">{account.role || 'ADMIN'}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${account.isActive ? 'active' : 'inactive'}`}>
                          {account.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-deactivate" 
                            onClick={() => handleActivation(account.id, false)}
                            style={{ display: account.isActive ? 'block' : 'none' }}
                          >
                            <i className="fa-solid fa-ban"></i> Deactivate
                          </button>
                          <button 
                            className="btn-activate" 
                            onClick={() => handleActivation(account.id, true)}
                            style={{ display: !account.isActive ? 'block' : 'none' }}
                          >
                            <i className="fa-solid fa-check-circle"></i> Activate
                          </button>
                          <button 
                            className="btn-password" 
                            onClick={() => handlePasswordChange(account.id)}
                            title="Change Password"
                          >
                            <i className="fa-solid fa-key"></i> Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAccounts.length > 0 && (
            <div className="pagination-container">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fa fa-chevron-left"></i> Prev
              </button>
              <span>Page {page} of {totalPages} ({totalItems} total)</span>
              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <i className="fa fa-chevron-right"></i>
              </button>
            </div>
          )}
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
        size="sm"
        customContent={
          <div className="password-change-form">
            {/* New Password Fields */}
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                placeholder="Enter new password"
                className={`password-input ${passwordError && newPassword.length > 0 ? 'error' : ''}`}
              />
              {newPassword.length > 0 && (
                <div className="password-strength">
                  <div className={`strength-bar ${newPassword.length >= 8 ? 'strong' : newPassword.length >= 4 ? 'medium' : 'weak'}`}></div>
                  <span className="strength-text">
                    {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 4 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
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
            {passwordSuccess && (
              <div className="password-success">
                <i className="fa-solid fa-check-circle"></i>
                Password changed successfully! Closing modal...
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

      {/* Signout Modal */}
      <UnifiedModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        title="Sign Out"
        subtitle="You will need to log in again to access your account."
        icon={<i className="fa-solid fa-right-from-bracket"></i>}
        iconType="default"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmSignOut}
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
