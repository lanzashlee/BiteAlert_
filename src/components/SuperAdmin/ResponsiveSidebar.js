import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const ResponsiveSidebar = ({ onSignOut }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [role, setRole] = useState(null);
  const location = useLocation();

  // Handle sidebar toggle (mobile)
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle sidebar collapse/expand (desktop)
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.hamburger-menu')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Get role from storage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData'));
      if (stored && stored.role) setRole(String(stored.role).toLowerCase());
    } catch {}
  }, []);

  const isActive = (path) => location.pathname === path;

  const adminItems = [
    { path: '/admin', icon: 'fa-tachometer-alt', label: 'Dashboard', tip: 'Dashboard' },
    { path: '/admin/prescriptive-analytics', icon: 'fa-chart-line', label: 'Prescriptive Analytics', tip: 'Prescriptive Analytics' },
    { path: '/admin/generate-report', icon: 'fa-file-alt', label: 'Report Generation', tip: 'Generate Report' },
    { path: '/admin/staff-management', icon: 'fa-users', label: 'Staff Account Management', tip: 'Staff Account Management' },
    { path: '/admin/patients', icon: 'fa-user-injured', label: 'Patient Management', tip: 'Patient Management' },
    { path: '/admin/vaccination-schedule', icon: 'fa-syringe', label: 'Vaccine Schedule Tracker', tip: 'Vaccine Schedule' },
    { path: '/admin/stock', icon: 'fa-boxes-stacked', label: 'Stock & Inventory Management', tip: 'Stock & Inventory' },
    { path: '/admin/audit-trail', icon: 'fa-file-lines', label: 'Audit Trail', tip: 'Audit Trail' },
    { path: '/admin/patient-management', icon: 'fa-user-nurse', label: 'Patient Account Management', tip: 'Patient Account Management' },
  ];

  const superAdminItems = [
    { path: '/superadmin', icon: 'fa-tachometer-alt', label: 'Dashboard', tip: 'Dashboard' },
    { path: '/superadmin/audit-trail', icon: 'fa-file-lines', label: 'Audit Trail', tip: 'Audit Trail' },
    { path: '/superadmin/account-management', icon: 'fa-user-gear', label: 'Admin Account Management', tip: 'Admin Account Management' },
    { path: '/superadmin/center', icon: 'fa-building', label: 'Center Data Management', tip: 'Center Data Management' },
    { path: '/superadmin/center-hours', icon: 'fa-clock', label: 'Center Service Hours Management', tip: 'Center Service Hours' },
    { path: '/superadmin/generate', icon: 'fa-file-alt', label: 'Generate Report', tip: 'Generate Report' },
    { path: '/superadmin/patients', icon: 'fa-user-injured', label: 'Patient Management', tip: 'Patient Management' },
    { path: '/superadmin/prescriptive-analytics', icon: 'fa-chart-line', label: 'Prescriptive Analytics', tip: 'Prescriptive Analytics' },
    { path: '/superadmin/staff-management', icon: 'fa-users', label: 'Staff Account Management', tip: 'Staff Account Management' },
    { path: '/superadmin/patient-management', icon: 'fa-user-nurse', label: 'Patient Account Management', tip: 'Patient Account Management' },
    { path: '/superadmin/vaccination-schedule', icon: 'fa-syringe', label: 'Vaccination Schedule', tip: 'Vaccination Schedule' },
    { path: '/superadmin/stock', icon: 'fa-boxes-stacked', label: 'Stock & Inventory', tip: 'Stock & Inventory' },
  ];

  return (
    <>
      {/* Hamburger Menu Button */}
      <button 
        className={`hamburger-menu ${sidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        title="Toggle navigation menu"
      >
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>
      
      <aside className={`sidebar ${sidebarOpen ? 'active' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">
            <i className="fa-solid fa-paw"></i>
            <span className="logo-text">Bite <span className="logo-accent">Alert</span></span>
          </h1>
          <button 
            className="collapse-toggle"
            onClick={toggleSidebarCollapse}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>
        <ul className="menu">
          {(role === 'admin' ? adminItems : superAdminItems).map((item) => (
            <li key={item.path} className={isActive(item.path) ? 'active' : ''}>
              <Link to={item.path} data-tooltip={item.tip}><i className={`fa-solid ${item.icon}`} /><span>{item.label}</span></Link>
          </li>
          ))}
        </ul>
        <button className="sign-out" onClick={onSignOut} aria-label="Sign out of account" title="Sign out">
          <i className="fa-solid fa-right-from-bracket" />
          <span>Sign out</span>
        </button>
      </aside>
    </>
  );
};

export default ResponsiveSidebar;
