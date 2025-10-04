import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import './SuperAdminAuditTrail.css';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import { apiFetch, apiConfig } from '../../config/api';
import { getUserCenter, filterByCenter } from '../../utils/userContext';

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  } catch {
    return value || '';
  }
}

const SuperAdminAuditTrail = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [role, setRole] = useState('');
  const [center, setCenter] = useState('');
  const [centerOptions, setCenterOptions] = useState([]);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const location = useLocation();

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
          const res = await apiFetch(`/api/account-status/${encodeURIComponent(currentUser.email)}`);
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
        await apiFetch(apiConfig.endpoints.logout, {
          method: 'POST',
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
    const load = async () => {
      setLoading(true);
      try {
        const userCenter = getUserCenter();
        console.log('🔍 AUDIT TRAIL DEBUG: Loading audit trail for center:', userCenter);
        
        const res = await apiFetch(apiConfig.endpoints.auditTrail);
        if (!res.ok) throw new Error('Failed to load audit trail');
        const json = await res.json();
        const allData = Array.isArray(json) ? json : (json.data || []);
        
        // Apply client-side filtering for admin users
        const filteredData = filterByCenter(allData, 'centerName');
        console.log('🔍 AUDIT TRAIL DEBUG: Total entries before filtering:', allData.length);
        console.log('🔍 AUDIT TRAIL DEBUG: Filtered entries for center:', filteredData.length);
        
        setData(filteredData);
      } catch (e) {
        console.error('Error loading audit trail:', e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // fetch centers for filter options
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await apiFetch(apiConfig.endpoints.centers);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        const names = Array.from(new Set((list || [])
          .filter(c => !c.isArchived)
          .map(c => String(c.centerName || c.name || '').trim())
          .filter(Boolean))).sort((a,b)=>a.localeCompare(b));
        setCenterOptions(names);
      } catch (_) {
        setCenterOptions([]);
      }
    };
    fetchCenters();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...data];
    if (from) arr = arr.filter(x => new Date(x.timestamp) >= new Date(from));
    if (to) arr = arr.filter(x => new Date(x.timestamp) <= new Date(to));
    if (role) arr = arr.filter(x => x.role && x.role.toLowerCase() === role.toLowerCase());
    if (center) {
      const norm = (v) => String(v || '')
        .toLowerCase()
        .replace(/\s*health\s*center$/i,'')
        .replace(/\s*center$/i,'')
        .replace(/-/g,' ')
        .trim();
      const want = norm(center);
      arr = arr.filter(x => norm(x.centerName || x.center) === want);
    }
    const s = search.trim().toLowerCase();
    if (s) {
      arr = arr.filter(entry => {
        let displayId = '';
        if (entry.role === 'admin' && entry.adminID) displayId = entry.adminID;
        else if (entry.role === 'superadmin' && entry.superAdminID) displayId = entry.superAdminID;
        else if (entry.patientID) displayId = entry.patientID;
        else if (entry.staffID) displayId = entry.staffID;
        const fullName = [entry.firstName, entry.middleName, entry.lastName].filter(Boolean).join(' ').toLowerCase();
        return (
          (displayId && String(displayId).toLowerCase().includes(s)) ||
          fullName.includes(s) ||
          (entry.action && entry.action.toLowerCase().includes(s))
        );
      });
    }
    return arr;
  }, [data, from, to, role, center, search]);

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="content-header">
          <h2>Audit Trail</h2>
          {/* Export removed per request */}
        </div>

        <div className="content-body">
          <div className="filters-section">
            <div className="filter-group">
              <input 
                type="text" 
                placeholder="Search by ID, name, action..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <input 
                type="date" 
                value={from} 
                onChange={e => setFrom(e.target.value)}
                className="form-control"
              />
              <span className="filter-separator">to</span>
              <input 
                type="date" 
                value={to} 
                onChange={e => setTo(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <select value={role} onChange={e => setRole(e.target.value)} className="form-control">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
                <option value="staff">Staff</option>
                <option value="patient">Patient</option>
              </select>
            </div>
            <div className="filter-group">
              <select value={center} onChange={e => setCenter(e.target.value)} className="form-control">
                <option value="">All Centers</option>
                {centerOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Role</th>
                  <th>Name</th>
                  <th>Action</th>
                  <th>Center</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="loading-cell">
                      <div className="responsive-loading"><div className="responsive-spinner"></div></div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      <div className="empty-state">
                        <i className="fa-solid fa-file-lines" />
                        <p>No audit records found</p>
                        <small>Try adjusting your filters or search terms</small>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((entry, idx) => {
                  let displayId = '';
                  if (entry.role === 'admin' && entry.adminID) displayId = entry.adminID;
                  else if (entry.role === 'superadmin' && entry.superAdminID) displayId = entry.superAdminID;
                  else if (entry.patientID) displayId = entry.patientID;
                  else if (entry.staffID) displayId = entry.staffID;
                  
                  return (
                    <tr key={idx}>
                      <td>
                        <span className="id-badge">{displayId || 'N/A'}</span>
                      </td>
                      <td>
                        <span className={`role-badge role-${entry.role?.toLowerCase()}`}>
                          {entry.role}
                        </span>
                      </td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">
                            {[entry.firstName, entry.middleName, entry.lastName].filter(Boolean).join(' ')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="action-text">{entry.action}</span>
                      </td>
                      <td>
                        <span className="center-name">{entry.centerName || entry.center || 'N/A'}</span>
                      </td>
                      <td>
                        <span className="timestamp">{formatDateTime(entry.timestamp)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="table-footer">
              <div className="table-info">
                Showing {filtered.length} of {data.length} records
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

export default SuperAdminAuditTrail;


