import React, { useEffect, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import './SuperAdminCenterArchive.css';

const SuperAdminCenterArchive = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [target, setTarget] = useState(null);
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/centers');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || data.centers || []);
      setCenters(list.filter((c) => c.isArchived));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const confirmRestore = async () => {
    if (!target?._id) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/centers/${target._id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Restore failed');
      setTarget(null);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to restore');
    } finally {
      setRestoring(false);
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
          <h2>Archived Centers</h2>
        </div>
        <div className="table-container">
          <div className="barangay-section">
            <h2 className="barangay-header">Archived Centers</h2>
            <p className="barangay-description">View and manage archived health centers.</p>
            <div className="button-group">
              <a className="primary-btn" href="/superadmin/center"><i className="fa fa-arrow-left" /> Back</a>
            </div>
          </div>
          {loading ? (
            <div className="loading-state" aria-label="Loading archived centers">
              <i className="fa fa-spinner fa-spin"></i>
            </div>
          ) : (
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
                    <td colSpan={5} style={{ textAlign: 'center' }}>No archived centers found</td>
                  </tr>
                ) : centers.map((c) => (
                  <tr key={c._id}>
                    <td>{c.centerName || ''}</td>
                    <td>{c.address || ''}</td>
                    <td>{c.contactPerson || ''}</td>
                    <td>{c.contactNumber || ''}</td>
                    <td className="table-actions">
                      <button className="restore-btn" onClick={() => setTarget(c)}><i className="fa fa-undo" /> Restore</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {target && (
        <div className="react-modal-backdrop" onClick={(e) => { if (e.target.classList.contains('react-modal-backdrop')) setTarget(null); }}>
          <div className="react-modal">
            <div className="react-modal-header">
              <h4 className="react-modal-title">Confirm Restore</h4>
              <button onClick={() => setTarget(null)} className="archive-btn" style={{ padding: '6px 10px' }}>✕</button>
            </div>
            <div className="react-modal-body">
              <p>Are you sure you want to restore the following center?</p>
              <p><strong>Center Name:</strong> {target.centerName}</p>
              <p><strong>Address:</strong> {target.address}</p>
              <p><strong>Contact Person:</strong> {target.contactPerson}</p>
              <p><strong>Contact Number:</strong> {target.contactNumber}</p>
            </div>
            <div className="react-modal-footer">
              <button type="button" className="secondary-btn" onClick={() => setTarget(null)}>Cancel</button>
              <button type="button" className="restore-btn" onClick={confirmRestore} disabled={restoring}>
                {restoring ? (<><i className="fa fa-spinner fa-spin" /> Restoring...</>) : (<><i className="fa fa-undo" /> Restore Center</>)}
              </button>
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

export default SuperAdminCenterArchive;
