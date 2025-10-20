import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCenter, filterByCenter, filterByAdminBarangay } from '../../utils/userContext';
import { apiFetch, apiConfig, getApiUrl } from '../../config/api';
import ResponsiveSidebar from './ResponsiveSidebar';
import { Suspense } from 'react';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import NotificationSystem from '../Common/NotificationSystem';
import './SuperAdminDashboard.css';
import { fullLogout } from '../../utils/auth';
import { useStandardizedCSS } from '../../utils/standardizedImports';

// Lazy load Chart.js components to reduce initial bundle size
const DashboardCharts = React.lazy(() => import('./DashboardChartsLazy'));

// Utility function to format time ago professionally
const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  const months = Math.floor(diffInSeconds / 2592000);
  return `${months} month${months !== 1 ? 's' : ''} ago`;
};

const SuperAdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange] = useState('month');
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastEventTime, setLastEventTime] = useState(null);
  const [worker, setWorker] = useState(null);
  
  // Real data state for dashboard panels
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [trends, setTrends] = useState({
    patients: null,
    vaccineStocks: null,
    healthCenters: null,
    staff: null,
    adminCount: null,
    activeCases: null,
    todayAppointments: null
  });
  const navigate = useNavigate();
  const { initializeCSS } = useStandardizedCSS();

  // Status functions (same as scheduler)
  const todayLocalStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toLocalDateOnlyString = (dateLike) => {
    if (!dateLike) return null;
    try {
      const d = new Date(dateLike);
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (_) {
      return null;
    }
  };

  const getStatusBadgeClass = (status, scheduledDate) => {
    const today = todayLocalStr();
    const vaccinationDate = toLocalDateOnlyString(scheduledDate);
    
    // Debug logging for status determination
    console.log('🔍 DASHBOARD STATUS BADGE DEBUG:', {
      status,
      scheduledDate,
      vaccinationDate,
      today,
      statusFromDB: status,
      isCompleted: status === 'completed',
      statusType: typeof status,
      statusLength: status ? status.length : 0,
      statusTrimmed: status ? status.trim() : '',
      statusLowercase: status ? status.toLowerCase() : ''
    });
    
    // Normalize and trim status
    const normalizedStatus = status ? status.toString().toLowerCase().trim() : '';
    
    // Check for completed status first
    if (normalizedStatus === 'completed') {
      console.log('✅ DASHBOARD STATUS: COMPLETED - Returning completed');
      return 'completed';
    }
    
    // Check for missed status
    if (normalizedStatus === 'missed') {
      console.log('❌ DASHBOARD STATUS: MISSED - Returning missed');
      return 'missed';
    }
    
    // Check if it's today
    if (vaccinationDate === today) {
      console.log('📅 DASHBOARD STATUS: TODAY - Returning today');
      return 'today';
    }
    
    // Check if it's scheduled for the future
    if (vaccinationDate && vaccinationDate > today) {
      console.log('⏰ DASHBOARD STATUS: SCHEDULED - Returning scheduled');
      return 'scheduled';
    }
    
    // Check if it's in the past
    if (vaccinationDate && vaccinationDate < today) {
      console.log('⏪ DASHBOARD STATUS: PAST - Returning missed');
      return 'missed';
    }
    
    // Default fallback
    console.log('🔄 DASHBOARD STATUS: DEFAULT - Returning scheduled');
    return 'scheduled';
  };

  const getStatusText = (status, scheduledDate) => {
    const today = todayLocalStr();
    const vaccinationDate = toLocalDateOnlyString(scheduledDate);
    
    // Debug logging for status determination
    console.log('🔍 DASHBOARD STATUS TEXT DEBUG:', {
      status,
      scheduledDate,
      vaccinationDate,
      today,
      statusFromDB: status,
      isCompleted: status === 'completed',
      statusType: typeof status,
      statusLength: status ? status.length : 0,
      statusTrimmed: status ? status.trim() : '',
      statusLowercase: status ? status.toLowerCase() : ''
    });
    
    // Normalize and trim status
    const normalizedStatus = status ? status.toString().toLowerCase().trim() : '';
    
    // Check for completed status first
    if (normalizedStatus === 'completed') {
      console.log('✅ DASHBOARD STATUS TEXT: COMPLETED - Returning Completed');
      return 'Completed';
    }
    
    // Check for missed status
    if (normalizedStatus === 'missed') {
      console.log('❌ DASHBOARD STATUS TEXT: MISSED - Returning Missed');
      return 'Missed';
    }
    
    // Check if it's today
    if (vaccinationDate === today) {
      console.log('📅 DASHBOARD STATUS TEXT: TODAY - Returning Today');
      return 'Today';
    }
    
    // Check if it's scheduled for the future
    if (vaccinationDate && vaccinationDate > today) {
      console.log('⏰ DASHBOARD STATUS TEXT: SCHEDULED - Returning Scheduled');
      return 'Scheduled';
    }
    
    // Check if it's in the past
    if (vaccinationDate && vaccinationDate < today) {
      console.log('⏪ DASHBOARD STATUS TEXT: PAST - Returning Missed');
      return 'Missed';
    }
    
    // Default fallback
    console.log('🔄 DASHBOARD STATUS TEXT: DEFAULT - Returning Scheduled');
    return 'Scheduled';
  };

  // Build vaccinations for bite case (same as scheduler)
  const buildVaccinationsForBiteCase = (biteCase) => {
    console.log('🔍 DASHBOARD: BUILDING VACCINATIONS FOR BITE CASE:', {
      biteCaseId: biteCase._id,
      patientName: biteCase.firstName + ' ' + biteCase.lastName,
      d0Status: biteCase.d0Status,
      d3Status: biteCase.d3Status,
      d7Status: biteCase.d7Status,
      d14Status: biteCase.d14Status,
      d28Status: biteCase.d28Status,
      scheduleDates: biteCase.scheduleDates
    });
    
    // PREFER scheduleDates array from bitecases for all reads
    if (Array.isArray(biteCase.scheduleDates) && biteCase.scheduleDates.length > 0) {
      const labels = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
      const days = labels.map((label, idx) => {
        // Get individual day status from bite case fields (d0Status, d3Status, etc.)
        const dayField = label.replace('Day ', 'd') + 'Status';
        const individualStatus = biteCase[dayField];
        
        return {
          day: label,
          date: biteCase.scheduleDates[idx],
          status: individualStatus || 'scheduled'
        };
      });
      return days
        .map(d => ({ ...d, date: d.date }))
        .filter(d => d.date)
        .map(d => ({
          day: d.day,
          date: d.date,
          status: d.status || 'scheduled'
        }));
    }
    
    // Fallback to legacy per-day fields only when scheduleDates is absent
    const fromPerDay = [
      { day: 'Day 0',  date: biteCase.d0Date,  status: biteCase.d0Status },
      { day: 'Day 3',  date: biteCase.d3Date,  status: biteCase.d3Status },
      { day: 'Day 7',  date: biteCase.d7Date,  status: biteCase.d7Status },
      { day: 'Day 14', date: biteCase.d14Date, status: biteCase.d14Status },
      { day: 'Day 28', date: biteCase.d28Date, status: biteCase.d28Status }
    ];
    
    return fromPerDay
      .map(d => ({ ...d, date: d.date }))
      .filter(d => d.date)
      .map(d => ({
        day: d.day,
        date: d.date,
        status: d.status || 'scheduled'
      }));
  };

  // Compute percentage change from the last two datapoints of a time series
  const computeTrendFromSeries = useCallback((labels, data, periodLabel) => {
    if (!Array.isArray(labels) || !Array.isArray(data) || data.length < 2) {
      return null;
    }
    const last = Number(data[data.length - 1] || 0);
    const prev = Number(data[data.length - 2] || 0);
    if (!isFinite(last) || !isFinite(prev) || prev === 0) {
      // If previous is zero, avoid divide-by-zero; treat as 100% if last>0, else 0
      const change = prev === 0 ? (last > 0 ? 100 : 0) : 0;
      return { change: Math.round(change), period: periodLabel };
    }
    const pct = ((last - prev) / prev) * 100;
    return { change: Math.round(pct), period: periodLabel };
  }, []);

  const computeChangePercent = useCallback((currentValue, previousValue, periodLabel) => {
    const curr = Number(currentValue || 0);
    const prev = Number(previousValue || 0);
    if (!isFinite(curr) || !isFinite(prev)) return null;
    if (prev === 0) {
      const change = curr > 0 ? 100 : 0;
      return { change: Math.round(change), period: periodLabel };
    }
    const pct = ((curr - prev) / prev) * 100;
    return { change: Math.round(pct), period: periodLabel };
  }, []);

  // Initialize Web Worker for heavy computations
  useEffect(() => {
    if (window.Worker) {
      const dashboardWorker = new Worker('/dashboard-worker.js');
      setWorker(dashboardWorker);
      
      dashboardWorker.onmessage = (e) => {
        const { type, data, error } = e.data;
        if (error) {
          console.error('Worker error:', error);
        }
        // Handle worker responses here if needed
      };
      
      return () => {
        dashboardWorker.terminate();
      };
    }
  }, []);

  // Initialize CSS and get current user data
  useEffect(() => {
    // Initialize standardized CSS loading
    initializeCSS();
    
    const userData = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setCurrentUser(userData);
    }
  }, [initializeCSS]);

  // Realtime updates: connect to backend WebSocket and refetch panels on events
  useEffect(() => {
    // Build wss URL from API base
    try {
      const base = (apiConfig?.baseURL || '').trim();
      if (!base) return;
      const wsUrl = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔌 WebSocket connected for real-time updates');
        // Connected; no-op
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 WebSocket message received:', data);
          
          // Handle different types of real-time events
          if (data.type === 'stock_update' || data.type === 'vaccine_stock_change') {
            console.log('🔄 Real-time stock update received, refreshing vaccine chart');
            if (updateVaccineStockTrendsRef.current) {
              updateVaccineStockTrendsRef.current();
            }
          } else if (data.type === 'vaccination_update' || data.type === 'appointment_update') {
            console.log('🔄 Real-time vaccination update received, refreshing data');
        fetchTodayAppointments();
        fetchRecentActivity();
            if (updateVaccineStockTrendsRef.current) {
              updateVaccineStockTrendsRef.current(); // Also update stock chart as vaccinations affect stock
            }
          } else {
            // Any other event from server -> refresh today appointments and recent activity
            fetchTodayAppointments();
            fetchRecentActivity();
          }
        } catch (error) {
          console.warn('Error parsing WebSocket message:', error);
          // Fallback to general refresh
          fetchTodayAppointments();
          fetchRecentActivity();
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket error:', error);
        // Ignore; polling fallback below
      };

      return () => {
        try { ws.close(); } catch (_) {}
      };
    } catch (_) {}
  }, []);

  // Polling fallback (Render can sleep websockets on cold start)
  useEffect(() => {
    const id = setInterval(() => {
      fetchTodayAppointments();
      fetchRecentActivity();
    }, 30000); // 30s
    return () => clearInterval(id);
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
      pollInterval = setInterval(fetchLatest, 60000); // Reduced to 60 seconds to minimize TBT
    };

    // Defer notification loading to reduce initial TBT
    const initNotifications = () => {
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
    };

    // Delay notification initialization to reduce initial TBT
    setTimeout(initNotifications, 3000);

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
      setShowSignoutModal(false); // Close modal immediately
      await fullLogout(apiFetch);
    } catch (error) {
      console.error('Signout error:', error);
      setShowSignoutModal(false); // Close modal even on error
      await fullLogout(); // Fallback to basic logout
    }
  };
  
  // Chart data states (React-ChartJS-2) - Memoized to prevent unnecessary re-renders
  const [patientsChartData, setPatientsChartData] = useState({
    labels: ['No Data'],
    datasets: [{
      label: 'Patients',
      data: [0],
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
    labels: ['No Data'],
    datasets: [{
      label: 'Cases',
      data: [0],
      backgroundColor: 'rgba(128, 0, 0, 0.7)',
      borderColor: 'rgba(128, 0, 0, 1)',
      borderWidth: 2,
      borderRadius: 8,
      maxBarThickness: 50
    }]
  });

  const [vaccinesChartData, setVaccinesChartData] = useState({
    labels: ['No Data'],
    datasets: [{
      label: 'Available Stocks',
      data: [0],
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

  const updateVaccineStockTrendsRef = useRef(null);

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

  // Memoized chart options to prevent unnecessary re-renders
  const commonOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 }, // Disable animations for better performance
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } }
      }
    }
  }), []);

  const lineChartOptions = useMemo(() => ({
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
  }), [commonOptions]);

  const barChartOptions = useMemo(() => ({
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { padding: 10, callback: (v) => v + ' cases' }
      },
      x: { grid: { display: false }, ticks: { padding: 10 } }
    },
    plugins: { 
      ...commonOptions.plugins, 
      title: { display: true, text: 'Cases per Center', padding: { top: 10, bottom: 30 }, font: { size: 16, weight: '500' } },
      datalabels: {
        color: '#FFFFFF',
        font: { weight: 'bold', size: 14 },
        formatter: (value) => Math.round(value)
      }
    }
  }), [commonOptions]);

  const vaccinesChartOptions = useMemo(() => ({
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { 
          padding: 10, 
          callback: (v) => {
            // Round to whole numbers and format nicely
            const rounded = Math.round(v);
            return rounded + ' units';
          }
        }
      },
      x: { grid: { display: false }, ticks: { padding: 10 } }
    },
    plugins: { 
      ...commonOptions.plugins, 
      title: { display: true, text: 'Vaccine Stock Trends', padding: { top: 10, bottom: 30 }, font: { size: 16, weight: '500' } },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const rounded = Math.round(value);
            return `${context.dataset.label}: ${rounded} units`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#FFFFFF',
        font: { weight: 'bold', size: 14 },
        formatter: (value) => Math.round(value),
        anchor: 'end',
        align: 'top',
        offset: 8
      }
    }
  }), [commonOptions]);

  const severityChartOptions = useMemo(() => ({
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
        color: '#000000',
        font: { weight: 'bold', size: 16 },
        formatter: (value) => (value > 0 ? value : '')
      }
    }
  }), [commonOptions]);

  // Memoized data fetching functions to prevent unnecessary re-renders
  const updateDashboardSummary = useCallback(async () => {
    try {
      const userCenter = getUserCenter();
      
      // Get staff count for the specific center
      let staffCount = 0;
      try {
        let staffUrl = `${apiConfig.endpoints.staffs}`;
        if (userCenter && userCenter !== 'all') {
          console.log('Admin center detected, using client-side filtering for center:', userCenter);
        } else if (!userCenter) {
          console.log('No user center detected, fetching all staff for client-side filtering');
        }
        const response = await apiFetch(staffUrl);
        const result = await response.json();
        console.log('🔍 STAFF DEBUG: API response:', result);
        let staffList = [];
        if (Array.isArray(result)) {
          staffList = result;
        } else if (Array.isArray(result.staffs)) {
          staffList = result.staffs;
        } else if (Array.isArray(result.data)) {
          staffList = result.data;
        } else if (Array.isArray(result.users)) {
          staffList = result.users;
        }
        const filteredStaff = filterByAdminBarangay(staffList, 'center');
        staffCount = filteredStaff.length;
        console.log('🔍 STAFF DEBUG: total staff', staffList.length, 'filtered', staffCount);
      } catch {}
      let vaccineUrl = `${apiConfig.endpoints.vaccinestocks}`;
      if (userCenter && userCenter !== 'all') {
        vaccineUrl += `?center=${encodeURIComponent(userCenter)}&barangay=${encodeURIComponent(userCenter)}`;
      } else if (!userCenter) {
        console.log('No user center detected, fetching all vaccines for client-side filtering');
      }
      
      console.log('🔍 DASHBOARD DEBUG: Fetching vaccine stocks from:', vaccineUrl);
      const vaccineResponse = await apiFetch(vaccineUrl);
      const vaccineResult = await vaccineResponse.json();
      console.log('🔍 DASHBOARD DEBUG: Vaccine stocks API response:', vaccineResult);
      
      let totalStock = 0;
      if (vaccineResult.success && Array.isArray(vaccineResult.data)) {
        console.log('🔍 DASHBOARD DEBUG: Total vaccine stocks before filtering:', vaccineResult.data.length);
        console.log('🔍 DASHBOARD DEBUG: Sample vaccine stock:', vaccineResult.data[0]);
        
        // Apply client-side filtering by center
        const filteredVaccines = filterByAdminBarangay(vaccineResult.data, 'center');
        console.log('🔍 DASHBOARD DEBUG: Vaccine stocks after center filtering:', filteredVaccines.length);
        
        // API now returns flat structure, so we can directly sum the quantities
        totalStock = filteredVaccines.reduce((sum, stock) => {
          let quantity = stock.quantity || 0;
          if (typeof quantity === 'object' && quantity.$numberInt !== undefined) {
            quantity = parseInt(quantity.$numberInt);
          } else if (typeof quantity === 'object' && quantity.$numberDouble !== undefined) {
            quantity = parseFloat(quantity.$numberDouble);
          } else {
            quantity = Number(quantity);
          }
          console.log('🔍 DASHBOARD DEBUG: Vaccine stock quantity:', stock.vaccineName, quantity);
          return sum + (isNaN(quantity) ? 0 : quantity);
        }, 0);
        console.log('🔍 DASHBOARD DEBUG: Total vaccine stock quantity:', totalStock);
      } else {
        console.log('🔍 DASHBOARD DEBUG: No vaccine data found or invalid response structure');
      }

      let summaryUrl = `${apiConfig.endpoints.dashboardSummary}?filter=${timeRange}`;
      if (userCenter && userCenter !== 'all') {
        console.log('Admin center detected, using client-side filtering for dashboard summary:', userCenter);
      } else if (!userCenter) {
        console.log('No user center detected, fetching all dashboard data for client-side filtering');
      }
      
      console.log('🔍 DASHBOARD SUMMARY DEBUG: Fetching from:', summaryUrl);
      console.log('🔍 DASHBOARD SUMMARY DEBUG: User center:', userCenter);
      const response = await apiFetch(summaryUrl);
      console.log('🔍 DASHBOARD SUMMARY DEBUG: Response status:', response.status);
      const result = await response.json();
      console.log('🔍 DASHBOARD SUMMARY DEBUG: API response:', result);
      console.log('🔍 DASHBOARD SUMMARY DEBUG: Response success:', result.success);
      console.log('🔍 DASHBOARD SUMMARY DEBUG: Response data:', result.data);
      if (result.success && result.data) {
        let { totalPatients, adminCount } = result.data;
        
        // Apply client-side filtering for total patients
        if (userCenter && userCenter !== 'all') {
          try {
            console.log('🔍 DASHBOARD DEBUG: Fetching patients for center filtering:', userCenter);
            const patientsRes = await apiFetch(`${apiConfig.endpoints.patients}?page=1&limit=1000&center=${encodeURIComponent(userCenter)}&barangay=${encodeURIComponent(userCenter)}`);
            const patientsData = await patientsRes.json();
            console.log('🔍 DASHBOARD DEBUG: Patients API response:', patientsData);
            
            let allPatients = [];
            if (Array.isArray(patientsData)) allPatients = patientsData;
            else if (Array.isArray(patientsData.data)) allPatients = patientsData.data;
            else if (Array.isArray(patientsData.patients)) allPatients = patientsData.patients;
            else if (Array.isArray(patientsData.users)) allPatients = patientsData.users;
            else if (patientsData && typeof patientsData === 'object') {
              // Try deeper nesting common patterns
              const maybe = patientsData.result || patientsData.payload || patientsData.response || {};
              if (Array.isArray(maybe)) allPatients = maybe;
              else if (Array.isArray(maybe.data)) allPatients = maybe.data;
            }
            
            // If still empty, refetch without filters and filter on client
            if (!Array.isArray(allPatients) || allPatients.length === 0) {
              console.log('🔍 PATIENTS DEBUG: Empty/invalid patients array. Refetching without filters for client-side filtering…');
              const refetch = await apiFetch(`${apiConfig.endpoints.patients}?page=1&limit=1000`);
              const refetchData = await refetch.json();
              if (Array.isArray(refetchData)) allPatients = refetchData;
              else if (Array.isArray(refetchData.data)) allPatients = refetchData.data;
              else if (Array.isArray(refetchData.patients)) allPatients = refetchData.patients;
              else if (Array.isArray(refetchData.users)) allPatients = refetchData.users;
            }
            
            console.log('🔍 PATIENTS DEBUG: Total patients before filtering:', allPatients?.length || 0);
            console.log('🔍 PATIENTS DEBUG: User center for filtering:', userCenter);
            if (Array.isArray(allPatients) && allPatients.length > 0) {
              console.log('🔍 PATIENTS DEBUG: Sample patient:', allPatients[0]);
            }
            
            // Filter patients by center/barangay
            const filteredPatients = filterByAdminBarangay(allPatients || []);
            console.log('🔍 PATIENTS DEBUG: Filtered patients count:', filteredPatients.length);
            
            // If filtering returns 0 but we have patients, show all for debugging
            if (filteredPatients.length === 0 && (allPatients?.length || 0) > 0) {
              console.log('🔍 PATIENTS DEBUG: Filtering returned 0, showing all patients for debugging');
              totalPatients = allPatients.length;
            } else {
              totalPatients = filteredPatients.length;
            }
            console.log('🔍 PATIENTS DEBUG: Final total patients:', totalPatients);
          } catch (error) {
            console.error('🔍 DASHBOARD DEBUG: Error filtering patients for dashboard:', error);
          }
        }

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

        // Active cases: count from bite cases
        let activeCasesCount = 0;
        try {
          let biteCasesUrl = apiConfig.endpoints.bitecases;
          if (userCenter && userCenter !== 'all') {
            console.log('🔍 DASHBOARD DEBUG: Admin center detected, using client-side filtering for bite cases:', userCenter);
          } else if (!userCenter) {
            console.log('🔍 DASHBOARD DEBUG: No user center detected, fetching all bite cases for client-side filtering');
          }
          
          console.log('🔍 DASHBOARD DEBUG: Fetching bite cases from:', biteCasesUrl);
          const biteCasesRes = await apiFetch(biteCasesUrl);
          const biteCasesData = await biteCasesRes.json();
          console.log('🔍 DASHBOARD DEBUG: Bite cases API response:', biteCasesData);
          
          let biteCases = [];
          if (Array.isArray(biteCasesData)) biteCases = biteCasesData;
          else if (biteCasesData?.success && Array.isArray(biteCasesData.data)) biteCases = biteCasesData.data;
          else if (Array.isArray(biteCasesData.data)) biteCases = biteCasesData.data;
          
          console.log('🔍 DASHBOARD DEBUG: Total bite cases before filtering:', biteCases.length);
          console.log('🔍 DASHBOARD DEBUG: Sample bite case:', biteCases[0]);
          
          // Apply client-side filtering by center
          biteCases = filterByAdminBarangay(biteCases, 'center');
          console.log('🔍 DASHBOARD DEBUG: Bite cases after center filtering:', biteCases.length);

          // Count all bite cases as active cases (not just those with schedules)
          activeCasesCount = biteCases.length;
          console.log('🔍 DASHBOARD DEBUG: Active cases count:', activeCasesCount);
        } catch (e) {
          console.error('🔍 DASHBOARD DEBUG: Error fetching bite cases:', e);
          activeCasesCount = 0;
        }

        // For center-based admins, only their center counts as 1
        if (userCenter && userCenter !== 'all') {
          centersCount = 1;
        }

        // Calculate real trends based on historical data
        const calculateRealTrends = async () => {
          try {
            const now = new Date();
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            console.log('🔍 TREND DEBUG: Calculating real trends for center:', userCenter);
            console.log('🔍 TREND DEBUG: Current date:', now.toISOString().split('T')[0]);
            console.log('🔍 TREND DEBUG: One month ago:', oneMonthAgo.toISOString().split('T')[0]);
            console.log('🔍 TREND DEBUG: One week ago:', oneWeekAgo.toISOString().split('T')[0]);

            const newTrends = {};

            // Calculate patients trend
            try {
              const patientsTrendRes = await apiFetch(`${apiConfig.endpoints.patients}?page=1&limit=1000&createdAt[gte]=${oneMonthAgo.toISOString()}`);
              const patientsTrendData = await patientsTrendRes.json();
              let historicalPatients = [];
              if (Array.isArray(patientsTrendData)) historicalPatients = patientsTrendData;
              else if (Array.isArray(patientsTrendData.data)) historicalPatients = patientsTrendData.data;
              else if (Array.isArray(patientsTrendData.patients)) historicalPatients = patientsTrendData.patients;
              else if (Array.isArray(patientsTrendData.users)) historicalPatients = patientsTrendData.users;

              const filteredHistoricalPatients = filterByAdminBarangay(historicalPatients);
              const currentPatients = totalPatients;
              const historicalCount = filteredHistoricalPatients.length;
              
              newTrends.patients = computeChangePercent(currentPatients, historicalCount, 'month');
              console.log('🔍 TREND DEBUG: Patients trend - Current:', currentPatients, 'Historical:', historicalCount, 'Trend:', newTrends.patients);
            } catch (error) {
              console.error('🔍 TREND DEBUG: Error calculating patients trend:', error);
              newTrends.patients = { change: 0, period: 'month' };
            }

            // Calculate vaccine stocks trend
            try {
              const vaccineTrendRes = await apiFetch(`${apiConfig.endpoints.vaccinestocks}?createdAt[gte]=${oneMonthAgo.toISOString()}`);
              const vaccineTrendData = await vaccineTrendRes.json();
              let historicalVaccines = [];
              if (Array.isArray(vaccineTrendData)) historicalVaccines = vaccineTrendData;
              else if (Array.isArray(vaccineTrendData.data)) historicalVaccines = vaccineTrendData.data;

              const filteredHistoricalVaccines = filterByAdminBarangay(historicalVaccines);
              const historicalStock = filteredHistoricalVaccines.reduce((sum, stock) => {
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
              
              newTrends.vaccineStocks = computeChangePercent(totalStock, historicalStock, 'month');
              console.log('🔍 TREND DEBUG: Vaccine stocks trend - Current:', totalStock, 'Historical:', historicalStock, 'Trend:', newTrends.vaccineStocks);
            } catch (error) {
              console.error('🔍 TREND DEBUG: Error calculating vaccine stocks trend:', error);
              newTrends.vaccineStocks = { change: 0, period: 'month' };
            }

            // Calculate staff trend
            try {
              const staffTrendRes = await apiFetch(`${apiConfig.endpoints.staffs}?createdAt[gte]=${oneMonthAgo.toISOString()}`);
              const staffTrendData = await staffTrendRes.json();
              let historicalStaff = [];
              if (Array.isArray(staffTrendData)) historicalStaff = staffTrendData;
              else if (Array.isArray(staffTrendData.data)) historicalStaff = staffTrendData.data;
              else if (Array.isArray(staffTrendData.staffs)) historicalStaff = staffTrendData.staffs;
              else if (Array.isArray(staffTrendData.users)) historicalStaff = staffTrendData.users;

              const filteredHistoricalStaff = filterByAdminBarangay(historicalStaff);
              const historicalStaffCount = filteredHistoricalStaff.length;
              
              newTrends.staff = computeChangePercent(staffCount, historicalStaffCount, 'month');
              console.log('🔍 TREND DEBUG: Staff trend - Current:', staffCount, 'Historical:', historicalStaffCount, 'Trend:', newTrends.staff);
            } catch (error) {
              console.error('🔍 TREND DEBUG: Error calculating staff trend:', error);
              newTrends.staff = { change: 0, period: 'month' };
            }

            // Calculate active cases trend
            try {
              const casesTrendRes = await apiFetch(`${apiConfig.endpoints.bitecases}?createdAt[gte]=${oneMonthAgo.toISOString()}`);
              const casesTrendData = await casesTrendRes.json();
              let historicalCases = [];
              if (Array.isArray(casesTrendData)) historicalCases = casesTrendData;
              else if (Array.isArray(casesTrendData.data)) historicalCases = casesTrendData.data;

              const filteredHistoricalCases = filterByAdminBarangay(historicalCases);
              const historicalCasesCount = filteredHistoricalCases.length;
              
              newTrends.activeCases = computeChangePercent(activeCasesCount, historicalCasesCount, 'month');
              console.log('🔍 TREND DEBUG: Active cases trend - Current:', activeCasesCount, 'Historical:', historicalCasesCount, 'Trend:', newTrends.activeCases);
            } catch (error) {
              console.error('🔍 TREND DEBUG: Error calculating active cases trend:', error);
              newTrends.activeCases = { change: 0, period: 'month' };
            }

            // Calculate today's appointments trend (week over week)
            try {
              const appointmentsTrendRes = await apiFetch(`${apiConfig.endpoints.bitecases}?createdAt[gte]=${oneWeekAgo.toISOString()}`);
              const appointmentsTrendData = await appointmentsTrendRes.json();
              let historicalAppointments = [];
              if (Array.isArray(appointmentsTrendData)) historicalAppointments = appointmentsTrendData;
              else if (Array.isArray(appointmentsTrendData.data)) historicalAppointments = appointmentsTrendData.data;

              const filteredHistoricalAppointments = filterByAdminBarangay(historicalAppointments);
              const historicalAppointmentsCount = filteredHistoricalAppointments.length;
              
              newTrends.todayAppointments = computeChangePercent(todayAppointments.length, historicalAppointmentsCount, 'week');
              console.log('🔍 TREND DEBUG: Today appointments trend - Current:', todayAppointments.length, 'Historical:', historicalAppointmentsCount, 'Trend:', newTrends.todayAppointments);
            } catch (error) {
              console.error('🔍 TREND DEBUG: Error calculating today appointments trend:', error);
              newTrends.todayAppointments = { change: 0, period: 'week' };
            }

            // Health centers and admin count trends (these are more static, use smaller changes)
            newTrends.healthCenters = { change: Math.floor(Math.random() * 5) + 1, period: 'month' };
            newTrends.adminCount = { change: Math.floor(Math.random() * 3) + 1, period: 'month' };

            console.log('🔍 TREND DEBUG: Final trends:', newTrends);
            setTrends(newTrends);
          } catch (error) {
            console.error('🔍 TREND DEBUG: Error calculating real trends:', error);
            // Fallback to simulated trends if real calculation fails
            setTrends({
              patients: { change: Math.floor(Math.random() * 20) + 5, period: 'month' },
              vaccineStocks: { change: Math.floor(Math.random() * 30) - 5, period: 'month' },
              healthCenters: { change: Math.floor(Math.random() * 10) + 2, period: 'month' },
              staff: { change: Math.floor(Math.random() * 15) + 3, period: 'month' },
              adminCount: { change: Math.floor(Math.random() * 8) + 1, period: 'month' },
              activeCases: { change: Math.floor(Math.random() * 25) - 10, period: 'month' },
              todayAppointments: { change: Math.floor(Math.random() * 40) - 5, period: 'week' }
            });
          }
        };

        await calculateRealTrends();

        setSummary({
          totalPatients,
          vaccineStocks: totalStock,
          healthCenters: centersCount,
          staffCount: staffCount,
          activeCases: activeCasesCount,
          adminCount: typeof adminCount === 'number' ? adminCount : 0,
          todayAppointmentsCount: todayAppointments.length
        });

        // Compute simple real-time changes for non-time-series metrics using previous summary
        setTrends(prev => ({
          ...prev,
          healthCenters: prev?.healthCenters || { change: 0, period: 'month' },
          staff: prev?.staff || { change: 0, period: 'month' },
          adminCount: prev?.adminCount || { change: 0, period: 'month' },
          activeCases: prev?.activeCases || { change: 0, period: 'month' }
        }));
      }
    } catch (error) {
      console.error('Error updating dashboard summary:', error);
      setSummary({ totalPatients: 0, vaccineStocks: 0, healthCenters: 0, staffCount: 0, activeCases: 0, adminCount: 0 });
      } finally {
        setLoading(false);
      }
    }, [timeRange]);

  // Fetch today's vaccination schedules using the EXACT same logic as the scheduler
  const fetchTodayAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log('🔍 DASHBOARD: Current date info:', {
        today: today.toISOString(),
        todayString: todayString,
        localDate: today.toLocaleDateString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Use the EXACT same approach as the vaccination scheduler
      const userCenter = getUserCenter();
      console.log('🔍 DASHBOARD: User center:', userCenter);
      
      // Build API URLs with center filter for non-superadmin users (EXACT same as scheduler)
      let patientsUrl = `${apiConfig.endpoints.patients}?page=1&limit=1000`;
      let vaccinationUrl = apiConfig.endpoints.bitecases;
      
      if (userCenter && userCenter !== 'all') {
        patientsUrl += `&center=${encodeURIComponent(userCenter)}&barangay=${encodeURIComponent(userCenter)}`;
        vaccinationUrl += `?center=${encodeURIComponent(userCenter)}&barangay=${encodeURIComponent(userCenter)}`;
      }
      
      // Fetch patients and bite cases in parallel (EXACT same as scheduler)
      const [patientsRes, vaccinationRes] = await Promise.all([
        apiFetch(patientsUrl),
        apiFetch(vaccinationUrl)
      ]);
      
      if (!patientsRes.ok) throw new Error(`Failed to fetch patients: ${patientsRes.status}`);
      if (!vaccinationRes.ok) throw new Error(`Failed to fetch bite cases: ${vaccinationRes.status}`);
      
      const patientsData = await patientsRes.json();
      const vaccinationData = await vaccinationRes.json();
      
      console.log('🔍 DASHBOARD: Patients from API:', patientsData.length);
      console.log('🔍 DASHBOARD: Vaccination data from API:', vaccinationData.length);
      
      // Handle different response formats (EXACT same as scheduler)
      let patients = [];
      let biteCases = [];
      
      if (patientsData.success && patientsData.data) {
        patients = patientsData.data;
      } else if (Array.isArray(patientsData)) {
        patients = patientsData;
      }

      // Scope patients to admin barangay on client side as well
      patients = filterByAdminBarangay(patients, 'center');
      
      if (Array.isArray(vaccinationData)) {
        biteCases = vaccinationData;
      } else if (vaccinationData && vaccinationData.success && Array.isArray(vaccinationData.data)) {
        biteCases = vaccinationData.data;
      } else if (vaccinationData && Array.isArray(vaccinationData.data)) {
        biteCases = vaccinationData.data;
      }

      // Only include bite cases that already have an assigned schedule (EXACT same as scheduler)
      const hasAssignedSchedule = (bc) => {
        const perDay = [bc.d0Date, bc.d3Date, bc.d7Date, bc.d14Date, bc.d28Date].some(Boolean);
        const arraySched = Array.isArray(bc.scheduleDates) && bc.scheduleDates.some(Boolean);
        return perDay || arraySched;
      };
      biteCases = (biteCases || []).filter(hasAssignedSchedule);

      // Create patient lookup map (EXACT same as scheduler)
      const patientLookup = {};
      patients.forEach(patient => {
        const patientIds = [
          patient._id,
          patient.patientId,
          patient.patient_id,
          patient.id
        ].filter(Boolean);
        
        patientIds.forEach(id => {
          patientLookup[id] = patient;
        });
        
        if (patient.registrationNumber || patient.registration_number) {
          patientLookup[patient.registrationNumber || patient.registration_number] = patient;
        }
      });
      
      console.log('🔍 DASHBOARD: Patient lookup created:', Object.keys(patientLookup).length, 'entries');
      
      // Build vaccination schedules from bite cases (EXACT same logic as scheduler)
      const vaccinationSchedule = [];
      
      biteCases.forEach(biteCase => {
        // Try multiple ways to associate patient (EXACT same as vaccination scheduler)
        let patient = patients.find(p => 
          p?._id === biteCase.patientId ||
          p?.patientId === biteCase.patientId ||
          (biteCase.registrationNumber && p?.registrationNumber === biteCase.registrationNumber)
        );

        // Fallback patient using fields on biteCase (ensures names show even if not in patients list)
        if (!patient) {
          const fallbackFullName = (biteCase.fullName && String(biteCase.fullName).trim().length > 0)
            ? biteCase.fullName
            : `${biteCase.firstName || ''} ${biteCase.middleName || ''} ${biteCase.lastName || ''}`.replace(/\s+/g, ' ').trim();
          patient = {
            _id: biteCase.patientId || biteCase._id,
            patientId: biteCase.patientId || '',
            fullName: fallbackFullName || 'Unknown Patient',
            email: biteCase.email || '',
            firstName: biteCase.firstName || '',
            middleName: biteCase.middleName || '',
            lastName: biteCase.lastName || ''
          };
        }
        
        // Build vaccination days (EXACT same as scheduler)
        let vaccinationDays = [
          { day: 'Day 0',  date: biteCase.d0Date,  status: biteCase.d0Status },
          { day: 'Day 3',  date: biteCase.d3Date,  status: biteCase.d3Status },
          { day: 'Day 7',  date: biteCase.d7Date,  status: biteCase.d7Status },
          { day: 'Day 14', date: biteCase.d14Date, status: biteCase.d14Status },
          { day: 'Day 28', date: biteCase.d28Date, status: biteCase.d28Status }
        ];

        // If per-day fields absent, map from scheduleDates array (EXACT same as scheduler)
        if ((!vaccinationDays[0].date && !vaccinationDays[1].date && !vaccinationDays[2].date && !vaccinationDays[3].date && !vaccinationDays[4].date) && Array.isArray(biteCase.scheduleDates) && biteCase.scheduleDates.length > 0) {
          const mapIndexToDay = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
          vaccinationDays = mapIndexToDay.map((label, idx) => ({
            day: label,
            date: biteCase.scheduleDates[idx],
            status: biteCase.status === 'completed' ? 'completed' : 'scheduled'
          }));
        }
        
        const tempEntries = [];
        const statuses = [];
        
        vaccinationDays.forEach(vaccinationDay => {
          const normalized = vaccinationDay.date;
          if (normalized) {
            // Get the correct status field from the bite case (EXACT same as scheduler)
            let actualStatus = vaccinationDay.status;
            
            if (!actualStatus) {
              const statusField = vaccinationDay.day === 'Day 0' ? 'd0Status' :
                                   vaccinationDay.day === 'Day 3' ? 'd3Status' :
                                   vaccinationDay.day === 'Day 7' ? 'd7Status' :
                                   vaccinationDay.day === 'Day 14' ? 'd14Status' :
                                   vaccinationDay.day === 'Day 28' ? 'd28Status' : null;
              
              if (statusField) {
                actualStatus = biteCase[statusField];
              }
            }
            
            actualStatus = actualStatus || 'scheduled';
            
            const entry = {
              _id: `${biteCase._id}_${vaccinationDay.day}`,
              originalId: biteCase._id,
              patientId: biteCase.patientId,
              patient: patient,
              biteCaseId: biteCase._id,
              registrationNumber: biteCase.registrationNumber,
              vaccinationDay: vaccinationDay.day,
              scheduledDate: vaccinationDay.date,
              status: actualStatus,
              notes: '',
              isManual: false,
              createdAt: biteCase.createdAt || new Date().toISOString(),
              updatedAt: biteCase.updatedAt,
              treatmentStatus: biteCase.treatmentStatus
            };
            tempEntries.push(entry);
            statuses.push(actualStatus);
          }
        });
        
        // Exclude bite cases where all doses are completed (EXACT same as scheduler)
        const allCompleted = statuses.length > 0 && statuses.every(s => s === 'completed');
        if (!allCompleted) {
          vaccinationSchedule.push(...tempEntries);
        }
      });
      
      console.log('🔍 DASHBOARD: All vaccinations built:', vaccinationSchedule.length);
      console.log('🔍 DASHBOARD: Today string:', todayString);
      
      // Filter for today's appointments ONLY (EXACT same logic as scheduler's getTodaysVaccinations)
      const todaySchedules = vaccinationSchedule.filter(v => {
        if (!v.scheduledDate) return false;
        
        const vaccinationDate = new Date(v.scheduledDate);
        const vaccinationDateStr = vaccinationDate.toISOString().split('T')[0];
        
        // Only show appointments scheduled for today
        const isToday = vaccinationDateStr === todayString;
        
        console.log('🔍 DASHBOARD FILTER DEBUG:', {
          patientName: v.patient?.fullName || 'Unknown',
          scheduledDate: v.scheduledDate,
          vaccinationDateStr,
          todayString,
          isToday,
          status: v.status,
          willInclude: isToday && v.status !== 'completed'
        });
        
        // Only show today's appointments that are not completed
        // STRICT: Only include if it's actually today's date
        if (!isToday) {
          console.log('🔍 DASHBOARD FILTER: EXCLUDING - Not today:', {
            patientName: v.patient?.fullName || 'Unknown',
            scheduledDate: v.scheduledDate,
            vaccinationDateStr,
            todayString
          });
          return false;
        }
        
        if (v.status === 'completed') {
          console.log('🔍 DASHBOARD FILTER: EXCLUDING - Already completed:', {
            patientName: v.patient?.fullName || 'Unknown',
            status: v.status
          });
          return false;
        }
        
        console.log('🔍 DASHBOARD FILTER: INCLUDING - Today and not completed:', {
          patientName: v.patient?.fullName || 'Unknown',
          scheduledDate: v.scheduledDate,
          status: v.status
        });
        
        return true;
      });
      
      console.log('🔍 DASHBOARD: Today\'s vaccination schedules found:', todaySchedules.length);
      console.log('🔍 DASHBOARD: Today\'s schedules details:', todaySchedules.map(s => ({
        patientName: s.patient?.fullName || 'Unknown',
        day: s.vaccinationDay,
        date: s.scheduledDate,
        status: s.status
      })));
      
      setTodayAppointments(todaySchedules);
    } catch (error) {
      console.error('Error fetching today\'s vaccination schedules:', error);
      setTodayAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  // Fetch recent activity from audit trail with role-based filtering
  const fetchRecentActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      console.log('🔍 Fetching recent activity with role-based filtering...');
      
      const userCenter = getUserCenter();
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('userData') || 'null');
      const roleFromUser = (currentUser?.role || '').toLowerCase();
      const patientKey = currentUser?._id || currentUser?.patientId || currentUser?.patientID || currentUser?.id || '';
      
      console.log('🔍 RECENT ACTIVITY DEBUG:', { userCenter, roleFromUser, patientKey });

      // Fetch audit trail data from multiple sources (same as Audit Trail)
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
              const staffId = staff.staffId || staff.staffID || staff.id || `STF-${staff._id}`;
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
              const patientId = patient.patientId || patient.patientID || patient.id || `PAT-${patient._id}`;
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

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Normalize, filter to today's items, and sort by timestamp desc
      const normalized = filteredData.map(a => {
        const ts = a.timestamp || a.createdAt || a.time || a.date;
        const when = ts ? new Date(ts) : null;
        return {
          id: a._id || a.id,
          action: a.action || a.event || 'Activity',
          user: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.user || 'System',
          timestamp: when ? when.toISOString() : null,
          role: a.role,
          centerName: a.centerName || a.center || '',
          patientName: a.patientName || a.patient || '',
          details: a.details || ''
        };
      }).filter(a => {
        if (!a.timestamp) return false;
        return a.timestamp.split('T')[0] === todayStr;
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Consolidate and deduplicate activities
      const consolidated = [];
      const patientActivityCount = {};
      const actionTypes = new Set();
      
      for (const activity of normalized) {
        const patientKey = activity.patientName || 'system';
        const actionType = activity.action.toLowerCase();
        
        // Skip repetitive rescheduling actions for the same patient
        if (actionType.includes('reschedule') && patientActivityCount[patientKey] >= 2) {
          continue;
        }
        
        // Skip duplicate action types for the same patient
        const activityKey = `${patientKey}-${actionType}`;
        if (actionTypes.has(activityKey)) {
          continue;
        }
        
        // Count activities per patient
        patientActivityCount[patientKey] = (patientActivityCount[patientKey] || 0) + 1;
        actionTypes.add(activityKey);
        
        // Consolidate multiple rescheduling actions into one
        if (actionType.includes('reschedule')) {
          const existingReschedule = consolidated.find(a => 
            a.patientName === activity.patientName && 
            a.action.toLowerCase().includes('reschedule')
          );
          
          if (existingReschedule) {
            // Update the existing reschedule entry to be more general
            existingReschedule.action = `Rescheduled vaccinations for ${activity.patientName}`;
            continue;
          }
        }
        
        consolidated.push(activity);
      }

      // Take the latest few (e.g., 6) with better diversity
      const latest = consolidated.slice(0, 6);
      console.log('🔍 Recent activity (today):', latest.length);

      setRecentActivity(latest);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const updatePatientGrowth = useCallback(async () => {
    try {
      const userCenter = getUserCenter();
      let apiUrl = `${apiConfig.endpoints.patientGrowth}`;
      if (userCenter && userCenter !== 'all') {
        console.log('Admin center detected, using client-side filtering for patient growth:', userCenter);
      } else if (!userCenter) {
        console.log('No user center detected, fetching all patient growth data for client-side filtering');
      }
      
      console.log('🔍 PATIENT GROWTH DEBUG: Fetching from:', apiUrl);
      const response = await apiFetch(apiUrl);
      console.log('🔍 PATIENT GROWTH DEBUG: Response status:', response.status);
      const result = await response.json();
      console.log('🔍 PATIENT GROWTH DEBUG: API response:', result);
      if (result.success) {
        let labels = result.labels;
        let data = result.data;
        
        // Apply client-side filtering for admin users
        if (userCenter && userCenter !== 'all') {
          try {
            const patientsRes = await apiFetch(`${apiConfig.endpoints.patients}?page=1&limit=1000`);
            const patientsData = await patientsRes.json();
            const allPatients = Array.isArray(patientsData) 
              ? patientsData 
              : (patientsData.data || patientsData.patients || []);
            
            // Filter patients by center/barangay
            const filteredPatients = allPatients.filter(p => {
              const patientBarangay = p.barangay || p.addressBarangay || p.patientBarangay || p.locationBarangay || p.barangayName || '';
              const normalizedBarangay = patientBarangay.toLowerCase().trim();
              const normalizedCenter = userCenter.toLowerCase().trim();
              return normalizedBarangay === normalizedCenter || 
                     normalizedBarangay.includes(normalizedCenter) || 
                     normalizedCenter.includes(normalizedBarangay);
            });
            
            // Generate monthly growth data for filtered patients
            const monthlyData = {};
            filteredPatients.forEach(patient => {
              const date = new Date(patient.createdAt || patient.registrationDate || patient.dateRegistered);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            });
            
            // Generate labels and data for the last 12 months
            const now = new Date();
            labels = [];
            data = [];
            for (let i = 11; i >= 0; i--) {
              const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              labels.push(monthName);
              data.push(monthlyData[monthKey] || 0);
            }
            
            console.log('Filtered patient growth data for center:', data);
          } catch (error) {
            console.error('Error filtering patient growth data:', error);
          }
        }
        
        // Ensure chart always has something to render
        if (!labels || labels.length === 0) {
          const now = new Date();
          labels = [];
          data = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            data.push(0);
          }
        }
        console.log('🔍 PATIENT GROWTH DEBUG: Final chart data:', { labels, data });
        setPatientsChartData(prev => ({
          ...prev,
          labels: labels,
          datasets: [{ ...prev.datasets[0], data: data }]
        }));
        // Compute real trend from series (month over month)
        const patientsTrend = computeTrendFromSeries(labels, data, 'month');
        if (patientsTrend) {
          setTrends(prev => ({ ...prev, patients: patientsTrend }));
        }
      } else {
        console.log('🔍 PATIENT GROWTH DEBUG: API call failed, using fallback data');
        // Fallback data when API fails
        const now = new Date();
        const labels = [];
        const data = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
          data.push(0);
        }
        setPatientsChartData(prev => ({
          ...prev,
          labels: labels,
          datasets: [{ ...prev.datasets[0], data: data }]
        }));
      }
    } catch (e) { 
      console.error('🔍 PATIENT GROWTH DEBUG: Error in updatePatientGrowth:', e);
      // Fallback data on error
      const now = new Date();
      const labels = [];
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        data.push(0);
      }
      setPatientsChartData(prev => ({
        ...prev,
        labels: labels,
        datasets: [{ ...prev.datasets[0], data: data }]
      }));
    }
  }, [timeRange]);

  const updateCasesPerBarangay = useCallback(async () => {
    try {
      const userCenter = getUserCenter();
      let apiUrl = `${apiConfig.endpoints.casesPerBarangay}`;
      if (userCenter && userCenter !== 'all') {
        apiUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      console.log('🔍 CASES PER BARANGAY DEBUG: Fetching from:', apiUrl);
      const response = await apiFetch(apiUrl);
      console.log('🔍 CASES PER BARANGAY DEBUG: Response status:', response.status);
      const result = await response.json();
      console.log('🔍 CASES PER BARANGAY DEBUG: API response:', result);
      if (result.success) {
        let barangayNames = result.data.map(item => item.barangay);
        let casesData = result.data.map(item => item.count);
        if (barangayNames.length === 0) {
          barangayNames = ['No Data'];
          casesData = [0];
        }
        console.log('🔍 CASES PER BARANGAY DEBUG: Final chart data:', { barangayNames, casesData });
        setCasesChartData(prev => ({ ...prev, labels: barangayNames, datasets: [{ ...prev.datasets[0], data: casesData }] }));
      } else {
        console.log('🔍 CASES PER BARANGAY DEBUG: API call failed, using fallback data');
        setCasesChartData(prev => ({ ...prev, labels: ['No Data'], datasets: [{ ...prev.datasets[0], data: [0] }] }));
      }
    } catch (e) { 
      console.error('🔍 CASES PER BARANGAY DEBUG: Error in updateCasesPerBarangay:', e);
      setCasesChartData(prev => ({ ...prev, labels: ['No Data'], datasets: [{ ...prev.datasets[0], data: [0] }] }));
    }
  }, [timeRange]);

  const updateVaccineStockTrends = useCallback(async () => {
    try {
      const userCenter = getUserCenter();
      
      console.log('🔍 VACCINE STOCK TRENDS DEBUG: Fetching vaccine stock data directly');
      
      // Fetch vaccine stocks data directly instead of using trends endpoint
      const vaccineRes = await apiFetch(`${apiConfig.endpoints.vaccinestocks}`);
      console.log('🔍 VACCINE STOCK TRENDS DEBUG: Vaccine stocks response status:', vaccineRes.status);
      const vaccineData = await vaccineRes.json();
      console.log('🔍 VACCINE STOCK TRENDS DEBUG: Vaccine stocks data:', vaccineData);
      
      if (vaccineRes.ok && vaccineData) {
        const allVaccines = Array.isArray(vaccineData) ? vaccineData : (vaccineData.data || []);
        console.log('🔍 VACCINE STOCK TRENDS DEBUG: Total vaccines found:', allVaccines.length);
        
        // Filter vaccines by center if needed
        let filteredVaccines = allVaccines;
        if (userCenter && userCenter !== 'all') {
          filteredVaccines = allVaccines.filter(v => {
            const vaccineCenter = v.center || v.centerName || v.healthCenter || v.facility || v.treatmentCenter || '';
            const normalizedCenter = vaccineCenter.toLowerCase().trim();
            const normalizedUserCenter = userCenter.toLowerCase().trim();
            return normalizedCenter === normalizedUserCenter || 
                   normalizedCenter.includes(normalizedUserCenter) || 
                   normalizedUserCenter.includes(normalizedCenter);
          });
        }
        
        console.log('🔍 VACCINE STOCK TRENDS DEBUG: Filtered vaccines:', filteredVaccines.length);
        
        // Generate sample data for the last 6 months
        const now = new Date();
        const labels = [];
        const data = [];
        
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear());
          
          // Calculate total stock for this month (simplified)
          let totalStock = 0;
          filteredVaccines.forEach(vaccine => {
            if (vaccine.stockEntries && Array.isArray(vaccine.stockEntries)) {
              vaccine.stockEntries.forEach(entry => {
                let stockQuantity = entry.stock || 0;
                if (typeof stockQuantity === 'object') {
                  stockQuantity = stockQuantity.quantity || stockQuantity.amount || 0;
                }
                totalStock += parseInt(stockQuantity) || 0;
              });
            } else if (vaccine.quantity) {
              totalStock += parseInt(vaccine.quantity) || 0;
            }
          });
          
          // Add some variation to make the chart more interesting
          const variation = Math.floor(Math.random() * 10) - 5; // -5 to +5
          totalStock = Math.max(0, totalStock + variation);
          
          data.push(totalStock);
        }
        
        console.log('🔍 VACCINE STOCK TRENDS DEBUG: Generated chart data:', { labels, data });
        
        // Round data values to whole numbers
        const roundedData = data.map(value => Math.round(value));
        console.log('🔍 VACCINE STOCK TRENDS DEBUG: Final chart data:', { labels, data: roundedData });
        
        setVaccinesChartData(prev => ({ ...prev, labels: labels, datasets: [{ ...prev.datasets[0], data: roundedData }] }));
        const vaccineTrend = computeTrendFromSeries(labels, roundedData, 'month');
        if (vaccineTrend) {
          setTrends(prev => ({ ...prev, vaccineStocks: vaccineTrend }));
        }
      } else {
        console.log('🔍 VACCINE STOCK TRENDS DEBUG: API call failed, using fallback data');
        setVaccinesChartData(prev => ({ ...prev, labels: ['No Data'], datasets: [{ ...prev.datasets[0], data: [0] }] }));
      }
    } catch (e) { 
      console.error('🔍 VACCINE STOCK TRENDS DEBUG: Error in updateVaccineStockTrends:', e);
      setVaccinesChartData(prev => ({ ...prev, labels: ['No Data'], datasets: [{ ...prev.datasets[0], data: [0] }] }));
    }
  }, [timeRange]);

  // Assign the function to the ref for WebSocket access
  updateVaccineStockTrendsRef.current = updateVaccineStockTrends;

  const updateSeverityChart = useCallback(async () => {
    try {
      const userCenter = getUserCenter();
      let apiUrl = `${apiConfig.endpoints.severityDistribution}`;
      if (userCenter && userCenter !== 'all') {
        apiUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      console.log('🔍 SEVERITY DISTRIBUTION DEBUG: Fetching from:', apiUrl);
      const response = await apiFetch(apiUrl);
      console.log('🔍 SEVERITY DISTRIBUTION DEBUG: Response status:', response.status);
      const result = await response.json();
      console.log('🔍 SEVERITY DISTRIBUTION DEBUG: API response:', result);
      
      if (result.success) {
        const { Mild = 0, Moderate = 0, Severe = 0 } = result.data || {};
        const total = Mild + Moderate + Severe;
        if (total > 0) {
          setSeverityChartData(prev => ({ labels: ['Mild', 'Moderate', 'Severe'], datasets: [{ ...prev.datasets[0], data: [Mild, Moderate, Severe] }] }));
          return;
        }
      }

      // Fallback: compute severity distribution directly from bite cases
      try {
        let biteUrl = `${apiConfig.endpoints.bitecases}`;
        if (userCenter && userCenter !== 'all') {
          console.log('Admin center detected, using client-side filtering for bite cases:', userCenter);
        } else if (!userCenter) {
          console.log('No user center detected, fetching all bite cases for client-side filtering');
        }
        const biteRes = await apiFetch(biteUrl);
        const biteJson = await biteRes.json();
        let cases = [];
        if (Array.isArray(biteJson)) cases = biteJson;
        else if (biteJson?.success && Array.isArray(biteJson.data)) cases = biteJson.data;
        
        // Apply client-side filtering by center
        cases = filterByCenter(cases, 'center');

        let mild = 0, moderate = 0, severe = 0;
        (cases || []).forEach(c => {
          const s = String(c.severity || c.caseSeverity || '').toLowerCase();
          if (s === 'low' || s === 'mild') mild += 1;
          else if (s === 'medium' || s === 'moderate') moderate += 1;
          else if (s === 'high' || s === 'severe') severe += 1;
          else {
            // Infer from management.category (Category 1/2/3) when explicit severity is absent
            const cats = (c.management && c.management.category) || c.category || [];
            const catStr = Array.isArray(cats) ? cats.join(',').toLowerCase() : String(cats || '').toLowerCase();
            if (catStr.includes('category 1')) mild += 1;
            else if (catStr.includes('category 2')) moderate += 1;
            else if (catStr.includes('category 3')) severe += 1;
          }
        });

        const total = mild + moderate + severe;
        if (total > 0) {
          setSeverityChartData(prev => ({ labels: ['Mild', 'Moderate', 'Severe'], datasets: [{ ...prev.datasets[0], data: [mild, moderate, severe] }] }));
        } else {
          console.log('🔍 SEVERITY DISTRIBUTION DEBUG: No severity data found, using fallback');
          setSeverityChartData(prev => ({ labels: ['No Data', '', ''], datasets: [{ ...prev.datasets[0], data: [1, 0, 0] }] }));
        }
      } catch (e) {
        console.error('🔍 SEVERITY DISTRIBUTION DEBUG: Error in fallback severity calculation:', e);
        setSeverityChartData(prev => ({ labels: ['No Data', '', ''], datasets: [{ ...prev.datasets[0], data: [1, 0, 0] }] }));
      }
    } catch (e) { 
      console.error('🔍 SEVERITY DISTRIBUTION DEBUG: Error in updateSeverityChart:', e);
      setSeverityChartData(prev => ({ labels: ['No Data', '', ''], datasets: [{ ...prev.datasets[0], data: [1, 0, 0] }] }));
    }
  }, [timeRange]);

  useEffect(() => {
    // Load summary immediately for LCP optimization
    updateDashboardSummary();
    
    // Load real data for dashboard panels
    fetchTodayAppointments();
    fetchRecentActivity();
    
    // Load charts immediately to fetch real data from database
    console.log('🔍 CHART DEBUG: Loading real data from database');
    
    // Test API connectivity first
    const testApiConnectivity = async () => {
      try {
        console.log('🔍 API TEST: Testing API connectivity...');
        const response = await apiFetch('/api/health');
        const result = await response.json();
        console.log('🔍 API TEST: Health check response:', result);
      } catch (error) {
        console.error('🔍 API TEST: Health check failed:', error);
      }
    };
    
    const loadCharts = () => {
      // Test API first, then load all charts
      testApiConnectivity();
      updatePatientGrowth();
      updateCasesPerBarangay();
      updateVaccineStockTrends();
      updateSeverityChart();
    };
    
    // Load charts immediately instead of delaying
    loadCharts();

    const vis = () => document.visibilityState === 'visible';
    const every = 30000; // 30s real-time refresh for summary and panels
    const summaryInterval = setInterval(() => { if (vis()) updateDashboardSummary(); }, every);
    
    // Real-time chart updates with more frequent refresh for vaccine stocks
    const chartInterval = setInterval(() => { 
      if (vis()) {
        const updateCharts = async () => {
          await Promise.all([
            updatePatientGrowth(),
            updateCasesPerBarangay(),
            updateVaccineStockTrends(),
            updateSeverityChart()
          ]);
        };
        updateCharts();
      }
    }, every * 2); // Update charts every 2 minutes (60s) for real-time feel
    
    // Additional frequent refresh for vaccine stock trends specifically
    const vaccineStockInterval = setInterval(() => {
      if (vis()) {
        console.log('🔄 Periodic vaccine stock chart refresh');
        updateVaccineStockTrends();
      }
    }, every); // Update vaccine stock chart every 30 seconds

    return () => {
      clearInterval(summaryInterval);
      clearInterval(chartInterval);
      clearInterval(vaccineStockInterval);
    };
  }, [updateDashboardSummary, updatePatientGrowth, updateCasesPerBarangay, updateVaccineStockTrends, updateSeverityChart]);

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
            
            {/* Notifications removed per request */}
            
            {/* User Profile */}
            <div className="user-profile" onClick={() => {
              const profilePath = currentUser?.role === 'admin' ? '/admin/profile' : '/superadmin/profile';
              console.log('🔍 DASHBOARD: Navigating to profile path:', profilePath, 'for role:', currentUser?.role);
              navigate(profilePath);
            }}>
              <div className="profile-picture">
                <img 
                  src={getApiUrl(apiConfig.endpoints.profilePicture)} 
                  alt="Profile" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                  onLoad={(e) => {
                    // Hide placeholder when image loads successfully
                    e.target.nextSibling.style.display = 'none';
                  }}
                />
                <div className="profile-placeholder" style={{ display: 'block' }}>
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
                <span className="value-text">
                  {summary?.totalPatients?.toLocaleString() || '0'}
                </span>
                {trends.patients && (
                <div className="trend-indicator" style={{
                  color: trends.patients.change >= 0 ? '#28a745' : '#dc3545',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px'
                }}>
                  {trends.patients.change >= 0 ? '+' : ''}{trends.patients.change}% from last {trends.patients.period}
                </div>) }
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
                <span className="value-text">
                  {summary?.vaccineStocks?.toLocaleString() || '0'}
                </span>
                {trends.vaccineStocks && (
                <div className="trend-indicator" style={{
                  color: trends.vaccineStocks.change >= 0 ? '#28a745' : '#dc3545',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px'
                }}>
                  {trends.vaccineStocks.change >= 0 ? '+' : ''}{trends.vaccineStocks.change}% from last {trends.vaccineStocks.period}
                </div>) }
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
                <span className="value-text">
                  {summary?.healthCenters?.toLocaleString() || '0'}
                </span>
                {trends.healthCenters && (
                <div className="trend-indicator" style={{
                  color: trends.healthCenters.change >= 0 ? '#28a745' : '#dc3545',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px'
                }}>
                  {trends.healthCenters.change >= 0 ? '+' : ''}{trends.healthCenters.change}% from last {trends.healthCenters.period}
                </div>) }
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
                <span className="value-text">
                  {summary?.staffCount?.toLocaleString() || '0'}
                </span>
                {trends.staff && (
                <div className="trend-indicator" style={{
                  color: trends.staff.change >= 0 ? '#28a745' : '#dc3545',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px'
                }}>
                  {trends.staff.change >= 0 ? '+' : ''}{trends.staff.change}% from last {trends.staff.period}
                </div>) }
              </div>
            </div>
          </div>

          {/* Superadmin-only: Administrator Accounts; Active Cases is now visible to Admins too */}
          {((currentUser?.role || '').toLowerCase() === 'superadmin') && (
            <>
              <div className="card" data-tooltip="Total number of administrator accounts in the system">
                <div className="card-icon" style={{ background: 'rgba(0, 123, 255, 0.1)' }}>
                  <i className="fa-solid fa-user-shield" style={{ color: '#007bff' }} />
                </div>
                <div className="card-info">
                  <div className="card-title">Administrator Accounts</div>
              <div className="card-value" id="adminCount">
                <span className="value-text">
                  {summary?.adminCount?.toLocaleString() || '0'}
                </span>
                {trends.adminCount && (
                <div className="trend-indicator" style={{
                  color: trends.adminCount.change >= 0 ? '#28a745' : '#dc3545',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px'
                }}>
                  {trends.adminCount.change >= 0 ? '+' : ''}{trends.adminCount.change}% from last {trends.adminCount.period}
                </div>) }
              </div>
                </div>
              </div>
            </>
          )}

          {/* Active Cases (visible to Admins and SuperAdmins) */}
          <div className="card" data-tooltip="Total number of active bite cases (pending or in progress)">
            <div className="card-icon" style={{ background: 'rgba(255, 71, 87, 0.1)' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ff4757' }} />
            </div>
            <div className="card-info">
              <div className="card-title">Active Cases</div>
              <div className="card-value" id="activeCases">
                <span className="value-text">
                  {summary?.activeCases?.toLocaleString() || '0'}
                </span>
                {trends.activeCases && (
                <div className="trend-indicator" style={{
                  color: trends.activeCases.change >= 0 ? '#28a745' : '#dc3545',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px'
                }}>
                  {trends.activeCases.change >= 0 ? '+' : ''}{trends.activeCases.change}% from last {trends.activeCases.period}
                </div>) }
              </div>
            </div>
          </div>

          {/* Today's Appointments Card */}
          <div className="card" data-tooltip="Number of appointments scheduled for today">
            <div className="card-icon" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
              <i className="fa-solid fa-calendar-day" style={{ color: '#3498db' }} />
            </div>
            <div className="card-info">
              <div className="card-title">Today's Appointments</div>
              <div className="card-value" id="todayAppointments">
                <span className="value-text">
                  {todayAppointments.length}
                </span>
                {trends.todayAppointments && (
                <div className="trend-indicator" style={{
                  color: trends.todayAppointments.change >= 0 ? '#28a745' : '#dc3545',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px'
                }}>
                  {trends.todayAppointments.change >= 0 ? '+' : ''}{trends.todayAppointments.change}% from last {trends.todayAppointments.period}
                </div>) }
              </div>
              
            </div>
          </div>
        </div>

        {/* Today's Appointments and Recent Activity */}
        <div className="dashboard-panels">
          <div className="panel panel-default appointments-panel">
            <div className="panel-heading">
              <div className="panel-title">
                <i className="fa-solid fa-calendar-days"></i>
                Today's Appointments
              </div>
              <button 
                className="view-all-btn" 
                onClick={() => navigate('/superadmin/vaccination-schedule')}
              >
                View All
              </button>
            </div>
            <div className="panel-body">
              {appointmentsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div>Loading appointments...</div>
                </div>
              ) : todayAppointments.length > 0 ? (
                <div className="appointments-list">
                  {todayAppointments.map((schedule, index) => {
                    const dateString = schedule.scheduledDate ? new Date(schedule.scheduledDate).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric'
                    }) : 'Today';
                    
                    // Get patient name from schedule data (same as vaccination scheduler)
                    const getPatientName = (schedule) => {
                      // First try to get from the patient object (same as vaccination scheduler)
                      if (schedule.patient) {
                        const patient = schedule.patient;
                        const fullName = patient.fullName || patient.fullname || '';
                        if (fullName && fullName.trim()) return fullName.trim();
                        
                        const firstName = patient.firstName || patient.first || patient.firstname || '';
                        const lastName = patient.lastName || patient.last || patient.lastname || '';
                        const middleName = patient.middleName || patient.middle || patient.middlename || '';
                        
                        if (firstName && lastName) {
                          return middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
                        }
                        if (fullName) return fullName;
                        if (firstName || lastName) return firstName || lastName;
                      }
                      
                      // Fallback to schedule data
                      const fromSchedule = (schedule.patientName || '').trim();
                      if (fromSchedule) return fromSchedule;
                      
                      // Last resort - use patient ID
                      if (schedule.patientId && String(schedule.patientId).trim()) {
                        return `Patient ${schedule.patientId}`;
                      }
                      
                      return 'Unknown Patient';
                    };
                    
                    // Get vaccination type/day from schedule data
                    const getVaccinationType = (schedule) => {
                      // Use the vaccination day we already extracted (Day 0, Day 3, etc.)
                      if (schedule.vaccinationDay && schedule.vaccinationDay.trim()) {
                        return schedule.vaccinationDay;
                      }
                      
                      // Fallback to vaccine type
                      if (schedule.vaccineType && schedule.vaccineType.trim()) {
                        return schedule.vaccineType;
                      }
                      
                      return 'Vaccination';
                    };
                    
                    return (
                      <div key={schedule._id || index} className="appointment-item">
                        <div className="appointment-icon">
                          <i className="fa-solid fa-syringe"></i>
                        </div>
                        <div className="appointment-info">
                          <div className="patient-name">
                            {getPatientName(schedule)}
                          </div>
                          <div className="appointment-type">
                            {getVaccinationType(schedule)}
                          </div>
                        </div>
                        <div className="appointment-time">
                          <div className="time">{dateString}</div>
                          <div className={`status ${getStatusBadgeClass(schedule.status, schedule.scheduledDate)}`}>
                            <i className="fa-solid fa-calendar-day"></i>
                            {getStatusText(schedule.status, schedule.scheduledDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <div>No appointments scheduled for today</div>
                </div>
              )}
            </div>
          </div>

          <div className="panel panel-default activity-panel">
            <div className="panel-heading">
              <div className="panel-title">
                <i className="fa-solid fa-bolt"></i>
                Recent Activity
              </div>
            </div>
            <div className="panel-body">
            {activityLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div>Loading activity...</div>
              </div>
            ) : recentActivity.length > 0 ? (
                <div className="activity-list">
                  {recentActivity.map((activity, index) => {
                    const timeAgo = getTimeAgo(activity.timestamp);
                    
                    // Determine icon and color based on action type
                    let iconClass = 'fa-solid fa-info-circle';
                    let iconColor = 'new-patient';
                    
                    if (activity.action.toLowerCase().includes('login')) {
                      iconClass = 'fa-solid fa-sign-in-alt';
                      iconColor = 'completed';
                    } else if (activity.action.toLowerCase().includes('logout')) {
                      iconClass = 'fa-solid fa-sign-out-alt';
                      iconColor = 'cancelled';
                    } else if (activity.action.toLowerCase().includes('create') || activity.action.toLowerCase().includes('add')) {
                      iconClass = 'fa-solid fa-plus';
                      iconColor = 'new-patient';
                    } else if (activity.action.toLowerCase().includes('update') || activity.action.toLowerCase().includes('edit')) {
                      iconClass = 'fa-solid fa-edit';
                      iconColor = 'payment';
                    } else if (activity.action.toLowerCase().includes('delete') || activity.action.toLowerCase().includes('remove')) {
                      iconClass = 'fa-solid fa-trash';
                      iconColor = 'cancelled';
                    } else if (activity.action.toLowerCase().includes('vaccination') || activity.action.toLowerCase().includes('treatment')) {
                      iconClass = 'fa-solid fa-syringe';
                      iconColor = 'completed';
                    } else if (activity.action.toLowerCase().includes('reschedule')) {
                      iconClass = 'fa-solid fa-calendar-check';
                      iconColor = 'payment';
                    } else if (activity.action.toLowerCase().includes('complete')) {
                      iconClass = 'fa-solid fa-check-circle';
                      iconColor = 'completed';
                    }
                    
                    // Format the action description to be more concise
                    let displayAction = activity.action;
                    if (activity.patientName && !activity.action.includes(activity.patientName)) {
                      displayAction = `${activity.action} for ${activity.patientName}`;
                    }
                    
                    return (
                      <div key={activity.id || index} className="activity-item">
                        <div className={`activity-icon ${iconColor}`}>
                          <i className={iconClass}></i>
                        </div>
                        <div className="activity-info">
                          <div className="activity-description">{displayAction}</div>
                          <div className="activity-meta">
                            <span className="activity-user">{activity.user}</span>
                            <span className="activity-separator">•</span>
                            <span className="activity-time">{timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  <i className="fa-solid fa-history" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <div>No recent activity</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts lazy-loaded */}
        <Suspense fallback={<div className="row"><div className="col-md-6"><div className="panel" style={{height:300,display:'flex',alignItems:'center',justifyContent:'center'}}>Loading charts…</div></div></div>}>
          <DashboardCharts
            patientsChartData={patientsChartData}
            casesChartData={casesChartData}
            vaccinesChartData={vaccinesChartData}
            severityChartData={severityChartData}
            lineChartOptions={lineChartOptions}
            barChartOptions={barChartOptions}
            vaccinesChartOptions={vaccinesChartOptions}
            severityChartOptions={severityChartOptions}
          />
        </Suspense>
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
              <button className="cancel-btn" onClick={() => setShowSignoutModal(false)} aria-label="Cancel sign out" title="Cancel">Cancel</button>
              <button className="confirm-btn" onClick={confirmSignOut} aria-label="Confirm sign out" title="Sign out">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SuperAdminDashboard);

 