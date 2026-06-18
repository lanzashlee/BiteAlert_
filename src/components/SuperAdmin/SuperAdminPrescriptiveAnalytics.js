import React, { useEffect, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedModal from '../UnifiedModal';
import { apiFetch, apiConfig } from '../../config/api';
import './SuperAdminPrescriptiveAnalytics.css';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import { fullLogout } from '../../utils/auth';
import { generatePrescriptions } from '../../utils/prescriptionEngine';

const SuperAdminPrescriptiveAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [availableCenters, setAvailableCenters] = useState([]);
  const [centersLoaded, setCentersLoaded] = useState(false);

  useEffect(() => {
    try {
      const userCenter = getUserCenter();
        if (userCenter && userCenter !== 'all') {
          setSelectedBarangay(userCenter);
        }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await apiFetch(apiConfig.endpoints.centers);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        const activeCenters = Array.from(new Set((list || [])
          .filter(c => !c.isArchived)
          .map(c => String(c.centerName || c.name || '').trim())
          .filter(Boolean)))
          .sort((a, b) => a.localeCompare(b));
        setAvailableCenters(activeCenters);
      } catch (error) {
        console.error('Error fetching centers:', error);
        setAvailableCenters([]);
      } finally {
        setCentersLoaded(true);
      }
    };
    fetchCenters();
  }, []);

  useEffect(() => {
    if (!centersLoaded) return;
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedBarangay, centersLoaded]);

  const buildSummariesFromRiskAnalysis = (riskAnalysis = {}) =>
    Object.entries(riskAnalysis).map(([barangay, d]) => ({
      barangay,
      totalCases: d.totalCases || 0,
      recentCases: d.recentCases || 0,
      severeCases: d.severeCases || 0,
      riskScore: d.riskScore || 0,
      priority: d.priority || 'low',
      factors: d.factors || [],
      topCenter: d.topCenter || null,
      category3Cases: d.category3Cases || 0,
      category2Cases: d.category2Cases || 0,
      category1Cases: d.category1Cases || 0,
      trendAnalysis: {
        recentCases: d.recentCases || 0,
        olderCases: Math.max(0, (d.totalCases || 0) - (d.recentCases || 0)),
        trendDirection: (d.recentCases || 0) >= Math.max(2, Math.round((d.totalCases || 0) * 0.25)) ? 'increasing' : 'stable',
        spikeDetected: (d.recentCases || 0) >= 5
      }
    }));

  const scopeAnalyticsData = (data) => {
    try {
      const userCenter = getUserCenter();
      if (userCenter && userCenter !== 'all') {
        const normScope = (v) => String(v || '')
          .toLowerCase()
          .replace(/\s*health\s*center$/i, '')
          .replace(/\s*center$/i, '')
          .replace(/-/g, ' ')
          .trim();
        const target = normScope(userCenter);
        const filteredRisk = Object.fromEntries(
          Object.entries(data.riskAnalysis || {}).filter(([b]) => normScope(b) === target)
        );
        const filteredInterventions = (Array.isArray(data.interventionRecommendations) ? data.interventionRecommendations : [])
          .filter(it => normScope(it.barangay) === target);
        return {
          ...data,
          cases: Array.isArray(data.cases) ? data.cases.filter(c => normScope(c.barangay) === target) : [],
          riskAnalysis: filteredRisk,
          interventionRecommendations: filteredInterventions
        };
      }
    } catch (_) {}
    return data;
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      const res = await apiFetch(apiConfig.endpoints.prescriptiveAnalytics, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange, selectedBarangay }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        if (res.status === 404) {
          await clientSideFallbackFlow();
          return;
        }
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      const json = await res.json();
      if (!json?.success || !json?.data) {
        throw new Error('Invalid response from prescriptive analytics');
      }
      let data = json.data || { cases: [], riskAnalysis: {}, interventionRecommendations: [] };
      data = scopeAnalyticsData(data);

      let interventions = Array.isArray(data.interventionRecommendations) ? data.interventionRecommendations : [];
      if (interventions.length === 0) {
        interventions = generatePrescriptions(buildSummariesFromRiskAnalysis(data.riskAnalysis));
      }
      setAnalyticsData({ ...data, interventionRecommendations: interventions });
    } catch (error) {
      console.error('Error fetching prescriptive analytics:', error);
      try {
        await clientSideFallbackFlow();
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setAnalyticsData({ cases: [], riskAnalysis: {}, interventionRecommendations: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  const clientSideFallbackFlow = async () => {
    const casesRes = await apiFetch(apiConfig.endpoints.bitecases);
    const raw = await casesRes.json();
    const allCases = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.cases)
          ? raw.cases
          : [];

    const cases = filterByCenter(allCases, 'center');

    let validCentersSet = null;
    try {
      const centersRes = await apiFetch(apiConfig.endpoints.centers);
      const centersJson = await centersRes.json();
      const centers = Array.isArray(centersJson) ? centersJson : (centersJson?.data || centersJson?.centers || []);
      const norm = (v) => String(v || '')
        .toLowerCase()
        .replace(/\s*health\s*center$/i, '')
        .replace(/\s*center$/i, '')
        .replace(/-/g, ' ')
        .trim();
      validCentersSet = new Set((centers || [])
        .filter(c => !c.isArchived)
        .map(c => norm(c.centerName || c.name))
        .filter(Boolean));
    } catch (_) {}

    const normalized = normalizeCases(cases).map(c => ({
      ...c,
      centerNorm: String(c.center || '')
        .toLowerCase()
        .replace(/\s*health\s*center$/i, '')
        .replace(/\s*center$/i, '')
        .replace(/-/g, ' ')
        .trim()
    }));
    const filteredByCenter = validCentersSet
      ? normalized.filter(c => validCentersSet.has(c.centerNorm) || validCentersSet.has(String(c.barangay || '').toLowerCase()))
      : normalized;

    const processedData = processAnalyticsData(filteredByCenter.map(({ centerNorm, ...rest }) => rest));
    const summaries = buildSummariesFromRiskAnalysis(processedData.riskAnalysis);
    const interventions = generatePrescriptions(summaries);
    setAnalyticsData(scopeAnalyticsData({ ...processedData, interventionRecommendations: interventions }));
  };

  const inferBarangayFromText = (text) => {
    if (!text) return null;
    const hay = String(text).toLowerCase();
    const match = availableCenters.find(b => hay.includes(b.toLowerCase()));
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
      const mgmtCategory = Array.isArray(c.management?.category) ? c.management.category[0] : c.management?.category;
      const raw = String(c.exposureCategory || mgmtCategory || c.category || '').toUpperCase();
      if (raw.includes('III') || raw === '3' || raw.includes('CATEGORY 3')) return 'high';
      if (raw.includes('II') || raw === '2' || raw.includes('CATEGORY 2')) return 'medium';
      const exposureType = (c.exposureType || '').toString();
      if (exposureType === '3') return 'high';
      if (exposureType === '2') return 'medium';
      return 'low';
    };
    return cases.map((c) => {
      const incidentDate = coerceDate(c.incidentDate || c.exposureDate || c.dateRegistered || c.createdAt || c.updatedAt);
      const severity = c.severity || mapSeverity(c);
      const center = c.center || c.centerName || c.healthCenter || c.facility || c.treatmentCenter || null;
      const barangayDirect = c.barangay || c.addressBarangay || c.patientBarangay || c.locationBarangay || c.barangayName || null;
      const addressBlob = c.address || c.patientAddress || c.location || c.addressString || c.fullAddress || '';
      const barangay = barangayDirect || inferBarangayFromText(addressBlob);
      const exposureCategory = (c.exposureCategory || '').toString().toUpperCase();
      const exposureType = (c.exposureType || '').toString();
      return { incidentDate, severity, center, barangay, exposureCategory, exposureType };
    }).filter(c => !!c.incidentDate && !!c.barangay);
  };

  const processAnalyticsData = (cases) => {
    const now = new Date();
    const timeRangeMap = { week: 7, month: 30, quarter: 90, year: 365, all: Infinity };
    const daysBack = timeRangeMap[timeRange] || 30;
    const filteredCases = cases.filter(case_ => {
      if (daysBack === Infinity) return true;
      const caseDate = new Date(case_.incidentDate);
      return (now - caseDate) <= (daysBack * 24 * 60 * 60 * 1000);
    });

    // Normalizer for comparing barangay/center names
    const normForCompare = (v) => String(v || '')
      .toLowerCase()
      .replace(/\s*health\s*center$/i, '')
      .replace(/\s*center$/i, '')
      .replace(/-/g, ' ')
      .trim();

    const finalCases = (() => {
      const userCenter = getUserCenter();
      if (userCenter && userCenter !== 'all') {
        const normTarget = normForCompare(userCenter);
        return filteredCases.filter(case_ => normForCompare(case_.barangay) === normTarget);
      }
      if (selectedBarangay === 'all') return filteredCases;
      const normTarget = normForCompare(selectedBarangay);
      return filteredCases.filter(case_ => normForCompare(case_.barangay) === normTarget);
    })();

    const riskAnalysis = calculateRiskScores(finalCases);

    return {
      cases: finalCases,
      riskAnalysis,
      interventionRecommendations: []
    };
  };

  const calculateRiskScores = (cases) => {
    const barangayData = {};
    const centersToProcess = availableCenters.length > 0 ? availableCenters : ['All Centers'];

    // Normalizer: strip "health center" / "center" suffix, lowercase, collapse whitespace/hyphens
    const normName = (v) => String(v || '')
      .toLowerCase()
      .replace(/\s*health\s*center$/i, '')
      .replace(/\s*center$/i, '')
      .replace(/-/g, ' ')
      .trim();

    centersToProcess.forEach(barangay => {
      barangayData[barangay] = {
        totalCases: 0,
        severeCases: 0,
        moderateCases: 0,
        mildCases: 0,
        recentCases: 0,
        category1Cases: 0,
        category2Cases: 0,
        category3Cases: 0,
        riskScore: 0,
        priority: 'low',
        factors: [],
        centerCounts: {},
        topCenter: null
      };
    });

    // Build a lookup from normalized center name -> original key for fuzzy matching
    const normToKey = {};
    centersToProcess.forEach(key => {
      normToKey[normName(key)] = key;
    });

    // Find the matching bucket key for a given case barangay value
    const findBucketKey = (caseBarangay) => {
      // 1. Exact match
      if (barangayData[caseBarangay]) return caseBarangay;
      // 2. Normalized match
      const normCase = normName(caseBarangay);
      if (normToKey[normCase]) return normToKey[normCase];
      // 3. Substring / includes match (e.g. "Salapan" matches "Salapan Center")
      for (const [normKey, originalKey] of Object.entries(normToKey)) {
        if (normKey.includes(normCase) || normCase.includes(normKey)) {
          return originalKey;
        }
      }
      return null;
    };

    cases.forEach(case_ => {
      const bucketKey = findBucketKey(case_.barangay);
      if (bucketKey) {
        barangayData[bucketKey].totalCases++;

        if (case_.severity === 'high') barangayData[bucketKey].severeCases++;
        else if (case_.severity === 'medium') barangayData[bucketKey].moderateCases++;
        else barangayData[bucketKey].mildCases++;

        if (case_.exposureCategory === 'III' || case_.exposureType === '3') {
          barangayData[bucketKey].category3Cases++;
        } else if (case_.exposureCategory === 'II' || case_.exposureType === '2') {
          barangayData[bucketKey].category2Cases++;
        } else if (case_.exposureCategory === 'I' || case_.exposureType === '1') {
          barangayData[bucketKey].category1Cases++;
        }

        const caseDate = new Date(case_.incidentDate);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (caseDate > weekAgo) {
          barangayData[bucketKey].recentCases++;
        }

        const centerName = case_.center || case_.healthCenter || case_.centerName || case_.facility || null;
        if (centerName) {
          if (!barangayData[bucketKey].centerCounts[centerName]) {
            barangayData[bucketKey].centerCounts[centerName] = 0;
          }
          barangayData[bucketKey].centerCounts[centerName]++;
        }
      }
    });

    Object.keys(barangayData).forEach(barangay => {
      const data = barangayData[barangay];
      const factors = [];

      const centers = Object.entries(data.centerCounts);
      if (centers.length > 0) {
        centers.sort((a, b) => b[1] - a[1]);
        data.topCenter = centers[0][0];
      }

      // 1) Determine severity tier from case count (DOH tiers)
      //    Low: 0-5, Medium: 6-15, High: 16+
      let severity;
      if (data.totalCases >= 16) {
        severity = 'high';
        factors.push('Very high case count (>=16)');
      } else if (data.totalCases >= 6) {
        severity = 'medium';
        factors.push('Elevated case count (6-15)');
      } else if (data.totalCases > 0) {
        severity = 'low';
        factors.push('Cases present');
      } else {
        severity = 'low';
      }

      // 2) Compute a factor sub-score (0 to 1) to place within the tier range
      let factorScore = 0;
      const maxFactorScore = 11; // sum of all possible factor points below

      // Category III exposures (max 3 pts)
      if (data.category3Cases >= 3) {
        factors.push(`Category III exposures present (${data.category3Cases}) - immediate PEP required`);
        factorScore += 3;
      } else if (data.category3Cases > 0) {
        factors.push(`Category III exposures present (${data.category3Cases}) - immediate PEP required`);
        factorScore += 2;
      }

      // Category II exposures (max 2 pts)
      if (data.category2Cases >= 3) {
        factors.push(`Category II exposures present (${data.category2Cases}) - vaccination required`);
        factorScore += 2;
      } else if (data.category2Cases > 0) {
        factors.push(`Category II exposures present (${data.category2Cases}) - vaccination required`);
        factorScore += 1;
      }

      // Recent cases (max 3 pts)
      if (data.recentCases >= 5) {
        factors.push('Recent spike in cases');
        factorScore += 3;
      } else if (data.recentCases >= 2) {
        factors.push('Multiple recent cases');
        factorScore += 2;
      } else if (data.recentCases > 0) {
        factorScore += 1;
      }

      // Severe cases (max 2 pts)
      if (data.severeCases > 0) {
        factors.push('Severe cases present');
        factorScore += 2;
      } else if (data.moderateCases >= 3) {
        factors.push('Several moderate cases');
        factorScore += 1;
      }

      // High population density (max 1 pt)
      const highDensityBarangays = ['Greenhills', 'Addition Hills', 'Kabayanan', 'Corazon de Jesus'];
      if (highDensityBarangays.includes(barangay)) {
        factors.push('High population density');
        factorScore += 1;
      }

      // 3) Map sub-score into the severity tier's score range
      //    Low: 1–33, Medium: 34–66, High: 67–100
      const normalized = maxFactorScore > 0 ? factorScore / maxFactorScore : 0;
      let rangeMin, rangeMax;
      if (severity === 'high') { rangeMin = 67; rangeMax = 100; }
      else if (severity === 'medium') { rangeMin = 34; rangeMax = 66; }
      else { rangeMin = 1; rangeMax = 33; }

      data.riskScore = data.totalCases === 0 ? 0 : Math.max(rangeMin, Math.round(rangeMin + normalized * (rangeMax - rangeMin)));
      data.factors = factors;
      data.priority = severity;
    });

    return barangayData;
  };

  const handleSignOut = () => {
    setShowSignoutModal(true);
  };

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

  if (loading) {
    return (
      <div className="superadmin-prescriptive-container">
        <ResponsiveSidebar onSignOut={handleSignOut} />
        <main className="main-content">
          <UnifiedSpinner text="Loading analytics..." />
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
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="filter-group">
              {getUserCenter() === 'all' ? (
                <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)} className="form-control">
                  <option value="all">All Centers</option>
                  {availableCenters.map(center => (
                    <option key={center} value={center}>{center}</option>
                  ))}
                </select>
              ) : (
                <select value={selectedBarangay} disabled className="form-control">
                  <option value={selectedBarangay}>{selectedBarangay}</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="content-body">
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
            <div className="summary-card" title="Barangays with 16+ cases (HIGH severity, score 67–100)">
              <div className="card-icon" style={{ background: 'rgba(255, 71, 87, 0.1)' }}>
                <i className="fa-solid fa-exclamation-triangle" style={{ color: '#ff4757' }} />
              </div>
              <div className="card-info">
                <div className="card-title">High Risk</div>
                <div className="card-value">{summary.highRisk}</div>
              </div>
            </div>
            <div className="summary-card" title="Barangays with 6–15 cases (MEDIUM severity, score 34–66)">
              <div className="card-icon" style={{ background: 'rgba(255, 165, 2, 0.1)' }}>
                <i className="fa-solid fa-clock" style={{ color: '#ffa502' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Medium Risk</div>
                <div className="card-value">{summary.mediumRisk}</div>
              </div>
            </div>
            <div className="summary-card" title="Barangays with 0–5 cases (LOW severity, score 1–33)">
              <div className="card-icon" style={{ background: 'rgba(46, 213, 115, 0.1)' }}>
                <i className="fa-solid fa-check-circle" style={{ color: '#2ed573' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Low Risk</div>
                <div className="card-value">{summary.lowRisk}</div>
              </div>
            </div>
          </div>

          <div className="interventions-section">
            <div className="interventions-header">
              <div className="ih-grid">
                <span>Barangay</span>
                <span>Risk</span>
                <span>Total</span>
                <span>Recent</span>
                <span>Severe</span>
                <span>Severity</span>
                <span>📋 Prescriptive Recommendations</span>
              </div>
            </div>
            <div className="interventions-list">
              {analyticsData && analyticsData.interventionRecommendations.map((intervention, index) => (
                <div key={index} className={`intervention-item ${intervention.priority} prescription-generated`}>
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
