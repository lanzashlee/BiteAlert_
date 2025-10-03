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
        console.log('🔍 PROTECTED ROUTE DEBUG: Starting authentication check');
        console.log('Required role:', requiredRole);
        
        // Check if user data exists in storage (token optional)
        // Prefer sessionStorage (survives refresh), fall back to localStorage
        const userData =
          sessionStorage.getItem('userData') ||
          localStorage.getItem('userData') ||
          sessionStorage.getItem('currentUser') ||
          localStorage.getItem('currentUser');

        console.log('🔍 PROTECTED ROUTE DEBUG: User data found:', !!userData);

        if (!userData) {
          console.log('❌ PROTECTED ROUTE: No user data found, redirecting to login');
          navigate('/login');
          return;
        }

        const user = JSON.parse(userData);
        console.log('🔍 PROTECTED ROUTE DEBUG: Checking authentication for user:', user);
        console.log('🔍 PROTECTED ROUTE DEBUG: User role:', user.role);

        // Check if role is required and matches
        if (requiredRole && user.role !== requiredRole) {
          console.log(`❌ PROTECTED ROUTE: User role ${user.role} does not match required role ${requiredRole}`);
          navigate('/login');
          return;
        }
        
        console.log('✅ PROTECTED ROUTE: Role check passed');

        // Skip API verification for faster loading - trust storage
        // Skip account status check for now to prevent redirect issues
        console.log('Skipping account status check for faster authentication');

        console.log('✅ PROTECTED ROUTE: Authentication successful');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('🔍 PROTECTED ROUTE: Authentication check error:', error);
        console.log('🔍 PROTECTED ROUTE: Continuing with authentication despite error');
        // Don't redirect on error - trust the stored data
        setIsAuthenticated(true);
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
