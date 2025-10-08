import React, { useState, useEffect } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedSpinner from '../Common/UnifiedSpinner';
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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
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
        console.log('No active session found, proceeding with logout anyway');
        // Proceed with logout even if no session found
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        window.location.replace('/login');
        return;
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
      // Only show alert for unexpected errors, not for missing session
      if (!error.message?.includes('No active session found')) {
        alert(error.message || 'Error signing out. Please try again.');
      }
      
      // Ensure logout happens even if there's an error
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      window.location.replace('/login');
    } finally {
      setShowSignoutModal(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const resolveUserFromStorage = () => {
    try {
      console.log('🔍 PROFILE DEBUG: Resolving user from storage...');
      const userData = localStorage.getItem('userData');
      const currentUser = localStorage.getItem('currentUser');
      
      console.log('🔍 PROFILE DEBUG: userData exists:', !!userData);
      console.log('🔍 PROFILE DEBUG: currentUser exists:', !!currentUser);
      
      const u1 = userData ? JSON.parse(userData) : null;
      const u2 = currentUser ? JSON.parse(currentUser) : null;
      
      console.log('🔍 PROFILE DEBUG: Parsed userData:', u1);
      console.log('🔍 PROFILE DEBUG: Parsed currentUser:', u2);
      
      const result = u1 || u2 || null;
      console.log('🔍 PROFILE DEBUG: Final resolved user:', result);
      
      return result;
    } catch (error) {
      console.error('🔍 PROFILE DEBUG: Error resolving user from storage:', error);
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
      console.log('🔍 PROFILE DEBUG: Loading user data...');
      const user = resolveUserFromStorage();
      console.log('🔍 PROFILE DEBUG: Resolved user from storage:', user);
      
      if (!user) {
        console.log('🔍 PROFILE DEBUG: No user found in storage, creating fallback user data');
        // Create fallback user data to prevent redirect
        const fallbackUser = {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: 'admin',
          adminID: 'ADM-001'
        };
        setUserData(fallbackUser);
        setFormData(fallbackUser);
        setLoading(false);
        return;
      }

      const id = getUserId(user);
      console.log('Extracted user ID:', id);
      
      if (!id) {
        console.warn('🔍 PROFILE DEBUG: No user id found in stored user object, using user data as-is:', user);
        // Use the user data even without an ID
        setUserData(user);
        setFormData(user);
        setLoading(false);
        return;
      }

      console.log('Fetching profile for user ID:', id);
      console.log('API base URL from config:', process.env.REACT_APP_API_URL || 'https://bitealert-backend.onrender.com');
      
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
        console.log('🔍 PROFILE DEBUG: Profile data found:', profile);
        setUserData(profile);
        setFormData(profile);
      } else {
        console.log('🔍 PROFILE DEBUG: No valid profile data found in response');
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

  // Real-time password strength calculation
  const calculatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];
    
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }
    
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }
    
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }
    
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }
    
    return { score, feedback };
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Real-time password strength calculation for new password
    if (name === 'newPassword') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
    
    // Real-time validation
    const newErrors = { ...passwordErrors };
    
    if (name === 'newPassword' && value) {
      if (value.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters long';
      } else if (!/[A-Z]/.test(value)) {
        newErrors.newPassword = 'Password must contain at least one uppercase letter';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        newErrors.newPassword = 'Password must contain at least one special character';
      } else {
        delete newErrors.newPassword;
      }
    }
    
    if (name === 'confirmPassword' && value && passwordData.newPassword) {
      if (value !== passwordData.newPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }
    
    if (name === 'currentPassword' && value) {
      delete newErrors.currentPassword;
    }
    
    setPasswordErrors(newErrors);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
      
      // Single authoritative endpoint
      const response = await apiFetch(`/api/profile/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to update profile');
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
        localStorage.setItem('currentUser', JSON.stringify(merged));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setErrors({ submit: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Network error. Please try again.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    try {
      const stored = resolveUserFromStorage();
      const id = getUserId(stored);
      
      // Single authoritative endpoint
      const response = await apiFetch(`/api/profile/${encodeURIComponent(id)}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
            })
          });
          
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to change password');
      }

      const data = await response.json();
      // Password change API request initiated
      
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
      setPasswordErrors({ submit: error.message || 'Network error. Please try again.' });
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
          <UnifiedSpinner text="Loading profile..." />
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
            <button className="btn btn-secondary" type="button" onClick={() => window.history.back()} aria-label="Go back to previous page" title="Back">
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
                    <button type="submit" className="btn btn-primary" aria-label="Save profile changes" title="Save Changes">
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

              <form onSubmit={handleChangePassword} className="modern-password-form">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password *</label>
                    <div className="input-wrapper">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`modern-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('current')}
                        tabIndex="-1"
                      >
                        <i className={`fa-solid ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <div className="error-message">
                        <i className="fa-solid fa-exclamation-circle" />
                        {passwordErrors.currentPassword}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password *</label>
                      <div className="input-wrapper">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className={`modern-input ${passwordErrors.newPassword ? 'error' : ''} ${passwordStrength.score >= 3 ? 'valid' : ''}`}
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility('new')}
                          tabIndex="-1"
                        >
                          <i className={`fa-solid ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                      
                      {/* Real-time Password Strength Indicator */}
                      {passwordData.newPassword && (
                        <div className="password-strength">
                          <div className="strength-bar">
                            <div 
                              className={`strength-fill strength-${Math.min(passwordStrength.score, 5)}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <div className="strength-text">
                            {passwordStrength.score === 0 && 'Very Weak'}
                            {passwordStrength.score === 1 && 'Weak'}
                            {passwordStrength.score === 2 && 'Fair'}
                            {passwordStrength.score === 3 && 'Good'}
                            {passwordStrength.score === 4 && 'Strong'}
                            {passwordStrength.score === 5 && 'Very Strong'}
                          </div>
                        </div>
                      )}
                      
                      {/* Real-time Requirements */}
                      <div className="password-requirements">
                        <div className="requirements-title">Password Requirements:</div>
                        <div className="requirements-list">
                          <div className={`requirement ${passwordData.newPassword.length >= 8 ? 'met' : ''}`}>
                            <i className={`fa-solid ${passwordData.newPassword.length >= 8 ? 'fa-check-circle' : 'fa-circle'}`} />
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`requirement ${/[A-Z]/.test(passwordData.newPassword) ? 'met' : ''}`}>
                            <i className={`fa-solid ${/[A-Z]/.test(passwordData.newPassword) ? 'fa-check-circle' : 'fa-circle'}`} />
                            <span>One uppercase letter</span>
                          </div>
                          <div className={`requirement ${/[a-z]/.test(passwordData.newPassword) ? 'met' : ''}`}>
                            <i className={`fa-solid ${/[a-z]/.test(passwordData.newPassword) ? 'fa-check-circle' : 'fa-circle'}`} />
                            <span>One lowercase letter</span>
                          </div>
                          <div className={`requirement ${/[0-9]/.test(passwordData.newPassword) ? 'met' : ''}`}>
                            <i className={`fa-solid ${/[0-9]/.test(passwordData.newPassword) ? 'fa-check-circle' : 'fa-circle'}`} />
                            <span>One number</span>
                          </div>
                          <div className={`requirement ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'met' : ''}`}>
                            <i className={`fa-solid ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'fa-check-circle' : 'fa-circle'}`} />
                            <span>One special character</span>
                          </div>
                        </div>
                      </div>
                      
                      {passwordErrors.newPassword && (
                        <div className="error-message">
                          <i className="fa-solid fa-exclamation-circle" />
                          {passwordErrors.newPassword}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password *</label>
                      <div className="input-wrapper">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className={`modern-input ${passwordErrors.confirmPassword ? 'error' : ''} ${passwordData.confirmPassword && passwordData.confirmPassword === passwordData.newPassword ? 'valid' : ''}`}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility('confirm')}
                          tabIndex="-1"
                        >
                          <i className={`fa-solid ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                      {passwordData.confirmPassword && passwordData.confirmPassword === passwordData.newPassword && (
                        <div className="success-message">
                          <i className="fa-solid fa-check-circle" />
                          Passwords match
                        </div>
                      )}
                      {passwordErrors.confirmPassword && (
                        <div className="error-message">
                          <i className="fa-solid fa-exclamation-circle" />
                          {passwordErrors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {passwordErrors.submit && (
                  <div className="error-alert">
                    <i className="fa-solid fa-exclamation-triangle" />
                    {passwordErrors.submit}
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary modern-btn" 
                    disabled={passwordStrength.score < 3 || passwordData.newPassword !== passwordData.confirmPassword}
                    aria-label="Change account password" 
                    title="Change Password"
                  >
                    <i className="fa-solid fa-key" /> 
                    <span>Change Password</span>
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
              <button className="cancel-btn" onClick={() => setShowSignoutModal(false)} aria-label="Cancel sign out" title="Cancel">Cancel</button>
              <button className="confirm-btn" onClick={confirmSignOut} aria-label="Confirm sign out" title="Sign out">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminProfile;

 