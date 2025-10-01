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
        // Check if user data exists in localStorage
        const userData = localStorage.getItem('currentUser') || localStorage.getItem('userData');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          console.log('No user data or token found, redirecting to login');
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

        // Verify session with backend
        try {
          const response = await apiFetch('/api/verify-session', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!response.ok) {
            console.log('Session verification failed, redirecting to login');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }

          const data = await response.json();
          if (!data.success) {
            console.log('Session verification returned failure, redirecting to login');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }

          // Check account status for admins
          if (user.role === 'admin') {
            try {
              const statusResponse = await apiFetch(`/api/account-status/${encodeURIComponent(user.email)}`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.success && statusData.account && statusData.account.isActive === false) {
                  console.log('Account is deactivated, redirecting to login');
                  localStorage.removeItem('currentUser');
                  localStorage.removeItem('userData');
                  localStorage.removeItem('token');
                  navigate('/login');
                  return;
                }
              }
            } catch (error) {
              console.warn('Failed to check account status:', error);
              // Continue with authentication even if status check fails
            }
          }

          console.log('Authentication successful');
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Session verification error:', error);
          // If API is down, still allow access if user data exists
          console.log('API verification failed, but allowing access with stored data');
          setIsAuthenticated(true);
        }
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
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading...</p>
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
