import React, { useEffect, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import { apiFetch } from '../../config/api';
import './SuperAdminCenterHours.css';

const SuperAdminCenterHours = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  // Holds persisted hours/contact from center_hours collection keyed by centerId
  const [hoursByCenterId, setHoursByCenterId] = useState({});
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchData = async () => {
    try {
      console.log('Fetching centers data...');
      // Use Promise.all for parallel requests
      const [centersRes, hoursRes] = await Promise.allSettled([
        apiFetch('/api/centers'),
        apiFetch('/api/center_hours?existingOnly=true')
      ]);

      // Process centers data
      if (centersRes.status === 'fulfilled') {
        const data = await centersRes.value.json();
        console.log('Centers API response:', data);
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        setCenters(list);
        console.log('Centers loaded:', list.length);
      }

      // Process hours data
      if (hoursRes.status === 'fulfilled' && hoursRes.value.ok) {
        const hrsJson = await hoursRes.value.json();
        console.log('Center hours API response:', hrsJson);
        const arr = Array.isArray(hrsJson) ? hrsJson : (hrsJson.data || hrsJson.centers || hrsJson.centerHours || []);
        const map = {};
        (arr || []).forEach((it) => {
          if (!it) return;
          const key = it.centerId || it._id || it.id;
          if (key) {
            map[String(key)] = { hours: it.hours || {}, contactNumber: it.contactNumber || '' };
          }
        });
        setHoursByCenterId(map);
        console.log('Center hours loaded:', Object.keys(map).length);
      } else {
        console.log('Center hours API not available, using default data');
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

  const getHoursForDay = (center, day) => {
    const key = day.toLowerCase();
    const persisted = hoursByCenterId[String(center._id)] || {};
    const hours = persisted.hours || center.hours || {};
    const slot = hours[key] || hours.weekday;
    if (slot && (slot.start || slot.end)) {
      const start = slot.start || '';
      const end = slot.end || '';
      return `${start} - ${end}`.trim();
    }
    return 'N/A';
  };

  const getWeekdaysHours = (center) => {
    const persisted = hoursByCenterId[String(center._id)] || {};
    const hours = persisted.hours || center.hours || {};
    
    // Check if there's a general weekday hours setting
    if (hours.weekday && hours.weekday.start && hours.weekday.end) {
      return `${hours.weekday.start} - ${hours.weekday.end}`;
    }
    
    // Check individual weekday hours and find the most common pattern
    const weekdayHours = [];
    days.forEach(day => {
      const key = day.toLowerCase();
      const slot = hours[key];
      if (slot && slot.start && slot.end) {
        weekdayHours.push(`${slot.start} - ${slot.end}`);
      }
    });
    
    // If all weekdays have the same hours, show them once
    if (weekdayHours.length > 0) {
      const uniqueHours = [...new Set(weekdayHours)];
      if (uniqueHours.length === 1) {
        return uniqueHours[0];
      } else if (uniqueHours.length > 1) {
        return 'Varies';
      }
    }
    
    return 'N/A';
  };

  const getWeekendHours = (center) => {
    const persisted = hoursByCenterId[String(center._id)] || {};
    const hours = persisted.hours || center.hours || {};
    
    // Check if there's a general weekend hours setting
    if (hours.weekend && hours.weekend.start && hours.weekend.end) {
      return `${hours.weekend.start} - ${hours.weekend.end}`;
    }
    
    // Check Saturday and Sunday individually
    const saturday = hours.saturday;
    const sunday = hours.sunday;
    
    if (saturday && saturday.start && saturday.end && sunday && sunday.start && sunday.end) {
      const satHours = `${saturday.start} - ${saturday.end}`;
      const sunHours = `${sunday.start} - ${sunday.end}`;
      if (satHours === sunHours) {
        return satHours;
      } else {
        return `Sat: ${satHours}, Sun: ${sunHours}`;
      }
    } else if (saturday && saturday.start && saturday.end) {
      return `Sat: ${saturday.start} - ${saturday.end}`;
    } else if (sunday && sunday.start && sunday.end) {
      return `Sun: ${sunday.start} - ${sunday.end}`;
    }
    
    return 'N/A';
  };

  const beginEdit = (center) => {
    const persisted = hoursByCenterId[String(center._id)] || {};
    const baseHours = (persisted.hours || center.hours || {});
    
    // Get weekday hours (check for general weekday setting or use first available weekday)
    let weekdayHours = baseHours.weekday || {};
    if (!weekdayHours.start || !weekdayHours.end) {
      // Find first weekday with hours
      for (const day of days) {
        const dayHours = baseHours[day.toLowerCase()];
        if (dayHours && dayHours.start && dayHours.end) {
          weekdayHours = dayHours;
          break;
        }
      }
    }
    
    // Get weekend hours (check for general weekend setting or use Saturday/Sunday)
    let weekendHours = baseHours.weekend || {};
    if (!weekendHours.start || !weekendHours.end) {
      const saturday = baseHours.saturday || {};
      const sunday = baseHours.sunday || {};
      if (saturday.start && saturday.end) {
        weekendHours = saturday;
      } else if (sunday.start && sunday.end) {
        weekendHours = sunday;
      }
    }
    
    const values = {
      contact: (persisted.contactNumber || center.contactNumber || ''),
      weekday: { start: weekdayHours.start || '', end: weekdayHours.end || '' },
      weekend: { start: weekendHours.start || '', end: weekendHours.end || '' }
    };
    
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
      // Validate and clean hours — check weekday and weekend
      const cleanedHours = {};
      
      // Validate weekday hours
      const weekdaySlot = editValues.weekday || {};
      const weekdayStart = (weekdaySlot.start || '').trim();
      const weekdayEnd = (weekdaySlot.end || '').trim();
      if ((weekdayStart && !weekdayEnd) || (!weekdayStart && weekdayEnd)) {
        alert('Please provide both start and end times for Weekdays.');
        return;
      }
      if (weekdayStart && weekdayEnd) {
        cleanedHours.weekday = { start: weekdayStart, end: weekdayEnd };
      }
      
      // Validate weekend hours
      const weekendSlot = editValues.weekend || {};
      const weekendStart = (weekendSlot.start || '').trim();
      const weekendEnd = (weekendSlot.end || '').trim();
      if ((weekendStart && !weekendEnd) || (!weekendStart && weekendEnd)) {
        alert('Please provide both start and end times for Weekend.');
        return;
      }
      if (weekendStart && weekendEnd) {
        cleanedHours.weekend = { start: weekendStart, end: weekendEnd };
      }

      // Build center_hours document for persistence
      const doc = {
        centerId: center._id,
        centerName: center.centerName || center.name,
        hours: cleanedHours,
        contactNumber: (editValues.contact || '').trim(),
        updatedAt: new Date().toISOString(),
      };

      // Upsert into center_hours collection (server supports this route)
      const res = await apiFetch(`/api/center_hours/${encodeURIComponent(center._id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      // Update local persisted-hours map so UI reflects saved data and persists on refresh (since we refetch center_hours)
      setHoursByCenterId((prev) => ({
        ...prev,
        [String(center._id)]: { hours: doc.hours, contactNumber: doc.contactNumber },
      }));
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

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">
        <div className="content-header">
          <h2>Center Service Hours</h2>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            disabled={loading}
          >
            <i className="fa-solid fa-refresh"></i> Refresh Data
          </button>
        </div>
        {loading ? (
          <UnifiedSpinner text="Loading center hours..." />
        ) : (
          <div className="table-container">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Center</th>
                  <th>Weekdays</th>
                  <th>Weekend</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((c) => {
                  return (
                    <tr key={c._id}>
                      <td>{c.centerName || c.name}</td>
                      <td>{getWeekdaysHours(c)}</td>
                      <td>{getWeekendHours(c)}</td>
                      <td>{(hoursByCenterId[String(c._id)]?.contactNumber || c.contactNumber || '—')}</td>
                      <td style={{ textAlign:'right' }}>
                        <button className="btn btn-primary" onClick={() => beginEdit(c)} aria-label={`Edit service hours for ${c.name}`} title="Edit">Edit</button>
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
            <div className="react-modal-body" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:16 }}>
              <div className="form-row">
                <label>Weekdays (Monday - Friday)</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="time" value={editValues.weekday?.start || ''} onChange={(e)=>updateField('weekday','start',e.target.value)} />
                  <span style={{ alignSelf:'center' }}>–</span>
                  <input type="time" value={editValues.weekday?.end || ''} onChange={(e)=>updateField('weekday','end',e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <label>Weekend (Saturday - Sunday)</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="time" value={editValues.weekend?.start || ''} onChange={(e)=>updateField('weekend','start',e.target.value)} />
                  <span style={{ alignSelf:'center' }}>–</span>
                  <input type="time" value={editValues.weekend?.end || ''} onChange={(e)=>updateField('weekend','end',e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <label>Contact Number</label>
                <input type="text" value={editValues.contact || ''} onChange={(e)=>setEditValues((p)=>({...p, contact:e.target.value}))} placeholder="Contact number" />
              </div>
            </div>
            <div className="react-modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={cancelEdit} aria-label="Cancel editing service hours" title="Cancel">Cancel</button>
              <button className="modal-btn modal-btn-primary" onClick={()=>{
                const center = centers.find(c=>c._id===editingId);
                if (center) saveEdit(center);
              }} aria-label="Save service hours changes" title="Save Changes">Save</button>
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
              <button className="cancel-btn" onClick={() => setShowSignoutModal(false)} aria-label="Cancel sign out" title="Cancel">Cancel</button>
              <button className="confirm-btn" onClick={confirmSignOut} aria-label="Confirm sign out" title="Sign out">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCenterHours;
