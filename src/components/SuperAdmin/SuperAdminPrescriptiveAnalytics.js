import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedModal from '../UnifiedModal';
import { apiFetch, apiConfig } from '../../config/api';
import './SuperAdminPrescriptiveAnalytics.css';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import { fullLogout } from '../../utils/auth';

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
      // For admin users, lock the barangay selector to their assigned center/barangay
      try {
        const userCenter = getUserCenter();
        if (userCenter && userCenter !== 'all') {
          setSelectedBarangay(userCenter);
        }
      } catch (_) {}
    }
    fetchAnalyticsData();
  }, [timeRange, selectedBarangay]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setAiLoading(true);
    setAiError('');
    try {
      const res = await apiFetch(apiConfig.endpoints.prescriptiveAnalytics, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange, selectedBarangay })
      });
      if (!res.ok) {
        if (res.status === 404) {
          // Fallback: compute locally then call /api/prescriptions
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
      // Ensure we always have interventions; synthesize heuristics if missing/empty
      let data = json.data || { cases: [], riskAnalysis: {}, interventionRecommendations: [] };

      // Enforce role-based scoping for admins: only their assigned barangay
      try {
        const userCenter = getUserCenter();
        if (userCenter && userCenter !== 'all') {
          const target = String(userCenter).toLowerCase();
          const filteredRisk = Object.fromEntries(
            Object.entries(data.riskAnalysis || {}).filter(([b]) => String(b).toLowerCase() === target)
          );
          const filteredInterventions = (Array.isArray(data.interventionRecommendations) ? data.interventionRecommendations : [])
            .filter(it => String(it.barangay || '').toLowerCase() === target);
          data = {
            ...data,
            cases: Array.isArray(data.cases) ? data.cases.filter(c => String(c.barangay || '').toLowerCase() === target) : [],
            riskAnalysis: filteredRisk,
            interventionRecommendations: filteredInterventions
          };
        }
      } catch (_) {}
      let interventions = Array.isArray(data.interventionRecommendations) ? data.interventionRecommendations : [];
      if (interventions.length === 0) {
        const heuristics = buildHeuristicInterventions(data.riskAnalysis);
        interventions = heuristics;
      }
      // Enforce 3–4 sentence recommendations and analyses
      const enriched = interventions.map((it) => ({
        ...it,
        intervention: ensureRecommendationLength(it.intervention, it.priority, it.barangay, it.coordinationRequired, { total: it.totalCases, recent: it.recentCases, severe: it.severeCases, risk: it.riskScore }),
        reasoning: ensureAnalysisLength(it.reasoning, it.barangay, it.totalCases, it.recentCases, it.severeCases, it.priority, it.ageGroupFocus, it.timePattern, it.coordinationRequired)
      }));
      setAnalyticsData({ ...data, interventionRecommendations: enriched });
      setAiError('');
    } catch (error) {
      console.error('Error fetching prescriptive analytics:', error);
      // Network/CORS or other failure: try client-side fallback flow
      try {
        await clientSideFallbackFlow();
        setAiError('');
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setAiError(error.message || 'Failed to fetch prescriptive analytics');
        setAnalyticsData({ cases: [], riskAnalysis: {}, interventionRecommendations: [] });
      }
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  // Build heuristic interventions from a riskAnalysis object
  const buildHeuristicInterventions = (riskAnalysis = {}) => {
    try {
      return Object.entries(riskAnalysis)
        .filter(([, d]) => (d?.totalCases || 0) > 0) // Only show barangays with cases
        .map(([barangay, d]) => ({
          barangay,
          riskScore: d.riskScore || 0,
          priority: d.priority || 'low',
          reasoning: buildAnalysisParagraph(barangay, d),
          intervention: ensureRecommendationLength('', d.priority || 'low', barangay, d.topCenter, { total: d.totalCases, recent: d.recentCases, severe: d.severeCases, risk: d.riskScore }),
          totalCases: d.totalCases || 0,
          recentCases: d.recentCases || 0,
          severeCases: d.severeCases || 0,
          ageGroupFocus: '',
          timePattern: '',
          resourceNeeds: d.priority === 'high' ? 'Additional vaccines, ERIG, 2 nurses, 1 physician' : 'Routine supplies',
          coordinationRequired: d.topCenter ? `Coordinate with ${d.topCenter}` : 'Coordinate with nearest health center'
        }))
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
    } catch (_) {
      return [];
    }
  };

  // Ensure recommendation text is at least 3 sentences by appending a standard plan
  const ensureRecommendationLength = (text = '', priority = 'low', barangay = '', coord = '', metrics = { total:0, recent:0, severe:0, risk:0 }) => {
    const sentenceCount = (String(text).match(/[.!?]+\s/g) || []).length + (text.endsWith('.') ? 1 : 0);
    if (sentenceCount >= 3 && text.trim()) return text;
    const plan = buildPriorityPlan(priority, barangay, coord, metrics);
    if (!text || !text.trim()) return plan;
    return (text.trim().endsWith('.') ? text.trim() : text.trim() + '.') + ' ' + plan;
  };

  const randFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const buildPriorityPlan = (priority, barangay, coord, metrics = { total:0, recent:0, severe:0, risk:0 }) => {
    const coordLine = coord && coord !== 'Coordinate with nearest health center' ? `${coord}.` : 'Coordinate with the nearest health center.';
    const { total = 0, recent = 0, severe = 0, risk = 0 } = metrics || {};
    const surge = recent >= Math.max(2, Math.round(total * 0.25));
    const severityFocus = severe > 0 ? 'Prioritize Category III exposures; ensure ERIG availability and trained staff for infiltration.' : 'Maintain readiness for potential severe exposures; refresh staff on ERIG protocols.';
    if (priority === 'high') {
      const openers = [
        `Deploy a mobile vaccination team in ${barangay} within 48 hours`,
        `Stand up a pop‑up ARV clinic in ${barangay} within two days`,
        `Activate surge operations for ${barangay} and mobilize a field team`
      ];
      const surgeOps = surge
        ? randFrom([
            'Extend clinic hours for the next 7 days to absorb the current surge; perform daily line‑listing and follow‑ups.',
            'Run a 1‑week intensified campaign with daily monitoring and quick home visits for defaulters.',
            'Implement weekend operations and daily case reviews until the surge subsides.'
          ])
        : randFrom([
            'Add two extra clinic days this week to clear backlog and conduct home visits for defaulters.',
            'Schedule mid‑week and weekend sessions to accommodate working households.',
            'Run a 3‑day micro‑campaign to sweep missed patients.'
          ]);
      const stock = `Ensure cold‑chain checks and pre‑position supplies based on ${total} total and ${recent} recent cases (risk ${risk}).`;
      return `${randFrom(openers)} at the barangay hall. ${severityFocus} ${surgeOps} ${stock} ${coordLine}`;
    }
    if (priority === 'medium') {
      const plan = randFrom([
        `Schedule an additional vaccination day in ${barangay} next week and publish clear triage/queueing instructions.`,
        `Open an overflow clinic half‑day in ${barangay} and streamline triage for faster throughput.`,
        `Designate a fast‑track lane in ${barangay} for follow‑ups to reduce waiting time.`
      ]);
      return `${plan} ${severityFocus} Run information drives via barangay channels focused on bite prevention and defaulter tracing. Verify stock and prepare ${Math.max(10, recent * 2)} ARV doses and ERIG contingency; line‑list ${recent} recent patients for follow‑up. ${coordLine}`;
    }
    // For low priority (including 0 cases), provide preventive measures
    const lowOps = randFrom([
      `Maintain routine vaccination services in ${barangay} with weekly IEC reminders through barangay channels.`,
      `Keep routine services steady in ${barangay} and circulate monthly IEC through schools and barangay pages.`,
      `Sustain baseline ARV services in ${barangay} and run brief IEC during clinic hours.`
    ]);
    return `${lowOps} Conduct quarterly school/community IEC with emphasis on wound washing and early consultation. Review stock minimums and keep at least ${Math.max(10, Math.ceil(total/2)+5)} ARV doses; monitor trends for any uptick. ${coordLine}`;
  };

  // Ensure analysis text reaches 3–5 sentences by building an explanatory paragraph
  const ensureAnalysisLength = (text = '', barangay = '', total = 0, recent = 0, severe = 0, priority = 'low', ageGroup = '', timePattern = '', coord = '') => {
    const count = (String(text).match(/[.!?]+\s/g) || []).length + (text.endsWith('.') ? 1 : 0);
    if (count >= 3 && text.trim()) return text;
    return buildAnalysisParagraph(barangay, { totalCases: total, recentCases: recent, severeCases: severe, priority, ageGroup, timePattern, topCenter: coord });
  };

  const buildAnalysisParagraph = (barangay, d = {}) => {
    const total = d.totalCases || 0;
    const recent = d.recentCases || 0;
    const severe = d.severeCases || 0;
    const priority = (d.priority || 'low').toLowerCase();
    const ageGroup = d.ageGroup || d.ageGroupFocus || '';
    const timePattern = d.timePattern || '';
    const center = d.topCenter ? ` Cases appear to cluster around ${d.topCenter}.` : '';
    
    if (total === 0) {
      return `In ${barangay}, no cases have been reported in the current period, indicating a low-risk area. This suggests effective prevention measures or limited animal exposure. Continue routine surveillance and maintain baseline vaccination capacity. Overall priority is ${priority.toUpperCase()} based on the absence of reported incidents.`;
    }
    
    const trend = recent >= Math.max(2, Math.round(total * 0.25)) ? 'a recent uptick' : 'stable activity';
    const severityLine = severe > 0 ? ` ${severe} severe exposure${severe > 1 ? 's' : ''} were recorded, elevating risk.` : ' No severe exposures were recorded in the current window.';
    const patternLine = timePattern ? ` Incidents tend to occur during ${timePattern.toLowerCase()}.` : '';
    const ageLine = ageGroup ? ` The most affected age group is ${ageGroup}.` : '';
    const priorityLine = ` Overall priority is ${priority.toUpperCase()} based on volume and recency.`;
    return `In ${barangay}, there are ${total} total reported cases with ${recent} occurring in the recent period, indicating ${trend}.${severityLine}${patternLine}${ageLine}${center} ${priorityLine}`;
  };

  // Fallback path used when server doesn't have /api/prescriptive-analytics yet (404)
  const clientSideFallbackFlow = async () => {
    try {
      console.log('Running client-side fallback flow...');
      const userCenter = getUserCenter();
      console.log('🔍 ANALYTICS DEBUG: Loading analytics for center:', userCenter);
      
      const casesRes = await apiFetch(apiConfig.endpoints.bitecases);
      const raw = await casesRes.json();
      console.log('Raw cases response:', raw);
      const allCases = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.cases)
            ? raw.cases
            : [];
      console.log('Total cases before filtering:', allCases.length);
      
      // Apply client-side filtering for admin users
      const cases = filterByCenter(allCases, 'center');
      console.log('🔍 ANALYTICS DEBUG: Filtered cases for center:', cases.length);

      // Optional center filtering (mirrors previous client logic)
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
      console.log('Processed analytics data:', processedData);
      setAnalyticsData(processedData);
      
      // Get interventions from existing backend endpoint
      try {
        const presRes = await apiFetch(apiConfig.endpoints.prescriptions, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ riskAnalysis: processedData.riskAnalysis, timeRange, selectedBarangay })
        });
        if (presRes.ok) {
          const { interventions } = await presRes.json();
          console.log('AI interventions received:', interventions);
          if (Array.isArray(interventions)) {
            setAnalyticsData({ ...processedData, interventionRecommendations: interventions });
            setAiError('');
          }
        } else {
          console.log('AI service failed, using heuristic fallback');
          // Generate basic heuristic interventions
          const heuristicInterventions = Object.entries(processedData.riskAnalysis)
            .filter(([_, data]) => data.totalCases > 0) // Only show barangays with cases
            .map(([barangay, data]) => ({
              barangay,
              riskScore: data.riskScore,
              priority: data.priority,
              reasoning: data.factors.join('; ') || 'Automated analysis based on case data.',
              intervention: data.priority === 'high' 
                ? 'Deploy mobile vaccination team; intensify risk communication; ensure ERIG availability.'
                : data.priority === 'medium'
                  ? 'Conduct barangay info drive; schedule additional vaccination day; monitor stocks.'
                  : 'Maintain routine surveillance and education; ensure baseline vaccine availability.',
              totalCases: data.totalCases,
              recentCases: data.recentCases,
              severeCases: data.severeCases,
              ageGroupFocus: '',
              timePattern: '',
              resourceNeeds: data.priority === 'high' ? 'Additional vaccines, ERIG, 2 nurses, 1 physician' : 'Routine supplies',
              coordinationRequired: data.topCenter ? `Coordinate with ${data.topCenter}` : 'Coordinate with nearest health center'
            }))
            .sort((a, b) => b.riskScore - a.riskScore);
          
          console.log('Generated heuristic interventions:', heuristicInterventions);
          setAnalyticsData({ ...processedData, interventionRecommendations: heuristicInterventions });
          setAiError('');
        }
      } catch (e) {
        console.warn('Fallback AI fetch failed:', e);
        // Generate basic heuristic interventions even if AI completely fails
        const heuristicInterventions = Object.entries(processedData.riskAnalysis)
          .filter(([_, data]) => data.totalCases > 0)
          .map(([barangay, data]) => ({
            barangay,
            riskScore: data.riskScore,
            priority: data.priority,
            reasoning: data.factors.join('; ') || 'Automated analysis based on case data.',
            intervention: data.priority === 'high' 
              ? 'Deploy mobile vaccination team; intensify risk communication; ensure ERIG availability.'
              : data.priority === 'medium'
                ? 'Conduct barangay info drive; schedule additional vaccination day; monitor stocks.'
                : 'Maintain routine surveillance and education; ensure baseline vaccine availability.',
            totalCases: data.totalCases,
            recentCases: data.recentCases,
            severeCases: data.severeCases,
            ageGroupFocus: '',
            timePattern: '',
            resourceNeeds: data.priority === 'high' ? 'Additional vaccines, ERIG, 2 nurses, 1 physician' : 'Routine supplies',
            coordinationRequired: data.topCenter ? `Coordinate with ${data.topCenter}` : 'Coordinate with nearest health center'
          }))
          .sort((a, b) => b.riskScore - a.riskScore);
        
        console.log('Generated heuristic interventions (AI failed):', heuristicInterventions);
        setAnalyticsData({ ...processedData, interventionRecommendations: heuristicInterventions });
        setAiError('AI service unavailable; showing heuristic recommendations.');
      }
    } catch (e) {
      console.error('Fallback flow failed:', e);
      throw e;
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

    const finalCases = (() => {
      const userCenter = getUserCenter();
      if (userCenter && userCenter !== 'all') {
        // Admins: strictly restrict to their barangay/center
        return filteredCases.filter(case_ => String(case_.barangay || '').toLowerCase() === String(userCenter).toLowerCase());
      }
      // Superadmin: honor UI selection
      return selectedBarangay === 'all' 
        ? filteredCases 
        : filteredCases.filter(case_ => case_.barangay === selectedBarangay);
    })();

    const riskAnalysis = calculateRiskScores(finalCases);

    return {
      cases: finalCases,
      riskAnalysis,
      interventionRecommendations: [] // Will be populated by AI
    };
  };

  // Client-side AI generation removed; handled by server

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

      // WHO-based risk scoring with exposure category weighting
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

      // WHO Category III exposures (highest risk) - require immediate PEP
      if (data.category3Cases > 0) {
        factors.push(`Category III exposures present (${data.category3Cases}) - immediate PEP required`);
        riskScore += 40;
      }

      // WHO Category II exposures (moderate risk) - require vaccination
      if (data.category2Cases > 0) {
        factors.push(`Category II exposures present (${data.category2Cases}) - vaccination required`);
        riskScore += 25;
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
      setShowSignoutModal(false); // Close modal immediately
      await fullLogout(apiFetch);
    } catch (error) {
      console.error('Signout error:', error);
      setShowSignoutModal(false); // Close modal even on error
      await fullLogout(); // Fallback to basic logout
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
              </select>
            </div>
            <div className="filter-group">
              {getUserCenter() === 'all' ? (
                <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)} className="form-control">
                  <option value="all">All Barangays</option>
                  {sanJuanBarangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              ) : (
                <select value={selectedBarangay} disabled className="form-control">
                  <option value={selectedBarangay}>{selectedBarangay}</option>
                </select>
              )}
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
                    fetchAnalyticsData();
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
                 AI-powered recommendations providing specific, actionable steps that barangay officials must implement based on current case data and risk assessment
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


