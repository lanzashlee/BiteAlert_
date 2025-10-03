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
import { Suspense } from 'react';
import SmallLoadingSpinner from './SmallDogLoading';
import './SuperAdminDashboard.css';
const DashboardCharts = React.lazy(() => import('./DashboardChartsLazy'));

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
          console.log('Admin center detected, using client-side filtering for center:', userCenter);
        } else if (!userCenter) {
          console.log('No user center detected, fetching all staff for client-side filtering');
        }
        const response = await apiFetch(staffUrl);
        const result = await response.json();
        if (result.success && Array.isArray(result.staffs)) {
          // Apply client-side filtering by center
          const filteredStaff = filterByCenter(result.staffs, 'center');
          staffCount = filteredStaff.length;
        }
      } catch {}
      let vaccineUrl = `${apiConfig.endpoints.vaccinestocks}`;
      if (userCenter && userCenter !== 'all') {
        console.log('Admin center detected, using client-side filtering for vaccines:', userCenter);
      } else if (!userCenter) {
        console.log('No user center detected, fetching all vaccines for client-side filtering');
      }
      
      const vaccineResponse = await apiFetch(vaccineUrl);
      const vaccineResult = await vaccineResponse.json();
      let totalStock = 0;
      if (vaccineResult.success && Array.isArray(vaccineResult.data)) {
        // Apply client-side filtering by center
        const filteredVaccines = filterByCenter(vaccineResult.data, 'center');
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
          return sum + (isNaN(quantity) ? 0 : quantity);
        }, 0);
      }

      let summaryUrl = `${apiConfig.endpoints.dashboardSummary}?filter=${timeRange}`;
      if (userCenter && userCenter !== 'all') {
        console.log('Admin center detected, using client-side filtering for dashboard summary:', userCenter);
      } else if (!userCenter) {
        console.log('No user center detected, fetching all dashboard data for client-side filtering');
      }
      
      const response = await apiFetch(summaryUrl);
      const result = await response.json();
      if (result.success && result.data) {
        let { totalPatients, adminCount } = result.data;
        
        // Apply client-side filtering for total patients
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
            
            totalPatients = filteredPatients.length;
            console.log('Filtered total patients for center:', totalPatients);
          } catch (error) {
            console.error('Error filtering patients for dashboard:', error);
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

        // Active cases: count from Vaccine Schedule (bite cases with assigned schedule)
        let activeCasesCount = 0;
        try {
          let vaccinationUrl = apiConfig.endpoints.bitecases;
          if (userCenter && userCenter !== 'all') {
            console.log('Admin center detected, using client-side filtering for vaccinations:', userCenter);
          } else if (!userCenter) {
            console.log('No user center detected, fetching all vaccinations for client-side filtering');
          }
          const vaccinationRes = await apiFetch(vaccinationUrl);
          const vaccinationData = await vaccinationRes.json();
          let biteCases = [];
          if (Array.isArray(vaccinationData)) biteCases = vaccinationData;
          else if (vaccinationData?.success && Array.isArray(vaccinationData.data)) biteCases = vaccinationData.data;
          
          // Apply client-side filtering by center
          biteCases = filterByCenter(biteCases, 'center');

          const hasAssignedSchedule = (bc) => {
            const perDay = [bc.d0Date, bc.d3Date, bc.d7Date, bc.d14Date, bc.d28Date].some(Boolean);
            const arraySched = Array.isArray(bc.scheduleDates) && bc.scheduleDates.some(Boolean);
            return perDay || arraySched;
          };

          // Treat as active when there is a schedule AND status is not completed
          activeCasesCount = (biteCases || []).filter(bc => hasAssignedSchedule(bc) && String(bc.status || '').toLowerCase() !== 'completed').length;
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
        console.log('Admin center detected, using client-side filtering for patient growth:', userCenter);
      } else if (!userCenter) {
        console.log('No user center detected, fetching all patient growth data for client-side filtering');
      }
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
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
        
        setPatientsChartData(prev => ({
          ...prev,
          labels: labels,
          datasets: [{ ...prev.datasets[0], data: data }]
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
        console.log('Admin center detected, using client-side filtering for vaccine stock trends:', userCenter);
      } else if (!userCenter) {
        console.log('No user center detected, fetching all vaccine stock trends for client-side filtering');
      }
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
      if (result.success) {
        let labels = result.labels;
        let data = result.data;
        
        // Apply client-side filtering for admin users
        if (userCenter && userCenter !== 'all') {
          try {
            const vaccineRes = await apiFetch(`${apiConfig.endpoints.vaccinestocks}`);
            const vaccineData = await vaccineRes.json();
            const allVaccines = Array.isArray(vaccineData) 
              ? vaccineData 
              : (vaccineData.data || []);
            
            // Filter vaccines by center
            const filteredVaccines = allVaccines.filter(v => {
              const vaccineCenter = v.center || v.centerName || v.healthCenter || v.facility || v.treatmentCenter || '';
              const normalizedCenter = vaccineCenter.toLowerCase().trim();
              const normalizedUserCenter = userCenter.toLowerCase().trim();
              
              console.log('Vaccine filtering:', {
                vaccineCenter,
                normalizedCenter,
                normalizedUserCenter,
                matches: normalizedCenter === normalizedUserCenter || 
                        normalizedCenter.includes(normalizedUserCenter) || 
                        normalizedUserCenter.includes(normalizedCenter)
              });
              
              return normalizedCenter === normalizedUserCenter || 
                     normalizedCenter.includes(normalizedUserCenter) || 
                     normalizedUserCenter.includes(normalizedCenter);
            });
            
            console.log('Total vaccines before filtering:', allVaccines.length);
            console.log('Filtered vaccines for center:', filteredVaccines.length);
            console.log('Sample filtered vaccine:', filteredVaccines[0]);
            console.log('Sample original vaccine:', allVaccines[0]);
            
            // Generate monthly stock trends for filtered vaccines
            const monthlyData = {};
            filteredVaccines.forEach(vaccine => {
              console.log('Processing vaccine:', {
                vaccine,
                createdAt: vaccine.createdAt,
                dateAdded: vaccine.dateAdded,
                updatedAt: vaccine.updatedAt,
                quantity: vaccine.quantity
              });
              
              const date = new Date(vaccine.createdAt || vaccine.dateAdded || vaccine.updatedAt);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const quantity = Number(vaccine.quantity || 0);
              
              console.log('Date processing:', {
                date,
                monthKey,
                quantity,
                isValidDate: !isNaN(date.getTime())
              });
              
              if (!isNaN(date.getTime())) {
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + quantity;
              }
            });
            
            console.log('Monthly data generated:', monthlyData);
            
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
            
            console.log('Filtered vaccine stock trends for center:', data);
            
            // If no filtered data, fall back to original data
            if (data.every(val => val === 0) && filteredVaccines.length === 0) {
              console.log('No filtered vaccine data found, using original API data');
              labels = result.labels;
              data = result.data;
            }
          } catch (error) {
            console.error('Error filtering vaccine stock trends:', error);
            // Fall back to original data on error
            labels = result.labels;
            data = result.data;
          }
        }
        
        setVaccinesChartData(prev => ({ ...prev, labels: labels, datasets: [{ ...prev.datasets[0], data: data }] }));
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
          setSeverityChartData(prev => ({ labels: ['No Data', '', ''], datasets: [{ ...prev.datasets[0], data: [1, 0, 0] }] }));
        }
      } catch (e) {
        setSeverityChartData(prev => ({ labels: ['No Data', '', ''], datasets: [{ ...prev.datasets[0], data: [1, 0, 0] }] }));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    // Stagger initial work: summary immediately, others in idle/timeout
    updateDashboardSummary();
    const idle = window.requestIdleCallback || ((cb)=>setTimeout(cb, 150));
    idle(() => {
      updatePatientGrowth();
      updateCasesPerBarangay();
      updateVaccineStockTrends();
      updateSeverityChart();
    });

    const vis = () => document.visibilityState === 'visible';
    const every = 300000;
    const summaryInterval = setInterval(() => { if (vis()) updateDashboardSummary(); }, every);
    const patientInterval = setInterval(() => { if (vis()) updatePatientGrowth(); }, every);
    const casesInterval = setInterval(() => { if (vis()) updateCasesPerBarangay(); }, every);
    const vaccineInterval = setInterval(() => { if (vis()) updateVaccineStockTrends(); }, every);
    const severityInterval = setInterval(() => { if (vis()) updateSeverityChart(); }, every);

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
            <div className="user-profile" onClick={() => {
              const profilePath = currentUser?.role === 'admin' ? '/admin/profile' : '/superadmin/profile';
              console.log('🔍 DASHBOARD: Navigating to profile path:', profilePath, 'for role:', currentUser?.role);
              navigate(profilePath);
            }}>
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

 