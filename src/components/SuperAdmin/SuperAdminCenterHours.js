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
  
  // Debug state changes
  useEffect(() => {
    console.log('🔍 showEditModal changed to:', showEditModal);
  }, [showEditModal]);
  
  useEffect(() => {
    console.log('🔍 editingId changed to:', editingId);
  }, [editingId]);

  const fetchData = async () => {
    try {
      console.log('Fetching centers data...');
      const centersRes = await apiFetch('/api/centers');
      const data = await centersRes.json();
      console.log('Centers API response:', data);
      
      const list = Array.isArray(data) ? data : (data.data || data.centers || []);
      console.log('🔍 Centers list:', list);
      
      // Log each center's hours structure
      list.forEach(center => {
        console.log(`🔍 Center: ${center.name || center.centerName}, Hours:`, center.hours);
      });
      
      setCenters(list);
      console.log('Centers loaded:', list.length);
      
      // Since hours are stored directly in centers, we don't need a separate API call
      setHoursByCenterId({});
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultHoursForAll = async () => {
    if (!window.confirm('This will set default hours (8:00 AM - 5:00 PM weekdays, 9:00 AM - 3:00 PM weekends) for all centers that don\'t have hours set. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const defaultHours = {
        weekday: { start: '08:00', end: '17:00' },
        weekend: { start: '09:00', end: '15:00' }
      };

      const promises = centers.map(async (center) => {
        const hasHours = center.hours && Object.keys(center.hours).length > 0;
        if (!hasHours) {
          const updateDoc = {
            hours: defaultHours,
          };

          const res = await apiFetch(`/api/centers/${encodeURIComponent(center._id)}/hours`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateDoc),
          });

          if (res.ok) {
            return { centerId: center._id, success: true };
          } else {
            console.error(`Failed to set default hours for ${center.centerName || center.name}`);
            return { centerId: center._id, success: false };
          }
        }
        return { centerId: center._id, success: true, skipped: true };
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success && !r.skipped).length;
      const skippedCount = results.filter(r => r.skipped).length;

      alert(`Default hours set for ${successCount} centers. ${skippedCount} centers already had hours set.`);
      
      // Refresh data to show updated hours
      await fetchData();
    } catch (error) {
      console.error('Error setting default hours:', error);
      alert('Error setting default hours. Please try again.');
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
    const hours = center.hours || {};
    console.log('🔍 Getting weekday hours for center:', center.name, 'hours:', hours);
    
    // Check if there's a general weekday hours setting
    if (hours.weekday && hours.weekday.start && hours.weekday.end) {
      console.log('🔍 Found weekday hours:', hours.weekday);
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
    
    // Return default message if no hours are set
    console.log('🔍 No weekday hours found for:', center.name);
    return 'Not Set';
  };

  const getWeekendHours = (center) => {
    const hours = center.hours || {};
    console.log('🔍 Getting weekend hours for center:', center.name, 'hours:', hours);
    
    // Check if there's a general weekend hours setting
    if (hours.weekend && hours.weekend.start && hours.weekend.end) {
      console.log('🔍 Found weekend hours:', hours.weekend);
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
    
    // Return default message if no weekend hours are set
    console.log('🔍 No weekend hours found for:', center.name);
    return 'Not Set';
  };

  const beginEdit = (center) => {
    console.log('🔍 beginEdit called for center:', center);
    
    const baseHours = center.hours || {};
    console.log('🔍 Base hours from center:', baseHours);
    
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
    
    // Provide default hours if none are set
    const defaultWeekdayStart = weekdayHours.start || '08:00';
    const defaultWeekdayEnd = weekdayHours.end || '17:00';
    const defaultWeekendStart = weekendHours.start || '09:00';
    const defaultWeekendEnd = weekendHours.end || '15:00';
    
    const values = {
      contact: center.contactNumber || '',
      weekday: { 
        start: weekdayHours.start || defaultWeekdayStart, 
        end: weekdayHours.end || defaultWeekdayEnd 
      },
      weekend: { 
        start: weekendHours.start || defaultWeekendStart, 
        end: weekendHours.end || defaultWeekendEnd 
      }
    };
    
    console.log('🔍 Edit values:', values);
    
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
      console.log('🔍 Saving edit for center:', center);
      console.log('🔍 Edit values:', editValues);
      
      // Validate and clean hours — check weekday and weekend
      const cleanedHours = {};
      
      // Validate weekday hours
      const weekdaySlot = editValues.weekday || {};
      const weekdayStart = (weekdaySlot.start || '').trim();
      const weekdayEnd = (weekdaySlot.end || '').trim();
      
      console.log('🔍 Weekday validation:', { weekdayStart, weekdayEnd });
      
      if (weekdayStart && weekdayEnd) {
        cleanedHours.weekday = { start: weekdayStart, end: weekdayEnd };
        console.log('🔍 Added weekday hours:', cleanedHours.weekday);
      } else if (weekdayStart || weekdayEnd) {
        alert('Please provide both start and end times for Weekdays.');
        return;
      }
      
      // Validate weekend hours
      const weekendSlot = editValues.weekend || {};
      const weekendStart = (weekendSlot.start || '').trim();
      const weekendEnd = (weekendSlot.end || '').trim();
      
      console.log('🔍 Weekend validation:', { weekendStart, weekendEnd });
      
      if (weekendStart && weekendEnd) {
        cleanedHours.weekend = { start: weekendStart, end: weekendEnd };
        console.log('🔍 Added weekend hours:', cleanedHours.weekend);
      } else if (weekendStart || weekendEnd) {
        alert('Please provide both start and end times for Weekend.');
        return;
      }

      // Validate that at least one set of hours is provided
      if (Object.keys(cleanedHours).length === 0) {
        alert('Please provide at least weekday or weekend hours.');
        return;
      }

      // Build update document for centers collection
      const updateDoc = {
        hours: cleanedHours,
        contactNumber: (editValues.contact || '').trim(),
      };

      console.log('🔍 Final update document:', updateDoc);

      // Update the center hours using the new endpoint
      const res = await apiFetch(`/api/centers/${encodeURIComponent(center._id)}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateDoc),
      });
      
      console.log('🔍 Save response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('🔍 Save error response:', errorText);
        let errorMessage = 'Failed to save center hours';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        alert(errorMessage);
        return;
      }

      const result = await res.json();
      console.log('🔍 Save result:', result);

      // Update local centers data
      setCenters(prevCenters => 
        prevCenters.map(c => 
          c._id === center._id 
            ? { ...c, hours: cleanedHours, contactNumber: updateDoc.contactNumber }
            : c
        )
      );
      
      alert('Center hours saved successfully!');
      cancelEdit();
    } catch (err) {
      console.error('🔍 Save error:', err);
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-success" 
              onClick={setDefaultHoursForAll}
              disabled={loading}
              title="Set default hours for all centers without hours"
            >
              <i className="fa-solid fa-clock"></i> Set Default Hours
            </button>
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
                      <td>
                        {getWeekdaysHours(c)}
                        <br/><small style={{color: '#666', fontSize: '0.7em'}}>
                          Debug: {JSON.stringify(c.hours || {})}
                        </small>
                      </td>
                      <td>
                        {getWeekendHours(c)}
                        <br/><small style={{color: '#666', fontSize: '0.7em'}}>
                          Debug: {JSON.stringify(c.hours?.weekend || c.hours?.saturday || c.hours?.sunday || {})}
                        </small>
                      </td>
                      <td>{c.contactNumber || '—'}</td>
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
        <div className="react-modal-backdrop" onClick={(e) => { if (e.target.classList.contains('react-modal-backdrop')) cancelEdit(); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="react-modal" style={{ maxWidth: '760px', backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
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
