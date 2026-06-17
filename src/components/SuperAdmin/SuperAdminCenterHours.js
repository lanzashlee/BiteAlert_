import React, { useEffect, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import { apiFetch } from '../../config/api';
import './SuperAdminCenterHours.css';
import { fullLogout } from '../../utils/auth';

// ─── Time format helpers ─────────────────────────────────────────────────────

/** Convert 24-hour "HH:MM" to 12-hour "H:MM AM/PM" for display */
function to12Hour(timeStr) {
  if (!timeStr) return '';
  const s = String(timeStr).trim();
  if (/am|pm/i.test(s)) return s.replace(/\s*(am|pm)\s*/i, (_, p) => ` ${p.toUpperCase()}`).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return s;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
}

/** Format a slot { start, end } for display */
function fmtSlot(slot) {
  if (!slot || (!slot.start && !slot.end)) return null;
  return { open: to12Hour(slot.start), close: to12Hour(slot.end) };
}

/** Build a blank day-values object (all days empty) */
function blankDayValues() {
  const v = {};
  WEEKDAYS.forEach((d) => { v[d] = { start: '', end: '' }; });
  return v;
}

// Days of the week
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ALL_DAYS  = [...WEEKDAYS];

const DAY_LABEL = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday',
};

// ────────────────────────────────────────────────────────────────────────────

/** A blank "new center" entry used inside the Add modal */
const blankEntry = () => ({
  id:      Date.now() + Math.random(),   // local key only
  name:    '',
  address: '',
  contact: '',
  ...blankDayValues(),
});

// ────────────────────────────────────────────────────────────────────────────

