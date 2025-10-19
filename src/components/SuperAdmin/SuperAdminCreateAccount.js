import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import { apiFetch } from '../../config/api';
import './SuperAdminCreateAccount.css';
import { fullLogout } from '../../utils/auth';

const SuperAdminCreateAccount = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    birthdate: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    centerName: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState('');
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(null);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(true);
  const location = useLocation();

  // Fetch centers from database
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        setCentersLoading(true);
        const res = await apiFetch('/api/centers');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        // Exclude archived centers from the list
        const activeOnly = (list || []).filter((c) => !c.isArchived);
        setCenters(activeOnly);
      } catch (error) {
        console.error('Error fetching centers:', error);
      } finally {
        setCentersLoading(false);
      }
    };
    fetchCenters();
  }, []);

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

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.birthdate) newErrors.birthdate = 'Birthdate is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    
    // Center assignment required for admin role
    if (formData.role === 'admin' && !formData.centerName) {
      newErrors.centerName = 'Center assignment is required for admin accounts';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phoneNumber && !/^09\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number (09XXXXXXXXX)';
    }

    // Age validation (must be 18 or older)
    if (formData.birthdate) {
      const today = new Date();
      const birthDate = new Date(formData.birthdate);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        newErrors.birthdate = 'You must be at least 18 years old';
      }
    }

    // Password validation
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one special character';
      }
    }

    // Password confirmation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name availability check
    if (nameAvailable === false) {
      newErrors.firstName = 'An account with this full name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkNameAvailability = async () => {
    const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();
    if (!formData.firstName || !formData.lastName) return;

    setNameCheckLoading(true);
    try {
      const response = await apiFetch('/api/check-name-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });
      const result = await response.json();
      setNameAvailable(result.available);
    } catch (error) {
      console.error('Error checking name availability:', error);
    } finally {
      setNameCheckLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check name availability when name fields change
    if (['firstName', 'middleName', 'lastName'].includes(name)) {
      setNameAvailable(null);
      if (formData.firstName && formData.lastName) {
        setTimeout(checkNameAvailability, 500);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setUserId(result.userId);
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          birthdate: '',
          password: '',
          confirmPassword: '',
          role: 'admin',
          centerName: ''
        });
        setErrors({});
      } else {
        setErrors({ submit: result.message || 'Failed to create account' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="content-header">
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => window.history.back()}>
              <i className="fa-solid fa-arrow-left" /> Back
            </button>
          </div>
        </div>

        <div className="content-body">
          {success ? (
            <div className="success-card">
              <div className="success-icon">
                <i className="fa-solid fa-check-circle" />
              </div>
              <h3>Account Created Successfully!</h3>
              <p>The new account has been created with the following details:</p>
              <div className="user-id-display">
                <strong>User ID:</strong> {userId}
              </div>
              <div className="success-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => setSuccess(false)}
                >
                  Create Another Account
                </button>
                <Link to="/superadmin" className="btn btn-secondary">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="form-container create-account-card">
              <div className="create-account-header"></div>
              <div className="create-account-body">
              <form onSubmit={handleSubmit} className="create-account-form">
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`form-control ${errors.firstName ? 'error' : ''}`}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="middleName">Middle Name</label>
                      <input
                        type="text"
                        id="middleName"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Enter middle name (optional)"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`form-control ${errors.lastName ? 'error' : ''}`}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>
                  </div>

                  {/* name checking spinner removed per request */}
                  {nameAvailable === false && (
                    <div className="name-unavailable">
                      <i className="fa-solid fa-exclamation-triangle" /> An account with this full name already exists
                    </div>
                  )}
                  {nameAvailable === true && (
                    <div className="name-available">
                      <i className="fa-solid fa-check" /> Name is available
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`form-control ${errors.email ? 'error' : ''}`}
                        placeholder="Enter email address"
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number *</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`form-control ${errors.phoneNumber ? 'error' : ''}`}
                        placeholder="09XXXXXXXXX"
                      />
                      {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="birthdate">Birthdate *</label>
                      <input
                        type="date"
                        id="birthdate"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleInputChange}
                        className={`form-control ${errors.birthdate ? 'error' : ''}`}
                      />
                      {errors.birthdate && <span className="error-message">{errors.birthdate}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="role">Role *</label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="admin">Administrator</option>
                        <option value="superadmin">Super Administrator</option>
                      </select>
                    </div>
                  </div>

                  {/* Center Assignment - Only show for admin role */}
                  {formData.role === 'admin' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="centerName">Center Assignment *</label>
                        <select
                          id="centerName"
                          name="centerName"
                          value={formData.centerName}
                          onChange={handleInputChange}
                          className={`form-control ${errors.centerName ? 'error' : ''}`}
                          disabled={centersLoading}
                        >
                          <option value="">
                            {centersLoading ? 'Loading centers...' : 'Select Center'}
                          </option>
                          {centers.map((center) => (
                            <option key={center._id} value={center.centerName}>
                              {center.centerName}
                            </option>
                          ))}
                        </select>
                        {errors.centerName && <span className="error-message">{errors.centerName}</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3>Account Security</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">Password *</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`form-control ${errors.password ? 'error' : ''}`}
                        placeholder="Enter password"
                      />
                      {errors.password && <span className="error-message">{errors.password}</span>}
                      <div className="password-requirements">
                        <small>Password must contain:</small>
                        <ul>
                          <li className={formData.password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                          <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>One uppercase letter</li>
                          <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'met' : ''}>One special character</li>
                        </ul>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password *</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Confirm password"
                      />
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="error-alert">
                    <i className="fa-solid fa-exclamation-triangle" />
                    {errors.submit}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-user-plus" />
                    Create Account
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </div>
          )}
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

export default SuperAdminCreateAccount;


