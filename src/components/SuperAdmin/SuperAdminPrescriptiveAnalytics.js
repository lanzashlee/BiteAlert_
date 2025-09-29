import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedModal from '../UnifiedModal';
import { apiFetch, apiConfig } from '../../config/api';
import './SuperAdminPrescriptiveAnalytics.css';
import LoadingSpinner from './DogLoadingSpinner.jsx';

const SuperAdminPrescriptiveAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const location = useLocation();

  const sanJuanBarangays = [
    "Addition Hills", "Balong-Bato", "Batis", "Corazon de Jesus", "Ermitaño",
    "Greenhills", "Isabelita", "Kabayanan", "Little Baguio",
    "Maytunas", "Onse", "Pasadena", "Pedro Cruz", "Progreso", "Rivera",
    "Salapan", "San Perfecto", "Santa Lucia", "Tibagan", "West Crame"
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setCurrentUser(userData);
    }
    fetchAnalyticsData();
  }, [timeRange, selectedBarangay]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setAiLoading(true);
    setAiError('');
    try {
      const casesRes = await apiFetch(apiConfig.endpoints.bitecases);
      const raw = await casesRes.json();
      const cases = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.cases)
            ? raw.cases
            : [];
      const normalized = normalizeCases(cases);
      const processedData = processAnalyticsData(normalized);
      setAnalyticsData(processedData);
      
      // Automatically generate AI recommendations
      await generateWithAI(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const inferBarangayFromText = (text) => {
    if (!text) return null;
    const hay = String(text).toLowerCase();
    const match = sanJuanBarangays.find(b => hay.includes(b.toLowerCase()));
    return match || null;
  };

  const normalizeCases = (cases) => {
    const coerceDate = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return new Date(v);
      if (typeof v === 'number') return new Date(v);
      if (v?.$date?.$numberLong) return new Date(Number(v.$date.$numberLong));
      if (v?.$date) return new Date(v.$date);
      return new Date(v);
    };
    const mapSeverity = (c) => {
      const exposureCategory = (c.exposureCategory || '').toString().toUpperCase();
      const exposureType = (c.exposureType || '').toString();
      if (exposureCategory === 'III' || exposureType === '3') return 'high';
      if (exposureCategory === 'II' || exposureType === '2') return 'medium';
      return 'low';
    };
    return cases.map((c) => {
      const incidentDate = coerceDate(c.incidentDate || c.exposureDate || c.dateRegistered || c.createdAt || c.updatedAt);
      const severity = c.severity || mapSeverity(c);
      const center = c.center || c.centerName || c.healthCenter || c.facility || c.treatmentCenter || null;
      const barangayDirect = c.barangay || c.addressBarangay || c.patientBarangay || c.locationBarangay || c.barangayName || null;
      const addressBlob = c.address || c.patientAddress || c.location || c.addressString || c.fullAddress || '';
      const barangay = barangayDirect || inferBarangayFromText(addressBlob);
      return { incidentDate, severity, center, barangay };
    }).filter(c => !!c.incidentDate && !!c.barangay);
  };

  const processAnalyticsData = (cases) => {
    const now = new Date();
    const timeRangeMap = { week: 7, month: 30, quarter: 90, year: 365 };
    const daysBack = timeRangeMap[timeRange] || 30;
    const filteredCases = cases.filter(case_ => {
      const caseDate = new Date(case_.incidentDate);
      return (now - caseDate) <= (daysBack * 24 * 60 * 60 * 1000);
    });

    const finalCases = selectedBarangay === 'all' 
      ? filteredCases 
      : filteredCases.filter(case_ => case_.barangay === selectedBarangay);

    const riskAnalysis = calculateRiskScores(finalCases);

    return {
      cases: finalCases,
      riskAnalysis,
      interventionRecommendations: [] // Will be populated by AI
    };
  };

  // Limit text to a maximum number of sentences
  const truncateSentences = (text, max = 3) => {
    if (!text) return text;
    const parts = String(text)
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[.!?])\s+/);
    if (parts.length <= max) return parts.join(' ');
    return parts.slice(0, max).join(' ');
  };

  // Function to remove numbered lists from text
  const removeNumberedLists = (text) => {
    if (!text) return text;
    
    let cleanedText = text;
    
    // Remove patterns like "1. ", "2. ", "3. ", etc. (more aggressive)
    cleanedText = cleanedText.replace(/\d+\.\s*/g, '');
    
    // Remove patterns like "1) ", "2) ", "3) ", etc.
    cleanedText = cleanedText.replace(/\d+\)\s*/g, '');
    
    // Remove patterns like "• " or "- " at the beginning of lines
    cleanedText = cleanedText.replace(/^[•\-]\s*/gm, '');
    
    // Remove patterns like "Step 1:", "Step 2:", etc.
    cleanedText = cleanedText.replace(/Step\s+\d+:\s*/gi, '');
    
    // Remove patterns like "Action 1:", "Action 2:", etc.
    cleanedText = cleanedText.replace(/Action\s+\d+:\s*/gi, '');
    
    // Remove patterns like "Recommendation 1:", "Recommendation 2:", etc.
    cleanedText = cleanedText.replace(/Recommendation\s+\d+:\s*/gi, '');
    
    // Remove any remaining numbered patterns like "1st", "2nd", "3rd", etc.
    cleanedText = cleanedText.replace(/\d+(st|nd|rd|th)\s*/gi, '');
    
    // Remove patterns like "First:", "Second:", "Third:", etc.
    cleanedText = cleanedText.replace(/(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth):\s*/gi, '');
    
    // Clean up multiple spaces and line breaks
    cleanedText = cleanedText.replace(/\s+/g, ' ');
    cleanedText = cleanedText.replace(/\n\s*\n/g, '\n').trim();
    
    return cleanedText;
  };

  const generateWithAI = async (data, retryAttempt = 0) => {
    if (!data) return;
    
    const maxRetries = 2;
    const retryDelay = 3000; // 3 seconds
    
    try {
      const res = await apiFetch(apiConfig.endpoints.prescriptions, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskAnalysis: data.riskAnalysis, timeRange, selectedBarangay })
      });
      
      if (!res.ok) {
        if (res.status === 503 && retryAttempt < maxRetries) {
          // Retry for 503 errors
          console.log(`AI service overloaded, retrying in ${retryDelay/1000}s... (attempt ${retryAttempt + 1}/${maxRetries + 1})`);
          setAiError(`AI service is busy, retrying... (${retryAttempt + 1}/${maxRetries + 1})`);
          setTimeout(() => {
            generateWithAI(data, retryAttempt + 1);
          }, retryDelay);
          return;
        } else if (res.status === 503) {
          throw new Error('AI service is temporarily overloaded. Please try again in a few minutes.');
        } else if (res.status === 400) {
          throw new Error('Invalid request to AI service. Please check your data.');
        } else {
          throw new Error(`AI service error (${res.status}). Please try again later.`);
        }
      }
      
      const { interventions } = await res.json();
      if (Array.isArray(interventions) && interventions.length > 0) {
        // Process interventions to remove numbered lists
        const processedInterventions = interventions.map(intervention => {
          const originalIntervention = intervention.intervention;
          const cleanedIntervention = truncateSentences(removeNumberedLists(intervention.intervention), 3);
          
          // Debug logging to see the transformation
          if (originalIntervention !== cleanedIntervention) {
            console.log('Original:', originalIntervention);
            console.log('Cleaned:', cleanedIntervention);
          }
          
          return {
            ...intervention,
            reasoning: truncateSentences(removeNumberedLists(intervention.reasoning), 3),
            intervention: cleanedIntervention
          };
        });
        
        setAnalyticsData({ ...data, interventionRecommendations: processedInterventions });
        setAiError(''); // Clear any previous errors
        setRetryCount(0); // Reset retry count on success
      } else {
        setAiError('AI returned no recommendations. This might be due to insufficient data or service limitations.');
      }
    } catch (e) {
      console.error('AI Generation Error:', e);
      setAiError(e.message || 'Failed to generate AI recommendations. Please try again later.');
    }
  };

  const calculateRiskScores = (cases) => {
    const barangayData = {};
    
    sanJuanBarangays.forEach(barangay => {
      barangayData[barangay] = {
        totalCases: 0,
        severeCases: 0,
        moderateCases: 0,
        mildCases: 0,
        recentCases: 0,
        riskScore: 0,
        priority: 'low',
        factors: [],
        centerCounts: {},
        topCenter: null
      };
    });

    cases.forEach(case_ => {
      const barangay = case_.barangay;
      if (barangayData[barangay]) {
        barangayData[barangay].totalCases++;
        
        if (case_.severity === 'high') barangayData[barangay].severeCases++;
        else if (case_.severity === 'medium') barangayData[barangay].moderateCases++;
        else barangayData[barangay].mildCases++;

        const caseDate = new Date(case_.incidentDate);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (caseDate > weekAgo) {
          barangayData[barangay].recentCases++;
        }

        // Count by center (if present on the record)
        const centerName = case_.center || case_.healthCenter || case_.centerName || case_.facility || null;
        if (centerName) {
          if (!barangayData[barangay].centerCounts[centerName]) {
            barangayData[barangay].centerCounts[centerName] = 0;
          }
          barangayData[barangay].centerCounts[centerName]++;
        }
      }
    });

    Object.keys(barangayData).forEach(barangay => {
      const data = barangayData[barangay];
      const factors = [];
      let riskScore = 0;

      // Determine top center for focus within the barangay
      const centers = Object.entries(data.centerCounts);
      if (centers.length > 0) {
        centers.sort((a,b) => b[1] - a[1]);
        data.topCenter = centers[0][0];
      }

      // Risk scoring driven by counts per barangay
      if (data.totalCases >= 15) {
        factors.push('Very high case count (>=15)');
        riskScore += 45;
      } else if (data.totalCases >= 7) {
        factors.push('Elevated case count (>=7)');
        riskScore += 30;
      } else if (data.totalCases > 0) {
        factors.push('Cases present');
        riskScore += 15;
      }

      if (data.recentCases >= 5) {
        factors.push('Recent spike in cases');
        riskScore += 35;
      } else if (data.recentCases >= 2) {
        factors.push('Multiple recent cases');
        riskScore += 20;
      }

      if (data.severeCases > 0) {
        factors.push('Severe cases present');
        riskScore += 25;
      } else if (data.moderateCases >= 3) {
        factors.push('Several moderate cases');
        riskScore += 15;
      }

      const highDensityBarangays = ['Greenhills', 'Addition Hills', 'Kabayanan', 'Corazon de Jesus'];
      if (highDensityBarangays.includes(barangay)) {
        factors.push('High population density');
        riskScore += 20;
      }

      data.riskScore = Math.min(100, riskScore);
      data.factors = factors;

      if (data.riskScore >= 70) data.priority = 'high';
      else if (data.riskScore >= 40) data.priority = 'medium';
      else data.priority = 'low';
    });

    return barangayData;
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
          const res = await apiFetch(`${apiConfig.endpoints.accountStatus}/${encodeURIComponent(currentUser.email)}`);
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
        await apiFetch(apiConfig.endpoints.logout, {
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

  if (loading) {
    return (
      <div className="superadmin-prescriptive-container">
        <ResponsiveSidebar onSignOut={handleSignOut} />
        <main className="main-content">
          <div className="loading-container" aria-label="Loading analytics">
            <div className="responsive-loading"><div className="responsive-spinner"></div></div>
          </div>
        </main>
      </div>
    );
  }

  const summary = {
    total: analyticsData ? Object.values(analyticsData.riskAnalysis).filter(d => d.totalCases > 0).length : 0,
    highRisk: analyticsData ? Object.values(analyticsData.riskAnalysis).filter(d => d.priority === 'high').length : 0,
    mediumRisk: analyticsData ? Object.values(analyticsData.riskAnalysis).filter(d => d.priority === 'medium').length : 0,
    lowRisk: analyticsData ? Object.values(analyticsData.riskAnalysis).filter(d => d.priority === 'low').length : 0
  };

  return (
    <div className="superadmin-prescriptive-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      
      <main className="main-content">
        <div className="content-header">
          <h2>Prescriptive Analytics</h2>
          <div className="header-actions">
            <div className="filter-group">
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="form-control">
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className="filter-group">
              <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)} className="form-control">
                <option value="all">All Barangays</option>
                {sanJuanBarangays.map(barangay => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
            </div>
            {aiLoading && (
              <div className="ai-status-indicator loading">
                <span>⏳ AI Processing</span>
              </div>
            )}
            {aiError && (
              <div className="ai-status-indicator error">
                <span>❌ AI Error</span>
                <button 
                  className="retry-btn"
                  onClick={() => {
                    setAiError('');
                    setAiLoading(true);
                    generateWithAI(analyticsData);
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="content-body">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card" title="Barangays with any recorded cases in the selected period">
              <div className="card-icon" style={{ background: 'rgba(0, 123, 255, 0.1)' }}>
                <i className="fa-solid fa-chart-line" style={{ color: '#007bff' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Active Areas</div>
                <div className="card-value">{summary.total}</div>
              </div>
            </div>
            <div className="summary-card" title="Barangays assessed with HIGH priority risk based on recent/severe cases and totals">
              <div className="card-icon" style={{ background: 'rgba(255, 71, 87, 0.1)' }}>
                <i className="fa-solid fa-exclamation-triangle" style={{ color: '#ff4757' }} />
              </div>
              <div className="card-info">
                <div className="card-title">High Risk</div>
                <div className="card-value">{summary.highRisk}</div>
              </div>
            </div>
            <div className="summary-card" title="Barangays with MEDIUM priority risk level">
              <div className="card-icon" style={{ background: 'rgba(255, 165, 2, 0.1)' }}>
                <i className="fa-solid fa-clock" style={{ color: '#ffa502' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Medium Risk</div>
                <div className="card-value">{summary.mediumRisk}</div>
              </div>
            </div>
            <div className="summary-card" title="Barangays with LOW priority risk level">
              <div className="card-icon" style={{ background: 'rgba(46, 213, 115, 0.1)' }}>
                <i className="fa-solid fa-check-circle" style={{ color: '#2ed573' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Low Risk</div>
                <div className="card-value">{summary.lowRisk}</div>
              </div>
            </div>
          </div>

          {/* Interventions Section */}
          <div className="interventions-section">
            <div className="section-header">
              <h3>Prescriptive Analytics: Barangay Action Plans</h3>
              <p>
                🤖 AI-powered recommendations providing specific, actionable steps that barangay officials must implement based on current case data and risk assessment
              </p>
            </div>

            <div className="interventions-header">
              <div className="ih-grid">
                <span>Barangay</span>
                <span>Risk</span>
                <span>Total</span>
                <span>Recent</span>
                <span>Severe</span>
                <span>Priority</span>
                <span>📋 Prescriptive Recommendations</span>
              </div>
            </div>
            <div className="interventions-list">
              {aiError && (
                <div className="intervention-item" style={{ borderLeft: '5px solid #dc3545' }}>
                  <div className="intervention-row">
                    <div className="cell intervention-text" style={{ gridColumn: '1 / -1', justifyContent: 'flex-start' }}>
                      <div className="intervention-content">
                        <div className="reasoning-section">
                          <strong>⚠ AI SERVICE UNAVAILABLE</strong>
                          <p>{aiError}</p>
                          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
                            <strong>What you can do:</strong><br/>
                            • Wait a few minutes and try again<br/>
                            • Check your internet connection<br/>
                            • The AI service may be experiencing high traffic
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {analyticsData && analyticsData.interventionRecommendations.map((intervention, index) => (
                <div key={index} className={`intervention-item ${intervention.priority} ai-generated`}>
                  <div className="intervention-row">
                    <div className="cell barangay">{intervention.barangay}</div>
                    <div className="cell">{intervention.riskScore}/100</div>
                    <div className="cell">{intervention.totalCases}</div>
                    <div className="cell">{intervention.recentCases}</div>
                    <div className="cell">{intervention.severeCases}</div>
                    <div className="cell"><span className={`priority-pill ${intervention.priority}`}>{intervention.priority.toUpperCase()}</span></div>
                    <div className="cell intervention-text" style={{ gridColumn: '7 / 8' }}>
                      <div className="intervention-content">
                        <div className="reasoning-section">
                          <strong>📊 SITUATION ANALYSIS:</strong>
                          <p>{intervention.reasoning}</p>
                        </div>
                        <div className="intervention-section">
                          <strong>🎯 PRESCRIPTIVE RECOMMENDATIONS:</strong>
                          <p>{intervention.intervention}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Sign Out Modal */}
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

export default SuperAdminPrescriptiveAnalytics;


