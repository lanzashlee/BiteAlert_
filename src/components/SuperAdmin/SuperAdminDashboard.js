import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import { apiFetch, apiConfig, getApiUrl } from '../../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import ResponsiveSidebar from './ResponsiveSidebar';
import SmallLoadingSpinner from './SmallDogLoading';
import './SuperAdminDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const SuperAdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange] = useState('month');
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastEventTime, setLastEventTime] = useState(null);
  const navigate = useNavigate();

  // Get current user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setCurrentUser(userData);
    }
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);



  // Handle notifications
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Try real-time notifications via SSE, fallback to polling
  useEffect(() => {
    let eventSource;
    let pollInterval;

    const normalizeEvent = (evt) => {
      // Ensure a consistent shape
      return {
        id: evt.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message: evt.message || evt.title || 'New activity',
        time: evt.time || evt.timestamp || new Date().toISOString(),
        read: false,
        type: evt.type || 'info'
      };
    };

    const appendEvents = (events) => {
      if (!events || events.length === 0) return;
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const incoming = events
          .map(normalizeEvent)
          .filter(e => !existingIds.has(e.id));
        const merged = [...incoming, ...prev].slice(0, 50); // keep last 50
        return merged;
      });
      const newest = events[0];
      if (newest && (newest.time || newest.timestamp)) {
        const ts = newest.time || newest.timestamp;
        setLastEventTime(ts);
      }
    };

    const startPolling = () => {
      const fetchLatest = async () => {
        try {
          const qs = lastEventTime ? `?since=${encodeURIComponent(lastEventTime)}` : '';
          const res = await apiFetch(`${apiConfig.endpoints.notifications}${qs}`);
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.notifications || []);
            appendEvents(list);
          }
        } catch (e) {
          // silent fail
        }
      };
      // initial
      fetchLatest();
      pollInterval = setInterval(fetchLatest, 10000);
    };

    // Attempt SSE first
    try {
      if (window && 'EventSource' in window) {
        eventSource = new EventSource(getApiUrl(`${apiConfig.endpoints.notifications}/stream`));
        eventSource.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            const events = Array.isArray(payload) ? payload : [payload];
            appendEvents(events);
          } catch {
            // ignore malformed message
          }
        };
        eventSource.onerror = () => {
          // fallback to polling on error
          eventSource && eventSource.close();
          startPolling();
        };
      } else {
        startPolling();
      }
    } catch {
      startPolling();
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEventTime]);

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
  
  // Chart data states (React-ChartJS-2)
  const [patientsChartData, setPatientsChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Patients',
      data: [],
      backgroundColor: 'rgba(128, 0, 0, 0.1)',
      borderColor: '#800000',
      borderWidth: 2,
      pointBackgroundColor: '#800000',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#800000',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true
    }]
  });

  const [casesChartData, setCasesChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Cases',
      data: [],
      backgroundColor: 'rgba(128, 0, 0, 0.7)',
      borderColor: 'rgba(128, 0, 0, 1)',
      borderWidth: 2,
      borderRadius: 8,
      maxBarThickness: 50
    }]
  });

  const [vaccinesChartData, setVaccinesChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Available Stocks',
      data: [],
      borderColor: '#800000',
      backgroundColor: 'rgba(128, 0, 0, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#800000',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#800000',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true
    }]
  });

  const [severityChartData, setSeverityChartData] = useState({
    labels: ['Mild', 'Moderate', 'Severe'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: [
        'rgba(46, 213, 115, 0.8)',
        'rgba(255, 171, 67, 0.8)',
        'rgba(255, 71, 87, 0.8)'
      ],
      borderColor: [
        'rgba(46, 213, 115, 1)',
        'rgba(255, 171, 67, 1)',
        'rgba(255, 71, 87, 1)'
      ],
      borderWidth: 2,
      borderRadius: 5,
      spacing: 5,
      hoverOffset: 15
    }]
  });

  // Common options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 2000, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } }
      }
    }
  };

  const lineChartOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { padding: 10, callback: (v) => v + ' patients' }
      },
      x: { grid: { display: false }, ticks: { padding: 10 } }
    },
    plugins: { ...commonOptions.plugins, title: { display: true, text: 'Patient Growth Over Time', padding: { top: 10, bottom: 30 }, font: { size: 16, weight: '500' } } }
  };

  const barChartOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { padding: 10, callback: (v) => v + ' cases' }
      },
      x: { grid: { display: false }, ticks: { padding: 10 } }
    },
    plugins: { ...commonOptions.plugins, title: { display: true, text: 'Cases per Center', padding: { top: 10, bottom: 30 }, font: { size: 16, weight: '500' } } }
  };

  const vaccinesChartOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { padding: 10, callback: (v) => v + ' units' }
      },
      x: { grid: { display: false }, ticks: { padding: 10 } }
    },
    plugins: { ...commonOptions.plugins, title: { display: true, text: 'Vaccine Stock Trends', padding: { top: 10, bottom: 30 }, font: { size: 16, weight: '500' } } }
  };

  const severityChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: { display: true, text: 'Case Severity Distribution', padding: { top: 10, bottom: 30 }, font: { size: 16, weight: '500' } },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${value} cases (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#333',
        font: { weight: 'bold', size: 16 },
        formatter: (value) => (value > 0 ? value : '')
      }
    }
  };

  // Fetch summary + charts
  const updateDashboardSummary = async () => {
    try {
      const userCenter = getUserCenter();
      
      // Get staff count for the specific center
      let staffCount = 0;
      try {
        let staffUrl = `${apiConfig.endpoints.staffs}`;
        if (userCenter && userCenter !== 'all') {
          staffUrl += `?center=${encodeURIComponent(userCenter)}`;
        }
        const response = await apiFetch(staffUrl);
        const result = await response.json();
        if (result.success && Array.isArray(result.staffs)) {
          staffCount = result.staffs.length;
        }
      } catch {}
      let vaccineUrl = `${apiConfig.endpoints.vaccinestocks}`;
      if (userCenter && userCenter !== 'all') {
        vaccineUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const vaccineResponse = await apiFetch(vaccineUrl);
      const vaccineResult = await vaccineResponse.json();
      let totalStock = 0;
      if (vaccineResult.success && Array.isArray(vaccineResult.data)) {
        // API now returns flat structure, so we can directly sum the quantities
        totalStock = vaccineResult.data.reduce((sum, stock) => {
          let quantity = stock.quantity || 0;
          if (typeof quantity === 'object' && quantity.$numberInt !== undefined) {
            quantity = parseInt(quantity.$numberInt);
          } else if (typeof quantity === 'object' && quantity.$numberDouble !== undefined) {
            quantity = parseFloat(quantity.$numberDouble);
          } else {
            quantity = Number(quantity);
          }
          return sum + (isNaN(quantity) ? 0 : quantity);
        }, 0);
      }

      let summaryUrl = `${apiConfig.endpoints.dashboardSummary}?filter=${timeRange}`;
      if (userCenter && userCenter !== 'all') {
        summaryUrl += `&center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(summaryUrl);
      const result = await response.json();
      if (result.success && result.data) {
        const { totalPatients, adminCount } = result.data;

        // Health centers: fetch directly from Center Data Management
        let centersCount = 0;
        try {
          const centersRes = await apiFetch(apiConfig.endpoints.centers);
          const centersJson = await centersRes.json();
          const centers = Array.isArray(centersJson)
            ? centersJson
            : (centersJson?.data || centersJson?.centers || []);
          const centerNames = Array.from(new Set((centers || [])
            .filter(c => !c.isArchived)
            .map(c => String(c.centerName || c.name || '').trim())
            .filter(Boolean)));
          centersCount = centerNames.length;
        } catch (e) {
          centersCount = 0;
        }

        // Active cases: count from Vaccine Schedule (bite cases with assigned schedule)
        let activeCasesCount = 0;
        try {
          let vaccinationUrl = apiConfig.endpoints.bitecases;
          if (userCenter && userCenter !== 'all') {
            vaccinationUrl += `?center=${encodeURIComponent(userCenter)}`;
          }
          const vaccinationRes = await apiFetch(vaccinationUrl);
          const vaccinationData = await vaccinationRes.json();
          let biteCases = [];
          if (Array.isArray(vaccinationData)) biteCases = vaccinationData;
          else if (vaccinationData?.success && Array.isArray(vaccinationData.data)) biteCases = vaccinationData.data;
          else if (Array.isArray(vaccinationData?.data)) biteCases = vaccinationData.data;

          const hasAssignedSchedule = (bc) => {
            const perDay = [bc.d0Date, bc.d3Date, bc.d7Date, bc.d14Date, bc.d28Date].some(Boolean);
            const arraySched = Array.isArray(bc.scheduleDates) && bc.scheduleDates.some(Boolean);
            return perDay || arraySched;
          };

          activeCasesCount = (biteCases || []).filter(hasAssignedSchedule).length;
        } catch (e) {
          activeCasesCount = 0;
        }

        // For center-based admins, only their center counts as 1
        if (userCenter && userCenter !== 'all') {
          centersCount = 1;
        }

        setSummary({
          totalPatients,
          vaccineStocks: totalStock,
          healthCenters: centersCount,
          staffCount: staffCount,
          activeCases: activeCasesCount,
          adminCount: typeof adminCount === 'number' ? adminCount : 0
        });
      }
    } catch (error) {
      console.error('Error updating dashboard summary:', error);
      setSummary({ totalPatients: 0, vaccineStocks: 0, healthCenters: 0, staffCount: 0, activeCases: 0, adminCount: 0 });
      } finally {
        setLoading(false);
      }
    };

  const updatePatientGrowth = async () => {
    try {
      const userCenter = getUserCenter();
      let apiUrl = `${apiConfig.endpoints.patientGrowth}`;
      if (userCenter && userCenter !== 'all') {
        apiUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
      if (result.success) {
        setPatientsChartData(prev => ({
          ...prev,
          labels: result.labels,
          datasets: [{ ...prev.datasets[0], data: result.data }]
        }));
      }
    } catch (e) { console.error(e); }
  };

  const updateCasesPerBarangay = async () => {
    try {
      const userCenter = getUserCenter();
      let apiUrl = `${apiConfig.endpoints.casesPerBarangay}`;
      if (userCenter && userCenter !== 'all') {
        apiUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
      if (result.success) {
        const barangayNames = result.data.map(item => item.barangay);
        const casesData = result.data.map(item => item.count);
        setCasesChartData(prev => ({ ...prev, labels: barangayNames, datasets: [{ ...prev.datasets[0], data: casesData }] }));
      }
    } catch (e) { console.error(e); }
  };

  const updateVaccineStockTrends = async () => {
    try {
      const userCenter = getUserCenter();
      let apiUrl = `${apiConfig.endpoints.vaccineStockTrends}`;
      if (userCenter && userCenter !== 'all') {
        apiUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
      if (result.success) {
        setVaccinesChartData(prev => ({ ...prev, labels: result.labels, datasets: [{ ...prev.datasets[0], data: result.data }] }));
      }
    } catch (e) { console.error(e); }
  };

  const updateSeverityChart = async () => {
    try {
      const userCenter = getUserCenter();
      let apiUrl = `${apiConfig.endpoints.severityDistribution}`;
      if (userCenter && userCenter !== 'all') {
        apiUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
      if (result.success) {
        const { Mild, Moderate, Severe } = result.data;
        const total = Mild + Moderate + Severe;
        if (total === 0) {
          setSeverityChartData(prev => ({ labels: ['No Data', '', ''], datasets: [{ ...prev.datasets[0], data: [1, 0, 0] }] }));
        } else {
          setSeverityChartData(prev => ({ labels: ['Mild', 'Moderate', 'Severe'], datasets: [{ ...prev.datasets[0], data: [Mild, Moderate, Severe] }] }));
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    updateDashboardSummary();
    updatePatientGrowth();
    updateCasesPerBarangay();
    updateVaccineStockTrends();
    updateSeverityChart();

    const summaryInterval = setInterval(updateDashboardSummary, 300000);
    const patientInterval = setInterval(updatePatientGrowth, 300000);
    const casesInterval = setInterval(updateCasesPerBarangay, 300000);
    const vaccineInterval = setInterval(updateVaccineStockTrends, 300000);
    const severityInterval = setInterval(updateSeverityChart, 300000);

    return () => {
      clearInterval(summaryInterval);
      clearInterval(patientInterval);
      clearInterval(casesInterval);
      clearInterval(vaccineInterval);
      clearInterval(severityInterval);
    };
  }, [timeRange]);

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        {/* Main Header */}
        <div className="main-header">
          <div className="header-left">
            <h2>{(currentUser?.role || '').toLowerCase() === 'admin' ? 'Admin Dashboard' : 'SuperAdmin Dashboard'}</h2>
          </div>
          <div className="header-right">
            {/* Search Bar (hidden for Admin) */}
            {((currentUser?.role || '').toLowerCase() !== 'admin') && (
              <div className="search-container">
                <div className="search-bar">
                  <i className="fa-solid fa-search search-icon"></i>
                  <input type="text" placeholder="Search" className="search-input" />
                </div>
              </div>
            )}
            
            {/* Notifications */}
            <div className="notification-container">
              <div className="notification-icon" onClick={handleNotificationClick}>
                <i className="fa-solid fa-bell"></i>
                <span className="notification-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              </div>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button 
                      className="mark-all-read"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <i className="fa-solid fa-bell-slash"></i>
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="notification-content">
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">{notification.time}</span>
                          </div>
                          {!notification.read && <div className="unread-indicator"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            <div className="user-profile" onClick={() => navigate('/superadmin/profile')}>
              <div className="profile-picture">
                <img src={getApiUrl(apiConfig.endpoints.profilePicture)} alt="Profile" onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }} />
                <div className="profile-placeholder">
                  <i className="fa-solid fa-user"></i>
                </div>
              </div>
              <div className="user-info">
                <span className="user-name">
                  {currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email : 'Loading...'}
                </span>
                <i className="fa-solid fa-chevron-down dropdown-icon"></i>
              </div>
            </div>
          </div>
        </div>



        {/* Summary Cards */}
        <div className="dashboard-cards">
          <div className="card" data-tooltip="Total number of registered patients in the system">
            <div className="card-icon" style={{ background: 'rgba(128, 0, 0, 0.1)' }}>
              <i className="fa-solid fa-users" style={{ color: '#800000' }} />
            </div>
            <div className="card-info">
              <div className="card-title">Total Patients</div>
              <div className="card-value" id="totalPatients">
                {loading ? (
                  <SmallLoadingSpinner />
                ) : (
                  <span className="value-text">
                    {summary?.totalPatients?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="card" data-tooltip="Current available vaccine stock across all centers">
            <div className="card-icon" style={{ background: 'rgba(46, 213, 115, 0.1)' }}>
              <i className="fa-solid fa-syringe" style={{ color: '#2ed573' }} />
            </div>
            <div className="card-info">
              <div className="card-title">Vaccine Stocks</div>
              <div className="card-value" id="vaccineStocks">
                {loading ? (
                  <SmallLoadingSpinner />
                ) : (
                  <span className="value-text">
                    {summary?.vaccineStocks?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="card" data-tooltip="Total number of health centers in the system">
            <div className="card-icon" style={{ background: 'rgba(255, 171, 67, 0.1)' }}>
              <i className="fa-solid fa-hospital" style={{ color: '#ffab43' }} />
            </div>
            <div className="card-info">
              <div className="card-title">Health Centers</div>
              <div className="card-value" id="healthCenters">
                {loading ? (
                  <SmallLoadingSpinner />
                ) : (
                  <span className="value-text">
                    {summary?.healthCenters?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="card" data-tooltip="Total number of staff accounts">
            <div className="card-icon" style={{ background: 'rgba(40, 167, 69, 0.1)' }}>
              <i className="fa-solid fa-user-nurse" style={{ color: '#28a745' }} />
            </div>
            <div className="card-info">
              <div className="card-title">Staff</div>
              <div className="card-value" id="staffCount">
                {loading ? (
                  <SmallLoadingSpinner />
                ) : (
                  <span className="value-text">
                    {summary?.staffCount?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* The following cards are visible only to superadmins */}
          {((currentUser?.role || '').toLowerCase() === 'superadmin') && (
            <>
              <div className="card" data-tooltip="Total number of administrator accounts in the system">
                <div className="card-icon" style={{ background: 'rgba(0, 123, 255, 0.1)' }}>
                  <i className="fa-solid fa-user-shield" style={{ color: '#007bff' }} />
                </div>
                <div className="card-info">
                  <div className="card-title">Administrator Accounts</div>
                  <div className="card-value" id="adminCount">
                    {loading ? (
                      <SmallLoadingSpinner />
                    ) : (
                      <span className="value-text">
                        {summary?.adminCount?.toLocaleString() || '0'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card" data-tooltip="Total number of active bite cases (pending or in progress)">
                <div className="card-icon" style={{ background: 'rgba(255, 71, 87, 0.1)' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ff4757' }} />
                </div>
                <div className="card-info">
                  <div className="card-title">Active Cases</div>
                  <div className="card-value" id="activeCases">
                    {loading ? (
                      <SmallLoadingSpinner />
                    ) : (
                      <span className="value-text">
                        {summary?.activeCases?.toLocaleString() || '0'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts using react-chartjs-2 */}
        <div className="row">
          <div className="col-md-6">
            <div className="panel panel-default">
              <div className="panel-heading">
                <h3 className="panel-title">Patient Growth</h3>
              </div>
              <div className="panel-body">
                <Line data={patientsChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="panel panel-default">
              <div className="panel-heading">
                <h3 className="panel-title">Case Distribution</h3>
              </div>
              <div className="panel-body">
                <Bar data={casesChartData} options={barChartOptions} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="panel panel-default">
              <div className="panel-heading">
                <h3 className="panel-title">Vaccine Stock Levels</h3>
              </div>
              <div className="panel-body">
                <Line data={vaccinesChartData} options={vaccinesChartOptions} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="panel panel-default">
              <div className="panel-heading">
                <h3 className="panel-title">Case Severity</h3>
              </div>
              <div className="panel-body">
                <Pie data={severityChartData} options={severityChartOptions} />
              </div>
            </div>
          </div>
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

export default SuperAdminDashboard;

 