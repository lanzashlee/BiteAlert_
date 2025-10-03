import React, { useEffect, useMemo, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedModal from '../UnifiedModal';
import './SuperAdminCenter.css';
import { apiFetch } from '../../config/api';

const SuperAdminCenter = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Center');
  const [formError, setFormError] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ centerName: '', address: '', contactPerson: '', contactNumber: '' });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const centerOptions = useMemo(() => {
    const names = Array.from(
      new Set((centers || []).map(c => String(c.centerName || '').trim()).filter(Boolean))
    ).sort((a,b)=>a.localeCompare(b));
    return names;
  }, [centers]);

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

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await apiFetch('/api/centers');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        // Exclude archived centers from the main list
        const activeOnly = (list || []).filter((c) => !c.isArchived);
        setCenters(activeOnly);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchCenters();
  }, []);

  const openAdd = () => {
    setForm({ centerName: '', address: '', contactPerson: '', contactNumber: '' });
    setEditId(null);
    setModalTitle('Add Center');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setForm({
      centerName: c.centerName || '',
      address: c.address || '',
      contactPerson: c.contactPerson || '',
      contactNumber: c.contactNumber || ''
    });
    setEditId(c._id);
    setModalTitle('Update Center');
    setFormError('');
    setShowModal(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const { centerName, address, contactPerson, contactNumber } = form;
    if (!centerName || !address || !contactPerson || !contactNumber) {
      setFormError('All fields are required.');
      return;
    }
    // Check duplicate by name (case-insensitive) except self when editing
    const duplicate = centers.some((c) => (c.centerName || '').toLowerCase() === centerName.toLowerCase() && (!editId || c._id !== editId));
    if (duplicate && !editId) {
      setFormError('A center with this name already exists.');
      return;
    }
    try {
      const opts = {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerName, address, contactPerson, contactNumber })
      };
      const url = editId ? `/api/centers/${editId}` : '/api/centers';
      const res = await apiFetch(url, opts);
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Save failed');
      setShowModal(false);
      // refresh
      const r = await apiFetch('/api/centers');
      const d = await r.json();
      const list = Array.isArray(d) ? d : (d.data || d.centers || []);
      setCenters(list);
    } catch (err) {
      setFormError(err.message || 'Error saving center');
    }
  };

  const askArchive = (c) => {
    setArchiveTarget(c);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!archiveTarget?._id) return;
    try {
      const res = await apiFetch(`/api/centers/${archiveTarget._id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Archive failed');
      setShowArchiveModal(false);
      setArchiveTarget(null);
      // Optimistically remove the archived center from the active list
      setCenters((prev) => prev.filter((c) => c._id !== json.data?._id && c._id !== archiveTarget._id));
    } catch (err) {
      alert(err.message || 'Failed to archive');
    }
  };

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">
        <div className="content-header">
          <h2>Center Data Management</h2>
        </div>

        <div className="center-toolbar">
          <div className="toolbar-left">
            <div className="search-input">
              <i className="fa fa-search" />
              <input
                type="text"
                placeholder="Search by center, address, or contact person..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select 
              className="filter-select" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort centers by"
              title="Sort centers"
            >
              <option value="name">Sort: Center Name (A-Z)</option>
              <option value="address">Sort: Address (A-Z)</option>
              <option value="contact">Sort: Contact Person (A-Z)</option>
            </select>
          </div>
          <div className="toolbar-right">
            <select
              className="filter-select"
              value={centerFilter}
              onChange={(e)=>setCenterFilter(e.target.value)}
              aria-label="Filter by center"
              title="Filter by center"
            >
              <option value="">All Centers</option>
              {centerOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button className="primary-btn" onClick={openAdd} aria-label="Add new health center" title="Add Center">
              <i className="fa fa-plus" /> Add Center
            </button>
            <a className="secondary-btn" href="/superadmin/center-archive">
              <i className="fa fa-archive" /> View Archived
            </a>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" aria-label="Loading centers">
            <i className="fa fa-spinner fa-spin"></i>
          </div>
        ) : (
          <div className="table-container">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Center Name</th>
                  <th>Address</th>
                  <th>Contact Person</th>
                  <th>Contact Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                                 {centers.length === 0 ? (
                   <tr>
                     <td colSpan={5} style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#6b7280' }}>
                       <i className="fa fa-inbox" style={{ fontSize: '3rem', marginBottom: '1.5rem', display: 'block', opacity: 0.5 }}></i>
                       <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#374151' }}>No health centers found</p>
                       <p style={{ margin: '0.75rem 0 0 0', fontSize: '1rem', opacity: 0.7 }}>Add your first health center to get started</p>
                     </td>
                   </tr>
                ) : (
                  centers
                    .filter((c) => {
                      const s = query.trim().toLowerCase();
                      const cf = centerFilter.trim().toLowerCase();
                      const matchesSearch = !s || [c.centerName, c.address, c.contactPerson, c.contactNumber]
                        .filter(Boolean)
                        .some(v => String(v).toLowerCase().includes(s));
                      const matchesCenter = !cf || String(c.centerName || '')
                        .toLowerCase()
                        .replace(/\s*health\s*center$/, '')
                        .replace(/\s*center$/, '')
                        .replace(/-/g,' ')
                        .includes(cf.replace(/-/g,' '));
                      return matchesSearch && matchesCenter;
                    })
                    .sort((a, b) => {
                      const ax = (sortBy === 'address' ? a.address : sortBy === 'contact' ? a.contactPerson : a.centerName) || '';
                      const bx = (sortBy === 'address' ? b.address : sortBy === 'contact' ? b.contactPerson : b.centerName) || '';
                      return String(ax).localeCompare(String(bx));
                    })
                    .map((c) => (
                                         <tr key={c._id}>
                       <td>
                         <strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>{c.centerName || '—'}</strong>
                       </td>
                       <td style={{ fontSize: '1rem' }}>{c.address || '—'}</td>
                       <td style={{ fontSize: '1rem' }}>{c.contactPerson || '—'}</td>
                       <td style={{ fontSize: '1rem' }}>{c.contactNumber || '—'}</td>
                                             <td className="table-actions">
                         <button className="update-btn" onClick={() => openEdit(c)} aria-label={`Update ${c.name} center information`} title="Update">
                           <i className="fa fa-edit" /> Update
                         </button>
                         <button className="archive-btn" onClick={() => askArchive(c)} aria-label={`Archive ${c.name} center`} title="Archive">
                           <i className="fa fa-archive" /> Archive
                         </button>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      {showModal && (
        <div className="react-modal-backdrop" onClick={(e) => { if (e.target.classList.contains('react-modal-backdrop')) setShowModal(false); }}>
          <div className="react-modal">
            <div className="react-modal-header">
              <h4 className="react-modal-title">{modalTitle}</h4>
              <button className="modal-close-btn" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={submitForm}>
              <div className="react-modal-body">
                {formError ? <div className="error-text">{formError}</div> : null}
                <div className="form-row">
                  <label htmlFor="centerName">Center Name</label>
                  <select id="centerName" value={form.centerName} onChange={(e) => setForm({ ...form, centerName: e.target.value })} required>
                    <option value="">Select Center</option>
                    {['Addition Hills','Balong-Bato','Batis','Corazon De Jesus','Ermitaño','Halo-halo','Isabelita','Kabayanan','Little Baguio','Maytunas','Onse','Pasadeña','Pedro Cruz','Progreso','Rivera','Salapan','San Perfecto','Santa Lucia','Tibagan','West Crame','Greenhills'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label htmlFor="address">Address</label>
                  <input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label htmlFor="contactPerson">Contact Person</label>
                  <input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input id="contactNumber" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} required />
                </div>
              </div>
              <div className="react-modal-footer">
                <button type="button" className="modal-btn modal-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="modal-btn modal-btn-primary">Save Center</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showArchiveModal && archiveTarget && (
        <div className="react-modal-backdrop" onClick={(e) => { if (e.target.classList.contains('react-modal-backdrop')) setShowArchiveModal(false); }}>
          <div className="react-modal">
            <div className="react-modal-header">
              <h4 className="react-modal-title">Confirm Archive</h4>
              <button 
                onClick={() => setShowArchiveModal(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.5rem', 
                  color: '#6b7280', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.color = '#374151'}
                onMouseOut={(e) => e.target.style.color = '#6b7280'}
              >
                ✕
              </button>
            </div>
            <div className="react-modal-body">
              <p>Are you sure you want to archive the following center?</p>
              <p><strong>Center Name:</strong> {archiveTarget.centerName}</p>
              <p><strong>Address:</strong> {archiveTarget.address}</p>
              <p><strong>Contact Person:</strong> {archiveTarget.contactPerson}</p>
              <p><strong>Contact Number:</strong> {archiveTarget.contactNumber}</p>
            </div>
            <div className="react-modal-footer">
                             <button 
                 type="button" 
                 onClick={() => setShowArchiveModal(false)}
                 style={{
                   padding: '12px 24px',
                   borderRadius: '10px',
                   border: '2px solid #e5e7eb',
                   background: '#ffffff',
                   color: '#374151',
                   cursor: 'pointer',
                   fontWeight: '600',
                   fontSize: '1rem',
                   transition: 'all 0.2s ease',
                   fontFamily: 'Poppins, sans-serif',
                   minHeight: '48px'
                 }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = '#ffffff';
                }}
              >
                Cancel
              </button>
                             <button 
                 type="button" 
                 onClick={confirmArchive}
                 style={{
                   padding: '12px 24px',
                   borderRadius: '10px',
                   border: 'none',
                   background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                   color: '#ffffff',
                   cursor: 'pointer',
                   fontWeight: '600',
                   fontSize: '1rem',
                   transition: 'all 0.2s ease',
                   fontFamily: 'Poppins, sans-serif',
                   boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
                   display: 'inline-flex',
                   alignItems: 'center',
                   gap: '8px',
                   minHeight: '48px'
                 }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 8px -1px rgba(239, 68, 68, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.2)';
                }}
              >
                <i className="fa fa-archive" /> Archive Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      <UnifiedModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        subtitle="You will need to log in again to access your account."
        icon={<i className="fa-solid fa-right-from-bracket"></i>}
        iconType="default"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmSignOut}
      />
    </div>
  );
};

export default SuperAdminCenter;