const SuperAdminCenterHours = () => {
  const [centers,          setCenters]          = useState([]);
  const [hoursMap,         setHoursMap]         = useState({});
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  // ── Edit modal state ───────────────────────────────────────────────────────
  const [editTarget,    setEditTarget]    = useState(null);
  const [editValues,    setEditValues]    = useState({});
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Add Center modal state ─────────────────────────────────────────────────
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [addEntries,    setAddEntries]    = useState([blankEntry()]);
  const [addSaving,     setAddSaving]     = useState(false);
  const [addErrors,     setAddErrors]     = useState({});   // { entryId: errorString }

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await apiFetch('/api/center-hours');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);

      const map = {};
      const uniqueCenters = [];
      
      list.forEach((h) => {
        const key = String(h.name || h.centerName || '').toLowerCase().trim();
        if (key) {
          // If this center name isn't mapped yet, add it to uniqueCenters
          if (!map[key]) {
            uniqueCenters.push(h);
          } else {
            // Update the unique array with the latest data if there are duplicates
            const index = uniqueCenters.findIndex(c => String(c.name || c.centerName || '').toLowerCase().trim() === key);
            if (index !== -1) uniqueCenters[index] = h;
          }
          map[key] = h;
        }
      });

      setCenters(uniqueCenters);
      setHoursMap(map);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getHoursDoc = (center) => {
    const key = String(center.centerName || center.name || '').toLowerCase().trim();
    return hoursMap[key] || null;
  };

  // ── Edit modal ─────────────────────────────────────────────────────────────

  const beginEdit = (center) => {
    const doc   = getHoursDoc(center);
    const hours = doc?.hours || {};

    const dayValues = {};
    ALL_DAYS.forEach((day) => {
      // Fall back to hours.weekday if hours[day] is not defined
      const slot = hours[day] || (WEEKDAYS.includes(day) ? hours.weekday : null) || {};
      dayValues[day] = { start: slot.start || '', end: slot.end || '' };
    });

    setEditTarget(center);
    setEditValues({ ...dayValues, contact: doc?.contactNumber || center.contactNumber || '' });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditTarget(null);
    setEditValues({});
    setShowEditModal(false);
  };

  const updateDay = (day, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [field]: value },
    }));
  };

  const clearDay = (day) => {
    setEditValues((prev) => ({ ...prev, [day]: { start: '', end: '' } }));
  };

  const saveEdit = async () => {
    if (!editTarget) return;

    for (const day of ALL_DAYS) {
      const s = (editValues[day]?.start || '').trim();
      const e = (editValues[day]?.end   || '').trim();
      if ((s && !e) || (!s && e)) {
        alert(`Please provide both start and end for ${DAY_LABEL[day]}, or leave both blank.`);
        return;
      }
    }

    const cleanedHours = {};
    ALL_DAYS.forEach((day) => {
      const s = (editValues[day]?.start || '').trim();
      const e = (editValues[day]?.end   || '').trim();
      if (s && e) cleanedHours[day] = { start: s, end: e };
    });

    if (Object.keys(cleanedHours).length === 0) {
      alert('Please provide hours for at least one day.');
      return;
    }

    const centerName    = editTarget.centerName || editTarget.name || '';
    const contactNumber = (editValues.contact || '').trim();

    setSaving(true);
    try {
      const res = await apiFetch('/api/center_hours', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: centerName, centerName, hours: cleanedHours, contactNumber }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let msg = 'Failed to save center hours';
        try { msg = JSON.parse(txt).message || msg; } catch (_) { msg = txt || msg; }
        alert(msg);
        return;
      }

      const json     = await res.json();
      const savedDoc = json.data || json.center || {};
      const key      = centerName.toLowerCase().trim();

      setHoursMap((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...savedDoc, hours: cleanedHours, contactNumber },
      }));

      cancelEdit();
    } catch (err) {
      console.error('Save error:', err);
      alert(err.message || 'Failed to save center hours');
    } finally {
      setSaving(false);
    }
  };

  // ── Add Center modal ───────────────────────────────────────────────────────

  const openAddModal = () => {
    setAddEntries([blankEntry()]);
    setAddErrors({});
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddEntries([blankEntry()]);
    setAddErrors({});
  };

  /** Add another blank row */
  const addAnotherEntry = () => {
    setAddEntries((prev) => [...prev, blankEntry()]);
  };

  /** Remove a row by its local id */
  const removeEntry = (id) => {
    setAddEntries((prev) => prev.filter((e) => e.id !== id));
  };

  /** Update a text field (name / address / contact) on one entry */
  const updateEntryField = (id, field, value) => {
    setAddEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  /** Update a day-time field on one entry */
  const updateEntryDay = (id, day, field, value) => {
    setAddEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, [day]: { ...(e[day] || {}), [field]: value } }
          : e
      )
    );
  };

  /** Clear a single day on one entry */
  const clearEntryDay = (id, day) => {
    setAddEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, [day]: { start: '', end: '' } } : e
      )
    );
  };

  /** Save all new entries */
  const saveAllEntries = async () => {
    // Validate
    const errors = {};
    for (const entry of addEntries) {
      if (!entry.name.trim()) {
        errors[entry.id] = 'Center name is required.';
        continue;
      }
      for (const day of ALL_DAYS) {
        const s = (entry[day]?.start || '').trim();
        const en = (entry[day]?.end   || '').trim();
        if ((s && !en) || (!s && en)) {
          errors[entry.id] = `${DAY_LABEL[day]}: provide both start & end, or leave both blank.`;
          break;
        }
      }
      // Must have at least one day
      const hasSomeHours = ALL_DAYS.some((day) => {
        const s = (entry[day]?.start || '').trim();
        const en = (entry[day]?.end   || '').trim();
        return s && en;
      });
      if (!hasSomeHours && !errors[entry.id]) {
        errors[entry.id] = 'Provide hours for at least one weekday.';
      }
    }

    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAddSaving(true);
    const results = [];
    for (const entry of addEntries) {
      const cleanedHours = {};
      ALL_DAYS.forEach((day) => {
        const s  = (entry[day]?.start || '').trim();
        const en = (entry[day]?.end   || '').trim();
        if (s && en) cleanedHours[day] = { start: s, end: en };
      });

      try {
        const res = await apiFetch('/api/center_hours', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:          entry.name.trim(),
            centerName:    entry.name.trim(),
            address:       entry.address.trim(),
            hours:         cleanedHours,
            contactNumber: entry.contact.trim(),
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          let msg = `Failed to save "${entry.name}"`;
          try { msg = JSON.parse(txt).message || msg; } catch (_) { msg = txt || msg; }
          results.push({ success: false, id: entry.id, name: entry.name, msg });
        } else {
          const json     = await res.json();
          const savedDoc = json.data || json.center || {};
          results.push({ success: true, id: entry.id, name: entry.name, doc: savedDoc, hours: cleanedHours, contact: entry.contact.trim() });
        }
      } catch (err) {
        results.push({ success: false, id: entry.id, name: entry.name, msg: err.message });
      }
    }

    // Update local state with successes
    const failed  = {};
    const newDocs = [];
    results.forEach((r) => {
      if (r.success) {
        const key = r.name.toLowerCase().trim();
        newDocs.push({ key, doc: { ...r.doc, name: r.name, hours: r.hours, contactNumber: r.contact } });
      } else {
        failed[r.id] = r.msg;
      }
    });

    if (newDocs.length > 0) {
      setHoursMap((prev) => {
        const next = { ...prev };
        newDocs.forEach(({ key, doc }) => { next[key] = doc; });
        return next;
      });
      await fetchData(); // refresh full list
    }

    if (Object.keys(failed).length > 0) {
      setAddErrors(failed);
      setAddEntries((prev) => prev.filter((e) => failed[e.id])); // keep failed rows
    } else {
      closeAddModal();
    }

    setAddSaving(false);
  };

  // ── Sign-out ───────────────────────────────────────────────────────────────

  const handleSignOut  = () => setShowSignoutModal(true);

  const confirmSignOut = async () => {
    try {
      setShowSignoutModal(false);
      await fullLogout(apiFetch);
    } catch (error) {
      console.error('Signout error:', error);
      setShowSignoutModal(false);
      await fullLogout();
    }
  };

  // ── Day cell renderer ──────────────────────────────────────────────────────

  const renderDayCell = (hours, dayKey) => {
    // Fall back to hours.weekday if hours[dayKey] is not defined (for legacy support)
    const slot   = hours[dayKey] || (WEEKDAYS.includes(dayKey) ? hours.weekday : null);
    const parsed = slot ? fmtSlot(slot) : null;
    if (!parsed) return <span className="ch-day-closed">Closed</span>;
    return (
      <span className="ch-day-open">
        {parsed.open}
        <span className="ch-time-range">– {parsed.close}</span>
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-container ch-page">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="content-header">
          <h2>
            <i className="fa-solid fa-clock" style={{ marginRight: 8, color: '#2563eb' }} />
            Center Service Hours
          </h2>
          <div className="ch-header-actions">
            <button
              className="ch-btn ch-btn-secondary"
              onClick={fetchData}
              disabled={loading}
              aria-label="Refresh center hours"
            >
              <i className={`fa-solid fa-rotate-right ${loading ? 'fa-spin' : ''}`} />
              Refresh
            </button>
            <button
              className="ch-btn ch-btn-primary"
              onClick={openAddModal}
              aria-label="Add new center"
            >
              <i className="fa-solid fa-plus" />
              Add Center
            </button>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        {loading ? (
          <UnifiedSpinner text="Loading center hours…" />
        ) : (
          <div className="ch-table-wrapper">
            <div className="ch-table-scroll">
              <table className="ch-table" aria-label="Center service hours">
                <thead>
                  <tr>
                    <th>Center</th>
                    {WEEKDAYS.map((day) => (
                      <th key={day} className="ch-day-col">{DAY_LABEL[day]}</th>
                    ))}
                    <th className="ch-contact-col">Contact</th>
                    <th className="ch-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {centers.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="ch-empty">
                          <i className="fa-solid fa-building-circle-exclamation" />
                          No centers found.{' '}
                          <button className="ch-link-btn" onClick={openAddModal}>Add one now.</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {centers.map((c) => {
                    const doc   = getHoursDoc(c);
                    const hours = doc?.hours || {};
                    return (
                      <tr key={c._id}>
                        <td><strong>{c.centerName || c.name}</strong></td>
                        {WEEKDAYS.map((day) => (
                          <td key={day} className="ch-day-col">
                            {renderDayCell(hours, day)}
                          </td>
                        ))}
                        <td className="ch-contact-col">
                          {doc?.contactNumber || c.contactNumber || <span style={{ color: '#9ca3af' }}>—</span>}
                        </td>
                        <td className="ch-actions-col">
                          <button
                            className="ch-btn ch-btn-primary"
                            onClick={() => beginEdit(c)}
                            aria-label={`Edit service hours for ${c.centerName || c.name}`}
                          >
                            <i className="fa-solid fa-pen-to-square" /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          Add Center(s) Modal
         ══════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div
          className="ch-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) closeAddModal(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ch-add-modal-title"
        >
          <div className="ch-modal ch-modal-wide">

            {/* Header */}
            <div className="ch-modal-header">
              <h4 className="ch-modal-title" id="ch-add-modal-title">
                <i className="fa-solid fa-building-circle-arrow-right" />
                Add New Center{addEntries.length > 1 ? 's' : ''}
                <span className="ch-modal-count">{addEntries.length} center{addEntries.length !== 1 ? 's' : ''}</span>
              </h4>
              <button className="ch-modal-close" onClick={closeAddModal} aria-label="Close modal">✕</button>
            </div>

            {/* Body — one card per center entry */}
            <div className="ch-modal-body">
              <p className="ch-modal-hint">
                Fill in the details for each center. Click <strong>+ Add Another Center</strong> to add more at once.
              </p>

              <div className="ch-add-entries">
                {addEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`ch-entry-card ${addErrors[entry.id] ? 'ch-entry-card--error' : ''}`}
                  >
                    {/* Card header */}
                    <div className="ch-entry-header">
                      <span className="ch-entry-badge">{idx + 1}</span>
                      <span className="ch-entry-title">
                        {entry.name.trim() || `New Center ${idx + 1}`}
                      </span>
                      {addEntries.length > 1 && (
                        <button
                          className="ch-entry-remove"
                          onClick={() => removeEntry(entry.id)}
                          aria-label={`Remove entry ${idx + 1}`}
                          title="Remove this center"
                        >
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      )}
                    </div>

                    {/* Error message */}
                    {addErrors[entry.id] && (
                      <div className="ch-entry-error">
                        <i className="fa-solid fa-circle-exclamation" /> {addErrors[entry.id]}
                      </div>
                    )}

                    {/* Basic info */}
                    <div className="ch-entry-info-row">
                      <div className="ch-field">
                        <label className="ch-field-label">
                          Center Name <span className="ch-required">*</span>
                        </label>
                        <input
                          type="text"
                          className="ch-contact-input"
                          value={entry.name}
                          onChange={(e) => updateEntryField(entry.id, 'name', e.target.value)}
                          placeholder="e.g. Salapan"
                          aria-label="Center name"
                        />
                      </div>
                      <div className="ch-field">
                        <label className="ch-field-label">Address</label>
                        <input
                          type="text"
                          className="ch-contact-input"
                          value={entry.address}
                          onChange={(e) => updateEntryField(entry.id, 'address', e.target.value)}
                          placeholder="e.g. Salapan, San Juan City"
                          aria-label="Center address"
                        />
                      </div>
                      <div className="ch-field ch-field--sm">
                        <label className="ch-field-label">Contact Number</label>
                        <input
                          type="text"
                          className="ch-contact-input"
                          value={entry.contact}
                          onChange={(e) => updateEntryField(entry.id, 'contact', e.target.value)}
                          placeholder="e.g. 09XXXXXXXXX"
                          aria-label="Contact number"
                        />
                      </div>
                    </div>

                    {/* Weekday hours */}
                    <div className="ch-entry-days-label">Weekday Hours</div>
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="ch-day-row">
                        <span className="ch-day-label">{DAY_LABEL[day]}</span>
                        <input
                          type="time"
                          className="ch-time-input"
                          value={entry[day]?.start || ''}
                          onChange={(e) => updateEntryDay(entry.id, day, 'start', e.target.value)}
                          aria-label={`${DAY_LABEL[day]} opening time`}
                        />
                        <span className="ch-day-sep">–</span>
                        <input
                          type="time"
                          className="ch-time-input"
                          value={entry[day]?.end || ''}
                          onChange={(e) => updateEntryDay(entry.id, day, 'end', e.target.value)}
                          aria-label={`${DAY_LABEL[day]} closing time`}
                        />
                        <button
                          className="ch-clear-btn"
                          onClick={() => clearEntryDay(entry.id, day)}
                          title="Clear (mark as Closed)"
                        >
                          Clear
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Add another row */}
              <button className="ch-add-more-btn" onClick={addAnotherEntry}>
                <i className="fa-solid fa-plus" /> Add Another Center
              </button>
            </div>

            {/* Footer */}
            <div className="ch-modal-footer">
              <button className="ch-btn ch-btn-secondary" onClick={closeAddModal}>
                Cancel
              </button>
              <button
                className="ch-btn ch-btn-primary"
                onClick={saveAllEntries}
                disabled={addSaving}
                aria-label="Save all centers"
              >
                {addSaving
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                  : <><i className="fa-solid fa-floppy-disk" /> Save {addEntries.length > 1 ? `All ${addEntries.length} Centers` : 'Center'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Edit Hours Modal
         ══════════════════════════════════════════════════════════════════ */}
      {showEditModal && editTarget && (
        <div
          className="ch-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ch-edit-modal-title"
        >
          <div className="ch-modal">

            <div className="ch-modal-header">
              <h4 className="ch-modal-title" id="ch-edit-modal-title">
                <i className="fa-solid fa-pen-to-square" />
                Edit Hours — {editTarget.centerName || editTarget.name}
              </h4>
              <button className="ch-modal-close" onClick={cancelEdit} aria-label="Close modal">✕</button>
            </div>

            <div className="ch-modal-body">
              <p className="ch-modal-hint">
                Set opening and closing times. Click <strong>Clear</strong> or leave both fields empty to mark a day as <em>Closed</em>.
              </p>

              {WEEKDAYS.map((day) => (
                <div key={day} className="ch-day-row">
                  <span className="ch-day-label">{DAY_LABEL[day]}</span>
                  <input
                    type="time"
                    className="ch-time-input"
                    value={editValues[day]?.start || ''}
                    onChange={(e) => updateDay(day, 'start', e.target.value)}
                    aria-label={`${DAY_LABEL[day]} opening time`}
                  />
                  <span className="ch-day-sep">–</span>
                  <input
                    type="time"
                    className="ch-time-input"
                    value={editValues[day]?.end || ''}
                    onChange={(e) => updateDay(day, 'end', e.target.value)}
                    aria-label={`${DAY_LABEL[day]} closing time`}
                  />
                  <button
                    className="ch-clear-btn"
                    onClick={() => clearDay(day)}
                    title="Mark as Closed"
                  >
                    Clear
                  </button>
                </div>
              ))}

              <label className="ch-contact-label" htmlFor="ch-edit-contact">
                <i className="fa-solid fa-phone" style={{ marginRight: 6, color: '#6b7280' }} />
                Contact Number
              </label>
              <input
                id="ch-edit-contact"
                type="text"
                className="ch-contact-input"
                value={editValues.contact || ''}
                onChange={(e) => setEditValues((p) => ({ ...p, contact: e.target.value }))}
                placeholder="e.g. 09XXXXXXXXX"
              />
            </div>

            <div className="ch-modal-footer">
              <button className="ch-btn ch-btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button
                className="ch-btn ch-btn-primary"
                onClick={saveEdit}
                disabled={saving}
                aria-label="Save service hours"
              >
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                  : <><i className="fa-solid fa-floppy-disk" /> Save Changes</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Modal ──────────────────────────────────────────────────── */}
      {showSignoutModal && (
        <div className="signout-modal active">
          <div className="signout-modal-overlay" onClick={() => setShowSignoutModal(false)} />
          <div className="signout-modal-content">
            <div className="signout-modal-header">
              <div className="signout-icon-wrapper">
                <i className="fa-solid fa-right-from-bracket" />
              </div>
              <h3>Sign Out</h3>
            </div>
            <div className="signout-modal-body">
              <p>Are you sure you want to sign out?</p>
              <span className="signout-subtitle">You will need to log in again to access your account.</span>
            </div>
            <div className="signout-modal-footer">
              <button className="cancel-btn" onClick={() => setShowSignoutModal(false)} aria-label="Cancel sign out">Cancel</button>
              <button className="confirm-btn" onClick={confirmSignOut} aria-label="Confirm sign out">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCenterHours;
