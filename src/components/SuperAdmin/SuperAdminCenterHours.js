import React, { useEffect, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import './SuperAdminCenterHours.css';

const SuperAdminCenterHours = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        // Fetch centers from Center Data Management
        const res = await fetch('/api/centers');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        setCenters(list);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchCenters();
  }, []);

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

  const getHoursForDay = (center, day) => {
    const key = day.toLowerCase();
    const hours = center.hours || {};
    const slot = hours[key] || hours.weekday;
    if (slot && (slot.start || slot.end)) {
      const start = slot.start || '';
      const end = slot.end || '';
      return `${start} - ${end}`.trim();
    }
    return 'N/A';
  };

  const beginEdit = (center) => {
    const values = { contact: center.contactNumber || '' };
    days.forEach((d) => {
      const key = d.toLowerCase();
      const src = (center.hours && (center.hours[key] || center.hours.weekday)) || {};
      values[key] = { start: src.start || '', end: src.end || '' };
    });
    setEditingId(center._id);
    setEditValues(values);
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
    setShowEditModal(false);
  };

  const updateField = (dayKey, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [dayKey]: { ...(prev[dayKey] || {}), [field]: value },
    }));
  };

  const saveEdit = async (center) => {
    try {
      // Validate and clean hours — only send days with both start and end
      const cleanedHours = {};
      for (const key of ['monday','tuesday','wednesday','thursday','friday']) {
        const slot = editValues[key] || {};
        const start = (slot.start || '').trim();
        const end = (slot.end || '').trim();
        if ((start && !end) || (!start && end)) {
          alert(`Please provide both start and end for ${key.charAt(0).toUpperCase()+key.slice(1)}.`);
          return;
        }
        if (start && end) cleanedHours[key] = { start, end };
      }

      const payload = {
        hours: cleanedHours,
        contactNumber: (editValues.contact || '').trim(),
      };
      // Build center_hours document
      const doc = {
        centerId: center._id,
        centerName: center.centerName || center.name,
        hours: cleanedHours,
        contactNumber: (editValues.contact || '').trim(),
        updatedAt: new Date().toISOString(),
      };

      // Try to upsert into center_hours collection
      let ok = false, lastErr = '';
      // Try common variations to match backend route shapes
      const attempts = [
        { url: `/api/center_hours/${encodeURIComponent(center._id)}`, method: 'PUT' },
        { url: `/api/center_hours?centerId=${encodeURIComponent(center._id)}`, method: 'PUT' },
        { url: '/api/center_hours', method: 'POST' },
      ];
      for (const a of attempts) {
        try {
          const res = await fetch(a.url, {
            method: a.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc),
          });
          if (res.ok) { ok = true; break; }
          const t = await res.text();
          lastErr = t || `HTTP ${res.status}`;
        } catch (e) {
          lastErr = e.message || 'network error';
        }
      }
      if (!ok) throw new Error(lastErr || 'Failed to save to center_hours');

      // Update local list used for view
      setCenters((prev) => prev.map((c) => (
        c._id === center._id
          ? { ...c, hours: { ...(c.hours||{}), ...(doc.hours||{}) }, contactNumber: doc.contactNumber }
          : c
      )));
      cancelEdit();
    } catch (err) {
      alert(err.message || 'Failed to save center hours');
    }
  };

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
        await fetch('/api/logout', {
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

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">
        <div className="content-header">
          <h2>Center Service Hours</h2>
        </div>
        {loading ? (
          <div className="loading-state" aria-label="Loading">
            <i className="fa fa-spinner fa-spin"></i>
          </div>
        ) : (
          <div className="table-container">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Center</th>
                  <th>Monday</th>
                  <th>Tuesday</th>
                  <th>Wednesday</th>
                  <th>Thursday</th>
                  <th>Friday</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((c) => {
                  return (
                    <tr key={c._id}>
                      <td>{c.centerName || c.name}</td>
                      {days.map((d) => (
                        <td key={`${c._id}-${d.toLowerCase()}`}>{getHoursForDay(c, d)}</td>
                      ))}
                      <td>{c.contactNumber || '—'}</td>
                      <td style={{ textAlign:'right' }}>
                        <button className="btn btn-primary" onClick={() => beginEdit(c)}>Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Edit Hours Modal */}
      {showEditModal && (
        <div className="react-modal-backdrop" onClick={(e) => { if (e.target.classList.contains('react-modal-backdrop')) cancelEdit(); }}>
          <div className="react-modal" style={{ maxWidth: '760px' }}>
            <div className="react-modal-header">
              <h4 className="react-modal-title">Edit Service Hours</h4>
              <button className="modal-close-btn" onClick={cancelEdit} aria-label="Close">✕</button>
            </div>
            <div className="react-modal-body" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12 }}>
              {days.map((d) => {
                const key = d.toLowerCase();
                return (
                  <div key={key} className="form-row">
                    <label>{d}</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <input type="time" value={editValues[key]?.start || ''} onChange={(e)=>updateField(key,'start',e.target.value)} />
                      <span style={{ alignSelf:'center' }}>–</span>
                      <input type="time" value={editValues[key]?.end || ''} onChange={(e)=>updateField(key,'end',e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <div className="form-row">
                <label>Contact Number</label>
                <input type="text" value={editValues.contact || ''} onChange={(e)=>setEditValues((p)=>({...p, contact:e.target.value}))} placeholder="Contact number" />
              </div>
            </div>
            <div className="react-modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={()=>{
                const center = centers.find(c=>c._id===editingId);
                if (center) saveEdit(center);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

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

export default SuperAdminCenterHours;
