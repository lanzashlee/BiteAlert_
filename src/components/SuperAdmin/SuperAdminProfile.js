import React, { useState, useEffect } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import { apiFetch } from '../../config/api';
import './SuperAdminProfile.css';

const SuperAdminProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showSignoutModal, setShowSignoutModal] = useState(false);

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
    loadUserData();
  }, []);

  const resolveUserFromStorage = () => {
    try {
      const u1 = JSON.parse(localStorage.getItem('userData') || 'null');
      const u2 = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return u1 || u2 || null;
    } catch {
      return null;
    }
  };

  const getUserId = (u) => {
    if (!u) return null;
    return u.id || u._id || u.superAdminID || u.adminID || u.userId || null;
  };

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadUserData = async () => {
    try {
      const user = resolveUserFromStorage();
      console.log('Resolved user from storage:', user);
      
      if (!user) {
        console.log('No user found in storage');
        setUserData(null);
        setLoading(false);
        return;
      }

      const id = getUserId(user);
      console.log('Extracted user ID:', id);
      
      if (!id) {
        console.warn('No user id found in stored user object:', user);
        setUserData(null);
        setLoading(false);
        return;
      }

      console.log('Fetching profile for user ID:', id);
      console.log('API base URL from config:', process.env.REACT_APP_API_URL || 'https://bitealert-backend-doga.onrender.com');
      
      // Use user data from localStorage for faster loading
      console.log('Using cached user data for profile');
      const payload = {
        success: true,
        data: {
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          adminID: user.adminID,
          superAdminID: user.superAdminID
        }
      };
      
      const profile = payload && payload.success ? payload.data : payload;

      if (profile && (profile.email || profile.firstName || profile.lastName)) {
        console.log('Profile data found:', profile);
        setUserData(profile);
        setFormData(profile);
      } else {
        console.log('No valid profile data found in response');
        setUserData(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber && !/^09\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number (09XXXXXXXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    if (!passwordData.confirmPassword) newErrors.confirmPassword = 'Please confirm your new password';

    if (passwordData.newPassword) {
      if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters long';
      } else if (!/[A-Z]/.test(passwordData.newPassword)) {
        newErrors.newPassword = 'Password must contain at least one uppercase letter';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
        newErrors.newPassword = 'Password must contain at least one special character';
      }
    }

    if (passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const stored = resolveUserFromStorage();
      const id = getUserId(stored);
      
      // Try different update endpoints
      const updateEndpoints = [
        `/api/profile/${encodeURIComponent(id)}`,
        `/api/admin-accounts/${encodeURIComponent(id)}`,
        `/api/superadmin/${encodeURIComponent(id)}`
      ];
      
      let response;
      let lastError;
      
      for (const endpoint of updateEndpoints) {
        try {
          console.log(`Trying update endpoint: ${endpoint}`);
          response = await apiFetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          
          console.log('Update API response status:', response.status);
          
          if (response.status === 404) {
            console.log(`Endpoint ${endpoint} returned 404, trying next...`);
            continue;
          }
          
          if (response.ok) {
            console.log(`Success with update endpoint: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.error(`Failed with update endpoint ${endpoint}:`, error);
          lastError = error;
          continue;
        }
      }
      
      if (!response || response.status === 404) {
        throw lastError || new Error('All update endpoints failed or returned 404');
      }

      const data = await response.json();
      console.log('Update API payload:', data);
      
      if (data.success || data.updated || response.ok) {
        setSuccess('Profile updated successfully!');
        setUserData(formData);
        setEditing(false);
        // keep local storage roughly in sync
        const merged = { ...(stored || {}), ...formData };
        localStorage.setItem('userData', JSON.stringify(merged));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setErrors({ submit: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    try {
      const stored = resolveUserFromStorage();
      const id = getUserId(stored);
      
      // Try different password change endpoints
      const passwordEndpoints = [
        `/api/profile/${encodeURIComponent(id)}/change-password`,
        `/api/admin-accounts/${encodeURIComponent(id)}/change-password`,
        `/api/superadmin/${encodeURIComponent(id)}/change-password`,
        `/api/change-admin-password`
      ];
      
      let response;
      let lastError;
      
      for (const endpoint of passwordEndpoints) {
        try {
          console.log(`Trying password change endpoint: ${endpoint}`);
          response = await apiFetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...passwordData,
              adminId: id,
              userId: id
            })
          });
          
          console.log('Password change API response status:', response.status);
          
          if (response.status === 404) {
            console.log(`Endpoint ${endpoint} returned 404, trying next...`);
            continue;
          }
          
          if (response.ok) {
            console.log(`Success with password change endpoint: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.error(`Failed with password change endpoint ${endpoint}:`, error);
          lastError = error;
          continue;
        }
      }
      
      if (!response || response.status === 404) {
        throw lastError || new Error('All password change endpoints failed or returned 404');
      }

      const data = await response.json();
      console.log('Password change API payload:', data);
      
      if (data.success || response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordErrors({ submit: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordErrors({ submit: 'Network error. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <ResponsiveSidebar onSignOut={handleSignOut} />
        <main className="main-content">
          <div className="content-header">
            <h2>Profile Settings</h2>
          </div>
          <div className="loading-container">
            <div className="loading-spinner" aria-label="Loading profile">
              <i className="fa fa-spinner fa-spin" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Safe empty state when no profile data is available
  if (!userData) {
    return (
      <div className="dashboard-container">
        <main className="main-content">
          <div className="content-header">
            <h2>Profile Settings</h2>
          </div>
          <div className="content-body">
            <div className="empty-state">
              <i className="fa-solid fa-user" />
              <p>No profile data found</p>
              <small>Please sign in again or contact an administrator.</small>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="content-header">
          <h2>Profile Settings</h2>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => window.history.back()}>
              <i className="fa-solid fa-arrow-left" /> Back
            </button>
          </div>
        </div>

        <div className="content-body">
          <div className="profile-container">
            <div className="profile-section">
              <div className="section-header">
                <h3>Personal Information</h3>
                <button 
                  className={`btn btn-sm ${editing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setEditing(!editing)}
                >
                  <i className={`fa-solid ${editing ? 'fa-times' : 'fa-edit'}`} /> 
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {success && (
                <div className="success-alert">
                  <i className="fa-solid fa-check-circle" />
                  {success}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName || ''}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className={`form-control ${errors.firstName ? 'error' : ''} ${!editing ? 'readonly' : ''}`}
                    />
                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="middleName">Middle Name</label>
                    <input
                      type="text"
                      id="middleName"
                      name="middleName"
                      value={formData.middleName || ''}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className={`form-control ${!editing ? 'readonly' : ''}`}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName || ''}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className={`form-control ${errors.lastName ? 'error' : ''} ${!editing ? 'readonly' : ''}`}
                    />
                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-row two-columns">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className={`form-control ${errors.email ? 'error' : ''} ${!editing ? 'readonly' : ''}`}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number *</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className={`form-control ${errors.phoneNumber ? 'error' : ''} ${!editing ? 'readonly' : ''}`}
                    />
                    {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                  </div>
                </div>

                <div className="form-row single-column">
                  <div className="form-group">
                    <label>Role</label>
                    <div className="role-display">
                      <span className="role-badge role-superadmin">{userData?.role || '—'}</span>
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="error-alert">
                    <i className="fa-solid fa-exclamation-triangle" />
                    {errors.submit}
                  </div>
                )}

                {editing && (
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      <i className="fa-solid fa-save" /> Save Changes
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(false);
                        setFormData(userData);
                        setErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="profile-section">
              <div className="section-header">
                <h3>Change Password</h3>
              </div>

              {passwordSuccess && (
                <div className="success-alert">
                  <i className="fa-solid fa-check-circle" />
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password *</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={`form-control ${passwordErrors.currentPassword ? 'error' : ''}`}
                    />
                    {passwordErrors.currentPassword && <span className="error-message">{passwordErrors.currentPassword}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password *</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`form-control ${passwordErrors.newPassword ? 'error' : ''}`}
                    />
                    {passwordErrors.newPassword && <span className="error-message">{passwordErrors.newPassword}</span>}
                    <div className="password-requirements">
                      <small>Password must contain:</small>
                      <ul>
                        <li className={passwordData.newPassword.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                        <li className={/[A-Z]/.test(passwordData.newPassword) ? 'met' : ''}>One uppercase letter</li>
                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'met' : ''}>One special character</li>
                      </ul>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`form-control ${passwordErrors.confirmPassword ? 'error' : ''}`}
                    />
                    {passwordErrors.confirmPassword && <span className="error-message">{passwordErrors.confirmPassword}</span>}
                  </div>
                </div>

                {passwordErrors.submit && (
                  <div className="error-alert">
                    <i className="fa-solid fa-exclamation-triangle" />
                    {passwordErrors.submit}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-key" /> Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Logout Modal */}
      {showSignoutModal && (
        <div className="signout-modal active">
          <div className="signout-modal-overlay" onClick={() => setShowSignoutModal(false)}></div>
          <div className="signout-modal-content">
            <div className="signout-modal-header">
              <div className="signout-icon-wrapper">
                <i className="fa-solid fa-right-from-bracket"></i>
              </div>
              <h3>Sign Out</h3>
            </div>
            <div className="signout-modal-body">
              <p>Are you sure you want to sign out?</p>
              <span className="signout-subtitle">You will need to log in again to access your account.</span>
            </div>
            <div className="signout-modal-footer">
              <button className="cancel-btn" onClick={() => setShowSignoutModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={confirmSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminProfile;

 