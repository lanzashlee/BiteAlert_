import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import './SuperAdminAuditTrail.css';
import { apiFetch, apiConfig } from '../../config/api';
import { fullLogout } from '../../utils/auth';
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
  const userCenterForRole = getUserCenter();
  const isSuperAdmin = !userCenterForRole || userCenterForRole === 'all';
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 50;
  
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const location = useLocation();

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userCenter = getUserCenter();
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('userData') || 'null');
        const roleFromUser = (currentUser?.role || '').toLowerCase();
        const patientKey = currentUser?._id || currentUser?.patientId || currentUser?.patientID || currentUser?.id || '';
        console.log('🔍 AUDIT TRAIL DEBUG:', { userCenter, roleFromUser, patientKey });
        
        // Fetch audit trail data from multiple sources
        let allData = [];
        let usedCenterParam = false;
        
        try {
          // 1. Fetch admin audit trail
          let url = apiConfig.endpoints.auditTrail;
          const params = new URLSearchParams();
          if (roleFromUser === 'admin' || roleFromUser === 'staff') {
            if (userCenter && userCenter !== 'all') params.set('center', userCenter);
            usedCenterParam = userCenter && userCenter !== 'all';
          } else if (roleFromUser === 'patient' && patientKey) {
            params.set('patientId', patientKey);
          }
          if ([...params.keys()].length > 0) url = `${apiConfig.endpoints.auditTrail}?${params.toString()}`;
          
          const res = await apiFetch(url);
          if (res.ok) {
            const json = await res.json();
            const adminData = Array.isArray(json) ? json : (json.data || []);
            allData = [...allData, ...adminData];
          }
        } catch (error) {
          console.warn('Error fetching admin audit trail:', error);
        }
        
        try {
          // 2. Fetch staff activities
          const staffRes = await apiFetch('/api/staffs');
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            const staffs = Array.isArray(staffData) ? staffData : (staffData.data || []);
            
            // Convert staff data to audit trail format
            const staffAuditEntries = staffs
              .filter(staff => {
                if (userCenter && userCenter !== 'all') {
                  const staffCenter = staff.center || staff.centerName || staff.officeAddress || '';
                  return staffCenter.toLowerCase().includes(userCenter.toLowerCase()) ||
                         userCenter.toLowerCase().includes(staffCenter.toLowerCase());
                }
                return true;
              })
              .map(staff => {
                // Try to find the proper staff ID from various possible fields
                const staffId = staff.staffId || staff.staffID || staff.id || `STF-${staff._id}`;
                console.log('🔍 STAFF ID MAPPING:', {
                  staffId: staff.staffId,
                  staffID: staff.staffID,
                  id: staff.id,
                  _id: staff._id,
                  finalId: staffId
                });
                
                return {
                  id: staffId,
                  role: 'Staff',
                  name: staff.fullName || `${staff.firstName} ${staff.lastName}`,
                  action: 'Staff account created',
                  timestamp: staff.createdAt || new Date().toISOString(),
                  center: staff.center || staff.centerName || staff.officeAddress || '',
                  barangay: staff.barangay || '',
                  userId: staff._id,
                  staffId: staffId
                };
              });
            
            allData = [...allData, ...staffAuditEntries];
          }
        } catch (error) {
          console.warn('Error fetching staff data:', error);
        }
        
        try {
          // 3. Fetch patient activities
          const patientRes = await apiFetch('/api/patients');
          if (patientRes.ok) {
            const patientData = await patientRes.json();
            const patients = Array.isArray(patientData) ? patientData : (patientData.data || []);
            
            // Convert patient data to audit trail format
            const patientAuditEntries = patients
              .filter(patient => {
                if (userCenter && userCenter !== 'all') {
                  const patientCenter = patient.center || patient.centerName || '';
                  const patientBarangay = patient.barangay || patient.addressBarangay || '';
                  return patientCenter.toLowerCase().includes(userCenter.toLowerCase()) ||
                         patientBarangay.toLowerCase().includes(userCenter.toLowerCase()) ||
                         userCenter.toLowerCase().includes(patientCenter.toLowerCase()) ||
                         userCenter.toLowerCase().includes(patientBarangay.toLowerCase());
                }
                return true;
              })
              .map(patient => {
                // Try to find the proper patient ID from various possible fields
                const patientId = patient.patientId || patient.patientID || patient.id || `PAT-${patient._id}`;
                console.log('🔍 PATIENT ID MAPPING:', {
                  patientId: patient.patientId,
                  patientID: patient.patientID,
                  id: patient.id,
                  _id: patient._id,
                  finalId: patientId
                });
                
                return {
                  id: patientId,
                  role: 'Patient',
                  name: patient.fullName || `${patient.firstName} ${patient.lastName}`,
                  action: 'Patient registered',
                  timestamp: patient.dateRegistered || patient.createdAt || new Date().toISOString(),
                  center: patient.center || patient.centerName || '',
                  barangay: patient.barangay || patient.addressBarangay || '',
                  userId: patient._id,
                  patientId: patientId
                };
              });
            
            allData = [...allData, ...patientAuditEntries];
          }
        } catch (error) {
          console.warn('Error fetching patient data:', error);
        }
        
        // Sort all data by timestamp (newest first)
        allData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply client-side filtering for admin users
        let filteredData = allData;
        
        // For admin/staff users, filter by center/barangay
        if ((roleFromUser === 'admin' || roleFromUser === 'staff') && userCenter && userCenter !== 'all' && !usedCenterParam) {
          filteredData = allData.filter(entry => {
            const entryCenter = entry.centerName || entry.center || '';
            const entryBarangay = entry.barangay || entry.addressBarangay || '';
            
            // Normalize strings for comparison
            const normalizedCenter = userCenter.toLowerCase().trim();
            const normalizedEntryCenter = entryCenter.toLowerCase().trim();
            const normalizedEntryBarangay = entryBarangay.toLowerCase().trim();
            
            // Check if entry matches user's center or barangay
            const centerMatch = normalizedEntryCenter === normalizedCenter ||
                               normalizedEntryCenter.includes(normalizedCenter) ||
                               normalizedCenter.includes(normalizedEntryCenter);
            
            const barangayMatch = normalizedEntryBarangay === normalizedCenter ||
                                normalizedEntryBarangay.includes(normalizedCenter) ||
                                normalizedCenter.includes(normalizedEntryBarangay);
            
            return centerMatch || barangayMatch;
          });
        } else if (roleFromUser === 'patient' && patientKey) {
          // For patients, show only their own actions/records
          filteredData = allData.filter(entry => {
            const idMatches = [entry.patientID, entry.userId, entry.id, entry.patientId]
              .filter(Boolean)
              .map(v => String(v))
              .some(v => v === String(patientKey));
            return idMatches;
          });
        }
        
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
    if (!isSuperAdmin) {
      setCenterOptions([]);
      return;
    }
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
  }, [isSuperAdmin]);

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
    // Calculate pagination
    const total = arr.length;
    const totalPagesCount = Math.ceil(total / PAGE_SIZE);
    setTotalItems(total);
    setTotalPages(totalPagesCount);
    
    // Apply pagination
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    
    return arr.slice(startIndex, endIndex);
  }, [data, from, to, role, center, search, page]);

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="content-header">
          <h2>Audit Trail</h2>
          {/* Export removed per request */}
        </div>

        <div className="content-body">
          {/* Search and Filters */}
          <div className="filters-container">
            <div className="search-box">
              <i className="fa fa-search" />
              <input
                type="text"
                placeholder="Search by ID, name, action..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <input 
                type="date" 
                value={from} 
                onChange={e => setFrom(e.target.value)}
                className="filter-select"
                placeholder="From Date"
                title="Filter from date"
              />
              <input 
                type="date" 
                value={to} 
                onChange={e => setTo(e.target.value)}
                className="filter-select"
                placeholder="To Date"
                title="Filter to date"
              />
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                className="filter-select"
                aria-label="Filter by role"
                title="Filter by role"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
                <option value="staff">Staff</option>
                <option value="patient">Patient</option>
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
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
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
                  // Prefer explicit IDs
                  if (entry.role === 'admin' && entry.adminID) displayId = entry.adminID;
                  else if (entry.role === 'superadmin' && entry.superAdminID) displayId = entry.superAdminID;
                  else if (entry.patientID) displayId = entry.patientID;
                  else if (entry.staffID) displayId = entry.staffID;
                  // Fall back to generic userId or derived ids
                  else if (entry.userId) displayId = entry.userId;
                  else if (entry.id) displayId = entry.id;
                  
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
                        <span className="timestamp">{formatDateTime(entry.timestamp)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
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


