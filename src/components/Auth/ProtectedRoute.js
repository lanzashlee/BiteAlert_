import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../config/api';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if user data exists in storage (token optional)
        // Prefer sessionStorage (survives refresh), fall back to localStorage
        const userData =
          sessionStorage.getItem('userData') ||
          localStorage.getItem('userData') ||
          sessionStorage.getItem('currentUser') ||
          localStorage.getItem('currentUser');

        if (!userData) {
          console.log('No user data found, redirecting to login');
          navigate('/login');
          return;
        }

        const user = JSON.parse(userData);
        console.log('Checking authentication for user:', user);

        // Check if role is required and matches
        if (requiredRole && user.role !== requiredRole) {
          console.log(`User role ${user.role} does not match required role ${requiredRole}`);
          navigate('/login');
          return;
        }

        // Skip API verification for faster loading - trust storage
        // Only check account status for admins (optional check)
        if (user.role === 'admin') {
          try {
            console.log('Checking admin account status for:', user.email);
            const statusResponse = await apiFetch(`/api/account-status/${encodeURIComponent(user.email)}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log('Account status response:', statusData);
              if (statusData.success && statusData.account && statusData.account.isActive === false) {
                console.log('Account is deactivated, redirecting to login');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userData');
                localStorage.removeItem('token');
                navigate('/login');
                return;
              }
            } else {
              console.warn('Account status check failed, but continuing with authentication');
            }
          } catch (error) {
            console.warn('Failed to check account status:', error);
            console.log('Continuing with authentication despite status check failure');
            // Continue with authentication even if status check fails
          }
        }

        console.log('Authentication successful');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check error:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [navigate, requiredRole]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
};

export default ProtectedRoute;
