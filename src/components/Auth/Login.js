import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { apiFetch, apiConfig } from '../../config/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Logging in...');
  const [error, setError] = useState('');
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotMsgColor, setForgotMsgColor] = useState('#dc3545');

  const emailRules = useMemo(() => {
    const domainRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const lengthValid = email.trim().length >= 5 && email.trim().length <= 254;
    const hasAt = email.includes('@');
    const hasDomain = email.split('@')[1]?.includes('.') || false;
    const domainValid = domainRegex.test(email.trim());
    const specialValid = domainRegex.test(email.trim());
    return {
      lengthValid,
      formatValid: hasAt && hasDomain,
      domainValid,
      specialValid
    };
  }, [email]);

  const passwordRules = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    return { len, upper, lower, number, special };
  }, [password]);

  const redirectBasedOnRole = (role) => {
    // Add small delay to show welcome message
    setTimeout(() => {
      setLoading(false); // Stop loading before navigation
      if (role === 'superadmin') {
        navigate('/superadmin');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 500); // 500ms delay to show welcome message
  };

  const safeParseJson = async (response) => {
    try {
      return await response.json();
    } catch (e) {
      return null;
    }
  };

  const checkAccountStatus = async (checkEmail) => {
    try {
      const res = await apiFetch(`/api/account-status/${encodeURIComponent(checkEmail)}`);
      const data = await safeParseJson(res);
      if (data?.success && data?.account) {
        if (data.account.isActive === false) {
          localStorage.removeItem('currentUser');
          setError('Your account has been deactivated. Please contact a super admin.');
          return false;
        }
        localStorage.setItem('currentUser', JSON.stringify(data.account));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Disable auto-login on app open unless rememberMe was explicitly set
  useEffect(() => {
    // Check if user is already logged in
    const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const role = user.role;
        if (role === 'superadmin') {
          navigate('/superadmin');
        } else if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
        return;
      } catch (error) {
        console.warn('Invalid user data in storage:', error);
      }
    }
    
    // Only clear storage if explicitly not remembered
    const remembered = localStorage.getItem('rememberMe') === 'true';
    if (!remembered) {
      // Don't clear sessionStorage - it should persist for the session
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingMessage('Authenticating...');
    
    try {
      // Login attempt logged without sensitive data
      const res = await apiFetch(apiConfig.endpoints.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log('Login response status:', res.status);
      console.log('Login response headers:', Object.fromEntries(res.headers.entries()));
      
      const data = await safeParseJson(res);
      console.log('Login response data:', data);
      
      if (data.success) {
        console.log('Login successful, storing user data:', data.user);
        // Always store in sessionStorage for session persistence
        try {
          sessionStorage.setItem('userData', JSON.stringify(data.user));
          if (data.token) sessionStorage.setItem('token', data.token);
        } catch {}
        
        // Store in localStorage based on rememberMe for persistent login
        if (rememberMe) {
          localStorage.setItem('userData', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('token', data.token);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
          // Still keep a copy in localStorage for current session
          localStorage.setItem('userData', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('token', data.token);
        }
        
        // Keep a mirror in currentUser for legacy reads
        try { localStorage.setItem('currentUser', JSON.stringify(data.user)); } catch {}
        
        // Set role-specific loading message
        const role = data.user?.role;
        if (role === 'superadmin') {
          setLoadingMessage('Welcome, Super Admin!');
        } else if (role === 'admin') {
          setLoadingMessage('Welcome, Admin!');
        } else {
          setLoadingMessage('Welcome!');
        }
        
        // Skip account status check for faster login - backend already validates
        // Account status will be checked on dashboard load if needed
        redirectBasedOnRole(role);
      } else {
        setError(data?.message || 'Invalid email or password');
        setLoading(false);
      }
    } catch (err) {
      console.log('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-logo">
              <h1 className="logo-modern">
                <span className="logo-bite">Bite</span>
                <span className="logo-alert">Alert</span>
                <span className="paw">🐾</span>
              </h1>
            </div>
            <div className="spinner"></div>
            <div className="loading-text">{loadingMessage}</div>
          </div>
        </div>
      )}
      <div
        className="left-panel-modern"
        style={{
          backgroundImage: "url(/img/SANJUAN.jpg)",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* LCP Image with high priority */}
        <img 
          src="/img/SANJUAN.jpg" 
          alt="San Juan Background" 
          style={{ display: 'none' }}
          fetchPriority="high"
          loading="eager"
        />
        <div className="brand-content">
          <h1 className="logo-modern">
            <span className="logo-bite">Bite</span>
            <span className="logo-alert">Alert</span>
            <span className="paw">🐾</span>
          </h1>
          <p className="tagline">Swift Response. Safer San Juan.</p>
          <p className="desc">Effortless data recording, seamless vaccination tracking—keeping our community safe, one record at a time!</p>
        </div>
      </div>

      <div className="right-panel-modern">
        <div className="right-panel-content">
          <form className="login-form-modern" onSubmit={onSubmit}>
            {error && <div id="errorMessage" className="error-message">{error}</div>}
            <label htmlFor="email">Email</label>
            <div className="email-input-container">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setShowEmailPopup(true)}
                onBlur={() => setTimeout(() => setShowEmailPopup(false), 150)}
              />
              <i className="fas fa-envelope" />
              <div id="validationPopup" className={`validation-popup ${showEmailPopup && email ? 'show' : ''}`}>
                <div className="popup-header">Email Requirements</div>
                <ul>
                  <li className={emailRules.lengthValid ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{emailRules.lengthValid ? '✓' : '✗'}</span>
                    Be between 5-254 characters
                  </li>
                  <li className={emailRules.formatValid ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{emailRules.formatValid ? '✓' : '✗'}</span>
                    Include @ and a domain
                  </li>
                  <li className={emailRules.domainValid ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{emailRules.domainValid ? '✓' : '✗'}</span>
                    Have a valid domain extension
                  </li>
                  <li className={emailRules.specialValid ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{emailRules.specialValid ? '✓' : '✗'}</span>
                    Use only letters, numbers, and ._-+
                  </li>
                </ul>
              </div>
            </div>
            <label htmlFor="password">Password</label>
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordPopup(true)}
                onBlur={() => setTimeout(() => setShowPasswordPopup(false), 150)}
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
                onClick={() => setShowPassword((v) => !v)}
              />
              <div id="passwordValidationPopup" className={`password-validation-popup ${showPasswordPopup && password ? 'show' : ''}`}>
                <div className="popup-header">Password Requirements</div>
                <ul>
                  <li className={passwordRules.len ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{passwordRules.len ? '✓' : '✗'}</span>
                    At least 8 characters
                  </li>
                  <li className={passwordRules.upper ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{passwordRules.upper ? '✓' : '✗'}</span>
                    One uppercase letter
                  </li>
                  <li className={passwordRules.lower ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{passwordRules.lower ? '✓' : '✗'}</span>
                    One lowercase letter
                  </li>
                  <li className={passwordRules.number ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{passwordRules.number ? '✓' : '✗'}</span>
                    One number
                  </li>
                  <li className={passwordRules.special ? 'valid' : 'invalid'}>
                    <span className="validation-icon">{passwordRules.special ? '✓' : '✗'}</span>
                    One special character
                  </li>
                </ul>
              </div>
            </div>
            {/* Forgot + Remember row */}
            <div className="auth-row">
              <button type="button" className="forgot-password" onClick={() => setForgotOpen(true)}>Forgot Password?</button>
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
            </div>
            <button type="submit" className="sign-in-btn-modern" disabled={loading}>
              Sign In
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <div className="forgot-overlay" style={{ display: forgotOpen ? 'flex' : 'none' }}>
        <div className="forgot-modal">
          <h3 style={{ color: '#800000', fontWeight: 700, marginBottom: 12 }}>Forgot Password</h3>
          <p style={{ fontSize: '1em', color: '#333', marginBottom: 18 }}>Enter your email, new password, and the OTP sent to your email.</p>
          <input type="email" placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} style={{ width: '100%', padding: '12px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '1em', marginBottom: 14 }} />
          <input type="password" placeholder="New password" value={forgotNewPass} onChange={(e) => setForgotNewPass(e.target.value)} style={{ width: '100%', padding: '12px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '1em', marginBottom: 14 }} />
          <input type="password" placeholder="Confirm new password" value={forgotConfirmPass} onChange={(e) => setForgotConfirmPass(e.target.value)} style={{ width: '100%', padding: '12px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '1em', marginBottom: 14 }} />
          <input type="text" placeholder="Enter OTP" maxLength={6} value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} style={{ width: '100%', padding: '12px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '1em', marginBottom: 14 }} />
          {forgotMsg && (
            <div style={{ fontSize: '0.98em', color: forgotMsgColor, marginBottom: 10 }}>{forgotMsg}</div>
          )}
          <div className="forgot-actions">
            <button type="button" className="btn-forgot btn-cancel" onClick={() => setForgotOpen(false)}>Cancel</button>
            <button
              type="button"
              className="btn-forgot btn-send"
              onClick={async () => {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(forgotEmail.trim())) {
                  setForgotMsg('Please enter a valid email address.');
                  setForgotMsgColor('#dc3545');
                  return;
                }
                try {
                  setForgotMsg('Sending OTP...');
                  setForgotMsgColor('#800000');
                  const res = await apiFetch('/api/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail.trim() })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setForgotMsg('OTP sent to your email.');
                    setForgotMsgColor('#43b66c');
                  } else {
                    setForgotMsg(data.message || 'Failed to send OTP.');
                    setForgotMsgColor('#dc3545');
                  }
                } catch (err) {
                  setForgotMsg('Error sending OTP. Please try again.');
                  setForgotMsgColor('#dc3545');
                }
              }}
            >
              Send OTP
            </button>
            <button
              type="button"
              className="btn-forgot btn-reset"
              onClick={async () => {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(forgotEmail.trim())) {
                  setForgotMsg('Please enter a valid email address.');
                  setForgotMsgColor('#dc3545');
                  return;
                }
                if (forgotNewPass.length < 8) {
                  setForgotMsg('Password must be at least 8 characters.');
                  setForgotMsgColor('#dc3545');
                  return;
                }
                if (forgotNewPass !== forgotConfirmPass) {
                  setForgotMsg('Passwords do not match.');
                  setForgotMsgColor('#dc3545');
                  return;
                }
                if (!forgotOtp.trim()) {
                  setForgotMsg('Please enter the OTP.');
                  setForgotMsgColor('#dc3545');
                  return;
                }
                try {
                  setForgotMsg('Resetting password...');
                  setForgotMsgColor('#800000');
                  const res = await apiFetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail.trim(), otp: forgotOtp.trim(), newPassword: forgotNewPass })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setForgotMsg('Password reset successful! You can now log in.');
                    setForgotMsgColor('#43b66c');
                    setTimeout(() => setForgotOpen(false), 2000);
                  } else {
                    setForgotMsg(data.message || 'Invalid OTP or error.');
                    setForgotMsgColor('#dc3545');
                  }
                } catch (err) {
                  setForgotMsg('Error resetting password. Please try again.');
                  setForgotMsgColor('#dc3545');
                }
              }}
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

 