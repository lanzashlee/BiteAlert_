/**
 * Rule-based prescriptive analytics engine aligned with DOH rabies PEP guidelines.
 * Generates context-aware recommendations per barangay without AI.
 */

const SEVERITY_TIERS = ['low', 'medium', 'high'];

/** DOH case-count severity tiers: Low 0–5, Medium 6–15, High 16–30+ */
const SEVERITY_THRESHOLDS = { LOW_MAX: 5, MEDIUM_MAX: 15, HIGH_MIN: 16 };

const classifySeverity = (summary = {}) => {
  const total = Number(summary.totalCases) || 0;
  if (total >= SEVERITY_THRESHOLDS.HIGH_MIN) return 'high';
  if (total > SEVERITY_THRESHOLDS.LOW_MAX) return 'medium';
  return 'low';
};

const severityTierLabel = (totalCases = 0, priority = 'low') => {
  const total = Number(totalCases) || 0;
  if (priority === 'high') return `HIGH (${total} cases; DOH tier 16–30)`;
  if (priority === 'medium') return `MEDIUM (${total} cases; DOH tier 6–15)`;
  return `LOW (${total} cases; DOH tier 0–5)`;
};

const hashString = (str) => {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const getDominantAgeGroup = (ageDistribution = {}) => {
  const entries = Object.entries(ageDistribution).filter(([, v]) => v > 0);
  if (entries.length === 0) return '';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
};

const getPeakDayOfWeek = (weekly = {}) => {
  const entries = Object.entries(weekly).filter(([, v]) => v > 0);
  if (entries.length === 0) return '';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
};

const computeTrendMetrics = (trendAnalysis = {}, summary = {}) => {
  const total = summary.totalCases || 0;
  const recent = trendAnalysis.recentCases ?? summary.recentCases ?? 0;
  const older = trendAnalysis.olderCases ?? Math.max(0, total - recent);
  const growthRate = older > 0 ? recent / older : recent;
  const spikeDetected = !!trendAnalysis.spikeDetected;
  const trendDirection = trendAnalysis.trendDirection || (recent > older ? 'increasing' : recent < older ? 'decreasing' : 'stable');
  const isSurge = spikeDetected || recent >= Math.max(2, Math.round(total * 0.25));
  const isDeclining = trendDirection === 'decreasing' && !isSurge;
  const isStable = !isSurge && !isDeclining && trendDirection !== 'increasing';
  const isIncreasing = trendDirection === 'increasing' || isSurge;
  return { growthRate, isSurge, isDeclining, isStable, isIncreasing, recent, older, trendDirection };
};

const buildContext = (summary = {}) => {
  const totalCases = summary.totalCases || 0;
  const recentCases = summary.recentCases || 0;
  const severeCases = summary.severeCases || 0;
  const category3Cases = summary.category3Cases || summary.severityBreakdown?.high || 0;
  const category2Cases = summary.category2Cases || summary.severityBreakdown?.medium || 0;
  const category1Cases = summary.category1Cases || summary.severityBreakdown?.low || 0;
  const trend = computeTrendMetrics(summary.trendAnalysis || {}, summary);
  const dominantAgeGroup = getDominantAgeGroup(summary.ageDistribution);
  const peakDayOfWeek = getPeakDayOfWeek(summary.timePatterns?.weekly);
  const priority = classifySeverity(summary);
  const barangay = summary.barangay || 'Unknown';
  const topCenter = summary.topCenter || null;
  const coord = topCenter ? `Coordinate with ${topCenter}` : 'Coordinate with the nearest health center';
  const riskScore = Number(summary.riskScore) || 0;

  const tags = new Set();
  if (totalCases === 0) tags.add('zero_cases');
  if (totalCases >= 15) tags.add('very_high_volume');
  else if (totalCases >= 7) tags.add('elevated_volume');
  else if (totalCases > 0) tags.add('low_volume');
  if (category3Cases > 0) tags.add('category3');
  if (category2Cases > 0) tags.add('category2');
  if (severeCases > 0) tags.add('severe_present');
  if (trend.isSurge) tags.add('surge');
  if (trend.isIncreasing) tags.add('increasing');
  if (trend.isDeclining) tags.add('declining');
  if (trend.isStable) tags.add('stable');
  if (dominantAgeGroup === '0-12' || dominantAgeGroup === '13-18') tags.add('school_age');
  if (dominantAgeGroup === '60+') tags.add('elderly_focus');
  if (peakDayOfWeek === 'Saturday' || peakDayOfWeek === 'Sunday') tags.add('weekend_peak');
  if (topCenter) tags.add('has_center');

  return {
    barangay,
    totalCases,
    recentCases,
    severeCases,
    category3Cases,
    category2Cases,
    category1Cases,
    riskScore,
    priority,
    topCenter,
    coord,
    dominantAgeGroup,
    peakDayOfWeek,
    factors: summary.factors || [],
    tags: Array.from(tags),
    ...trend,
    arvBuffer: Math.max(10, Math.ceil(recentCases * 2) + Math.ceil(totalCases * 0.5)),
    erigUnits: Math.max(1, category3Cases + severeCases)
  };
};

const scoreTemplate = (template, ctx) => {
  let score = 0;
  (template.tags || []).forEach((tag) => {
    if (ctx.tags.includes(tag)) score += 10;
  });
  if (template.tier === ctx.priority) score += 5;
  return score;
};

const selectTemplate = (templates, ctx, usedTemplateIds) => {
  const tierTemplates = templates.filter((t) => t.tier === ctx.priority);
  const scored = tierTemplates
    .map((t) => ({ template: t, score: scoreTemplate(t, ctx) }))
    .sort((a, b) => b.score - a.score);

  const candidates = scored.filter((s) => s.score > 0);
  const pool = candidates.length > 0 ? candidates : scored;

  const unused = pool.filter((s) => !usedTemplateIds.has(s.template.id));
  const finalPool = unused.length > 0 ? unused : pool;

  const tieSeed = hashString(`${ctx.barangay}|${ctx.totalCases}|${ctx.recentCases}`);
  const idx = tieSeed % finalPool.length;
  return finalPool[idx].template;
};

const joinSentences = (parts = []) => parts.filter(Boolean).map((s) => (s.endsWith('.') ? s : `${s}.`)).join(' ');

// --- Template library (DOH-aligned) ---

const TEMPLATES = [
  // LOW tier
  {
    id: 'low_zero_surveillance',
    tier: 'low',
    tags: ['zero_cases'],
    reasoning: (ctx) => [
      `In ${ctx.barangay}, no animal bite cases were reported in the selected period, indicating effective prevention or limited exposure.`,
      `This low-activity profile supports maintaining baseline surveillance per DOH National Rabies Prevention and Control Program standards.`,
      `Continue passive reporting through barangay health workers and school channels.`,
      `Overall severity is ${severityTierLabel(ctx.totalCases, 'low')}; risk score ${ctx.riskScore}/100.`,
      `Sustained community education on immediate wound washing with soap and water for at least 15 minutes remains the primary preventive measure.`
    ],
    intervention: (ctx) => [
      `Maintain routine anti-rabies vaccine (ARV) services and cold-chain monitoring in ${ctx.barangay}.`,
      `Conduct quarterly information, education, and communication (IEC) sessions in schools and barangay assemblies on responsible pet ownership and dog vaccination.`,
      `Keep a minimum stock of ${ctx.arvBuffer} ARV doses and verify ERIG contingency protocols quarterly.`,
      `${ctx.coord}.`,
      `Validate exposure category documentation in BiteAlert to preserve early-warning accuracy.`,
      `Maintain referral pathways for Category II and III exposures despite the current absence of reported cases.`
    ]
  },
  {
    id: 'low_stable_prevention',
    tier: 'low',
    tags: ['low_volume', 'stable'],
    reasoning: (ctx) => [
      `${ctx.barangay} recorded ${ctx.totalCases} total case${ctx.totalCases !== 1 ? 's' : ''} with ${ctx.recentCases} in the last seven days, showing stable activity.`,
      `No significant surge or spike was detected in the trend analysis.`,
      ctx.severeCases > 0
        ? `${ctx.severeCases} severe exposure${ctx.severeCases > 1 ? 's were' : ' was'} noted; ensure PEP completion is tracked.`
        : 'No severe Category III exposures were recorded in the current window.',
      `Severity is ${severityTierLabel(ctx.totalCases, 'low')} based on volume and recency.`,
      `Routine DOH-compliant wound care and PEP protocols should remain the standard of care.`
    ],
    intervention: (ctx) => [
      `Sustain baseline ARV clinic operations in ${ctx.barangay} with weekly IEC reminders through barangay channels.`,
      `Emphasize the DOH "wash wound immediately" protocol—15 minutes with soap and running water—during every clinic encounter.`,
      `Maintain at least ${ctx.arvBuffer} ARV doses on hand and review stock monthly.`,
      `${ctx.coord}.`,
      `Line-list all ${ctx.totalCases} active cases for follow-up completion per the WHO/DOH vaccination schedule.`,
      `Monitor weekly trends and escalate to medium-tier response if recent cases exceed ${Math.max(2, Math.round(ctx.totalCases * 0.25))}.`
    ]
  },
  {
    id: 'low_declining_sustain',
    tier: 'low',
    tags: ['declining', 'low_volume'],
    reasoning: (ctx) => [
      `Case activity in ${ctx.barangay} is declining: ${ctx.recentCases} recent versus ${ctx.older} older cases in the analysis window.`,
      `Total reported cases stand at ${ctx.totalCases}, suggesting interventions may be taking effect.`,
      `Growth rate is below surge thresholds, supporting a ${severityTierLabel(ctx.totalCases, 'low')} classification.`,
      `Continued vigilance is needed to prevent rebound, especially during school vacation periods.`,
      `Document lessons learned from the recent period for the barangay health profile.`
    ],
    intervention: (ctx) => [
      `Sustain current preventive services in ${ctx.barangay} while gradually reducing any temporary surge measures.`,
      `Continue monthly IEC on bite prevention and early consultation through barangay health stations.`,
      `Keep ${ctx.arvBuffer} ARV doses as buffer stock and audit cold-chain logs biweekly.`,
      `${ctx.coord}.`,
      `Review defaulter lists from the prior surge period and close any incomplete PEP courses.`,
      `Report declining trend to the City Health Office for inclusion in the monthly epidemiology bulletin.`
    ]
  },
  {
    id: 'low_school_iec',
    tier: 'low',
    tags: ['school_age', 'low_volume'],
    reasoning: (ctx) => [
      `In ${ctx.barangay}, ${ctx.totalCases} case${ctx.totalCases !== 1 ? 's were' : ' was'} reported, with the dominant affected age group being ${ctx.dominantAgeGroup} years.`,
      `School-age exposure patterns suggest play-related or stray animal contact as likely routes.`,
      `Severity remains ${severityTierLabel(ctx.totalCases, 'low')} but targeted youth IEC is warranted.`,
      `${ctx.recentCases} case${ctx.recentCases !== 1 ? 's occurred' : ' occurred'} in the last seven days.`,
      `Coordinate with schools under DOH child-health injury prevention guidance.`
    ],
    intervention: (ctx) => [
      `Deploy school-based rabies awareness sessions in ${ctx.barangay} for ages ${ctx.dominantAgeGroup}, covering wound washing and when to seek care.`,
      `Distribute IEC materials to principals and barangay youth councils within two weeks.`,
      `Maintain routine ARV services with ${ctx.arvBuffer} dose minimum stock.`,
      `${ctx.coord}.`,
      `Encourage teachers to report animal bite incidents to the health center within 24 hours.`,
      `Track school-zone incidents separately in BiteAlert for pattern monitoring.`
    ]
  },
  {
    id: 'low_elderly_outreach',
    tier: 'low',
    tags: ['elderly_focus'],
    reasoning: (ctx) => [
      `${ctx.barangay} shows ${ctx.totalCases} total cases with predominant involvement of adults aged ${ctx.dominantAgeGroup}.`,
      `Elderly patients may delay care; early PEP is critical per DOH guidelines.`,
      `${severityTierLabel(ctx.totalCases, 'low')}; age-specific outreach reduces treatment delays.`,
      `${ctx.recentCases} recent case${ctx.recentCases !== 1 ? 's' : ''} in the last week.`,
      `Home-based or barangay-senior-citizen association channels may improve early reporting.`
    ],
    intervention: (ctx) => [
      `Conduct IEC through senior citizens' associations in ${ctx.barangay} on immediate wound care and same-day health center visit.`,
      `Ensure clinic staff prioritize triage for elderly patients with Category II or III exposures.`,
      `Maintain ${ctx.arvBuffer} ARV doses and ERIG readiness for ${ctx.erigUnits} potential Category III case${ctx.erigUnits !== 1 ? 's' : ''}.`,
      `${ctx.coord}.`,
      `Offer home visit follow-up for elderly defaulters who miss scheduled doses.`,
      `Document age-specific outcomes for the monthly CHO report.`
    ]
  },
  {
    id: 'low_baseline_readiness',
    tier: 'low',
    tags: ['stable'],
    reasoning: (ctx) => [
      `${ctx.barangay} maintains low-level activity with ${ctx.totalCases} total and ${ctx.recentCases} recent cases.`,
      `Trend analysis indicates stable patterns without a detected spike.`,
      `Severity classification is ${severityTierLabel(ctx.totalCases, 'low')}.`,
      ctx.topCenter ? `Cases cluster around ${ctx.topCenter}, supporting coordinated service delivery.` : 'Cases are distributed without a dominant health center cluster.',
      `Baseline readiness aligns with DOH minimum service package for rabies prevention.`
    ],
    intervention: (ctx) => [
      `Continue routine PEP services and quarterly stock audits in ${ctx.barangay}.`,
      `Refresh staff on DOH exposure categories (I, II, III) and corresponding PEP protocols during the next team huddle.`,
      `Stock ${ctx.arvBuffer} ARV doses minimum; verify tetanus and antibiotic prophylaxis supplies.`,
      `${ctx.coord}.`,
      `Run brief IEC during clinic hours on responsible pet ownership and barangay dog vaccination drives.`,
      `Enable weekly BiteAlert dashboard review for early uptick detection.`
    ]
  },

  // MEDIUM tier
  {
    id: 'medium_surge_response',
    tier: 'medium',
    tags: ['surge', 'increasing'],
    reasoning: (ctx) => [
      `${ctx.barangay} shows a recent uptick: ${ctx.recentCases} cases in the last seven days against ${ctx.totalCases} total (growth rate ${ctx.growthRate.toFixed(1)}x).`,
      `This surge pattern warrants elevated operational readiness under DOH outbreak-response principles.`,
      `Severity is ${severityTierLabel(ctx.totalCases, 'medium')}.`,
      ctx.category3Cases > 0
        ? `${ctx.category3Cases} Category III exposure${ctx.category3Cases > 1 ? 's require' : ' requires'} immediate vaccination plus rabies immunoglobulin (RIG/ERIG).`
        : 'Category II exposures dominate; ensure vaccination and wound care per DOH protocol.',
      `Without intensified action, caseload may continue rising over the next two weeks.`
    ],
    intervention: (ctx) => [
      `Schedule an additional vaccination day in ${ctx.barangay} within the next seven days and publish triage/queue instructions via barangay channels.`,
      `Open a fast-track lane for follow-up patients to reduce waiting time and defaulter risk.`,
      `Pre-position ${ctx.arvBuffer} ARV doses and ERIG contingency for ${ctx.erigUnits} severe case${ctx.erigUnits !== 1 ? 's' : ''}.`,
      `${ctx.coord}.`,
      `Line-list all ${ctx.recentCases} recent patients for 48-hour follow-up tracking and reminder outreach.`,
      `Escalate to high-tier surge operations if recent cases exceed five within seven days.`
    ]
  },
  {
    id: 'medium_category2_focus',
    tier: 'medium',
    tags: ['category2', 'elevated_volume'],
    reasoning: (ctx) => [
      `${ctx.barangay} recorded ${ctx.totalCases} cases including ${ctx.category2Cases} Category II exposure${ctx.category2Cases > 1 ? 's' : ''} requiring vaccination plus wound care per DOH.`,
      `${ctx.recentCases} case${ctx.recentCases !== 1 ? 's' : ''} occurred in the last week.`,
      `${severityTierLabel(ctx.totalCases, 'medium')} based on total case count.`,
      `Category II management demands complete PEP course adherence per WHO schedule.`,
      `Moderate volume suggests sustained community exposure risk.`
    ],
    intervention: (ctx) => [
      `Intensify triage in ${ctx.barangay} to classify all exposures correctly and initiate PEP within 24 hours.`,
      `Conduct a barangay information drive on bite prevention and the importance of completing all vaccine doses.`,
      `Prepare ${ctx.arvBuffer} ARV doses based on current caseload; monitor stock daily.`,
      `${ctx.coord}.`,
      `Track missed appointments every 48 hours with SMS or barangay health worker home visits.`,
      `Review weekly trends and prepare surge staffing if Category II cases rise.`
    ]
  },
  {
    id: 'medium_school_surge',
    tier: 'medium',
    tags: ['school_age', 'surge'],
    reasoning: (ctx) => [
      `${ctx.barangay} has ${ctx.totalCases} cases with a surge in recent activity (${ctx.recentCases} in seven days).`,
      `The dominant age group is ${ctx.dominantAgeGroup}, indicating school-age vulnerability.`,
      `${severityTierLabel(ctx.totalCases, 'medium')} requires targeted youth interventions.`,
      `Weekend or after-school exposure timing may contribute to delayed reporting.`,
      `DOH school health protocols support coordinated IEC and rapid referral.`
    ],
    intervention: (ctx) => [
      `Partner with schools in ${ctx.barangay} for emergency IEC assemblies within one week.`,
      `Offer weekend clinic hours if ${ctx.peakDayOfWeek ? `incidents peak on ${ctx.peakDayOfWeek}s` : 'weekend incidents are reported'}.`,
      `Deploy ${ctx.arvBuffer} ARV doses and fast-track pediatric triage protocols.`,
      `${ctx.coord}.`,
      `Distribute wound-care cards to students emphasizing 15-minute soap-and-water washing.`,
      `Escalate to mobile vaccination team if school-linked cases exceed three in seven days.`
    ]
  },
  {
    id: 'medium_weekend_clinic',
    tier: 'medium',
    tags: ['weekend_peak', 'elevated_volume'],
    reasoning: (ctx) => [
      `Analysis of ${ctx.barangay} shows ${ctx.totalCases} total cases with clustering on ${ctx.peakDayOfWeek || 'weekends'}.`,
      `${ctx.recentCases} recent cases suggest ongoing community exposure.`,
      `${severityTierLabel(ctx.totalCases, 'medium')} warrants schedule adjustments.`,
      `Weekend peaks often reflect delayed care after weekday incidents; extended hours can reduce PEP delays.`,
      `Align staffing with observed temporal patterns.`
    ],
    intervention: (ctx) => [
      `Add weekend or ${ctx.peakDayOfWeek} clinic sessions in ${ctx.barangay} for the next four weeks.`,
      `Streamline triage with a dedicated intake nurse and pre-printed exposure category forms.`,
      `Stock ${ctx.arvBuffer} ARV doses and verify cold-chain before each extended session.`,
      `${ctx.coord}.`,
      `Advertise weekend hours through barangay social media and posted advisories.`,
      `Review attendance patterns after two weeks and adjust hours accordingly.`
    ]
  },
  {
    id: 'medium_stable_monitoring',
    tier: 'medium',
    tags: ['stable', 'elevated_volume'],
    reasoning: (ctx) => [
      `${ctx.barangay} has ${ctx.totalCases} total cases with ${ctx.recentCases} in the recent window—elevated but stable.`,
      `No acute surge detected; growth rate is ${ctx.growthRate.toFixed(1)}x.`,
      `${severityTierLabel(ctx.totalCases, 'medium')} reflects sustained caseload.`,
      ctx.severeCases > 0
        ? `${ctx.severeCases} severe case${ctx.severeCases > 1 ? 's' : ''} require${ctx.severeCases === 1 ? 's' : ''} ongoing PEP and RIG monitoring.`
        : 'Severe exposures are limited but vigilance for Category III is required.',
      `Consistent monitoring prevents escalation to high-tier response.`
    ],
    intervention: (ctx) => [
      `Maintain enhanced clinic capacity in ${ctx.barangay} with one additional half-day session per week.`,
      `Run targeted IEC via barangay channels on wound washing and same-day consultation.`,
      `Keep ${ctx.arvBuffer} ARV doses and ${ctx.erigUnits} ERIG unit${ctx.erigUnits !== 1 ? 's' : ''} ready.`,
      `${ctx.coord}.`,
      `Perform biweekly line-listing review of all active PEP courses.`,
      `Trigger high-tier protocol if recent cases double within seven days.`
    ]
  },
  {
    id: 'medium_declining_consolidate',
    tier: 'medium',
    tags: ['declining'],
    reasoning: (ctx) => [
      `Cases in ${ctx.barangay} are trending downward: ${ctx.recentCases} recent versus ${ctx.older} older.`,
      `Total caseload is ${ctx.totalCases}; severity remains ${severityTierLabel(ctx.totalCases, 'medium')} until sustained decline is confirmed.`,
      `Consolidating gains while maintaining readiness prevents rebound.`,
      `Complete follow-up on all open PEP courses from the prior period.`,
      `Report improving trend to support resource reallocation decisions.`
    ],
    intervention: (ctx) => [
      `Sustain medium-tier monitoring in ${ctx.barangay} while avoiding premature reduction of clinic capacity.`,
      `Close all defaulter cases through barangay health worker outreach within 14 days.`,
      `Maintain ${ctx.arvBuffer} ARV buffer stock during the transition period.`,
      `${ctx.coord}.`,
      `Document declining trend in the monthly epidemiology report.`,
      `Step down to low-tier preventive mode only after 30 days without new cases.`
    ]
  },

  // HIGH tier
  {
    id: 'high_category3_surge',
    tier: 'high',
    tags: ['category3', 'surge'],
    reasoning: (ctx) => [
      `${ctx.barangay} is in a high-risk state: ${ctx.totalCases} total cases, ${ctx.recentCases} in the last seven days, and ${ctx.category3Cases} Category III exposure${ctx.category3Cases > 1 ? 's' : ''}.`,
      `DOH mandates immediate PEP with vaccination plus RIG/ERIG infiltration for Category III wounds.`,
      `Severity is ${severityTierLabel(ctx.totalCases, 'high')}.`,
      `Surge conditions strain clinic capacity and cold-chain logistics.`,
      `Delayed RIG administration beyond 7 days post-exposure significantly reduces effectiveness.`
    ],
    intervention: (ctx) => [
      `Activate surge ARV operations in ${ctx.barangay} within 48 hours—deploy mobile team or pop-up clinic at the barangay hall.`,
      `Ensure ${ctx.erigUnits} ERIG/RIG dose${ctx.erigUnits !== 1 ? 's' : ''} on site; train staff on wound infiltration per DOH protocol.`,
      `Extend clinic hours daily for seven days; perform daily line-listing and defaulter home visits.`,
      `${ctx.coord}.`,
      `Pre-position ${ctx.arvBuffer} ARV doses with verified cold-chain; audit twice daily during surge.`,
      `Brief barangay leaders daily on queue volume; require same-day BiteAlert documentation for each patient.`,
      `Reassess operational intensity after seven days using severe-case and recent-case indicators.`
    ]
  },
  {
    id: 'high_severe_outbreak',
    tier: 'high',
    tags: ['severe_present', 'very_high_volume'],
    reasoning: (ctx) => [
      `${ctx.barangay} reports ${ctx.totalCases} cases including ${ctx.severeCases} severe exposure${ctx.severeCases > 1 ? 's' : ''}—a very high-volume profile.`,
      `${ctx.recentCases} cases occurred in the last week, indicating active transmission risk.`,
      `${severityTierLabel(ctx.totalCases, 'high')} triggers DOH outbreak-response measures.`,
      `Category III wound care, RIG administration, and complete PEP courses are non-negotiable.`,
      `Population density and case clustering amplify public health urgency.`
    ],
    intervention: (ctx) => [
      `Stand up a dedicated surge clinic in ${ctx.barangay} with physician-led triage and two additional nurses for 14 days.`,
      `Mobilize ${ctx.arvBuffer} ARV doses and ${ctx.erigUnits} ERIG units; coordinate emergency resupply with the City Health Office.`,
      `Implement 7-day extended operations including weekends; prioritize Category III wound care before discharge.`,
      `${ctx.coord}.`,
      `Conduct daily barangay leader briefings and community IEC on immediate 15-minute wound washing.`,
      `Activate defaulter tracing with same-day home visits for missed doses.`,
      `Submit daily situation reports to the CHO epidemiology unit until cases fall below five per week.`
    ]
  },
  {
    id: 'high_recent_spike',
    tier: 'high',
    tags: ['surge', 'increasing', 'elevated_volume'],
    reasoning: (ctx) => [
      `A sharp recent spike is detected in ${ctx.barangay}: ${ctx.recentCases} cases in seven days against ${ctx.totalCases} total.`,
      `Growth rate ${ctx.growthRate.toFixed(1)}x exceeds surge thresholds.`,
      `${severityTierLabel(ctx.totalCases, 'high')} demands immediate operational escalation.`,
      `Without intervention, caseload may double within two weeks based on current velocity.`,
      `DOH rapid response principles apply: intensify services before capacity is overwhelmed.`
    ],
    intervention: (ctx) => [
      `Deploy a mobile vaccination team to ${ctx.barangay} within 48 hours with pop-up clinic at high-traffic community areas.`,
      `Run a one-week intensified campaign with daily monitoring and quick home visits for defaulters.`,
      `Stock ${ctx.arvBuffer} ARV doses; extend cold-chain capacity with portable units if needed.`,
      `${ctx.coord}.`,
      `Implement weekend operations until the surge subsides.`,
      `Line-list every new case within 24 hours and track PEP completion in BiteAlert.`,
      `Reassess after seven days; maintain surge ops if recent cases remain at or above five.`
    ]
  },
  {
    id: 'high_center_coordination',
    tier: 'high',
    tags: ['has_center', 'severe_present'],
    reasoning: (ctx) => [
      `${ctx.barangay} has ${ctx.totalCases} cases with ${ctx.severeCases} severe; activity clusters at ${ctx.topCenter}.`,
      `${severityTierLabel(ctx.totalCases, 'high')} requires coordinated multi-site response.`,
      `${ctx.recentCases} recent cases sustain pressure on ${ctx.topCenter}.`,
      `Centralizing surge resources at the primary center while deploying barangay outreach optimizes coverage.`,
      `DOH emphasizes health-center-led coordination during elevated caseloads.`
    ],
    intervention: (ctx) => [
      `Establish ${ctx.topCenter} as the lead surge site for ${ctx.barangay} with overflow triage at the barangay hall.`,
      `Augment staffing: add two nurses and one physician for 14 days; ensure ERIG-trained personnel on every shift.`,
      `Pre-position ${ctx.arvBuffer} ARV doses and ${ctx.erigUnits} ERIG at ${ctx.topCenter} with daily inventory checks.`,
      `${ctx.coord}.`,
      `Deploy barangay health workers for community IEC and referral of new cases to the lead center.`,
      `Conduct twice-daily huddles on queue volume, stock levels, and defaulter counts.`,
      `Submit joint barangay–RHU situation report to CHO every 48 hours.`
    ]
  },
  {
    id: 'high_school_emergency',
    tier: 'high',
    tags: ['school_age', 'surge', 'severe_present'],
    reasoning: (ctx) => [
      `${ctx.barangay} faces a HIGH-risk school-age cluster: ${ctx.totalCases} cases, dominant age ${ctx.dominantAgeGroup}, ${ctx.recentCases} recent.`,
      `${ctx.severeCases} severe exposure${ctx.severeCases > 1 ? 's' : ''} elevate PEP urgency for children and adolescents.`,
      `${severityTierLabel(ctx.totalCases, 'high')}; DOH child injury prevention and rabies protocols apply.`,
      `School-linked outbreaks require rapid IEC and on-site referral pathways.`,
      `Parents may delay care; same-day health center visit is critical.`
    ],
    intervention: (ctx) => [
      `Launch emergency school IEC in ${ctx.barangay} within 24 hours with CHO support; suspend outdoor activities near stray animal zones if needed.`,
      `Offer after-school and weekend PEP clinics for students with fast-track pediatric triage.`,
      `Ensure ${ctx.arvBuffer} ARV doses and pediatric-appropriate ERIG dosing protocols.`,
      `${ctx.coord}.`,
      `Assign a liaison nurse to each affected school for same-day referral coordination.`,
      `Track school-linked cases separately; escalate to city-wide alert if cases exceed 10 in 14 days.`,
      `Distribute parent advisories on wound washing and immediate health center visit.`
    ]
  },
  {
    id: 'high_general_activation',
    tier: 'high',
    tags: ['very_high_volume'],
    reasoning: (ctx) => [
      `${ctx.barangay} exceeds high-volume thresholds with ${ctx.totalCases} total cases and ${ctx.recentCases} in the last week.`,
      `${severityTierLabel(ctx.totalCases, 'high')} confirmed by case volume.`,
      ctx.category3Cases > 0
        ? `${ctx.category3Cases} Category III case${ctx.category3Cases > 1 ? 's' : ''} require RIG/ERIG and priority wound management.`
        : 'Multiple Category II exposures require accelerated vaccination throughput.',
      `Sustained caseload indicates ongoing community exposure to rabies-risk animals.`,
      `DOH outbreak thresholds support full surge activation.`
    ],
    intervention: (ctx) => [
      `Activate full surge operations in ${ctx.barangay}: extended hours, additional staff, and daily epidemiology review for 14 days.`,
      `Deploy mobile vaccination capability to underserved puroks within 72 hours.`,
      `Maintain ${ctx.arvBuffer} ARV doses and ${ctx.erigUnits} ERIG with cold-chain audit at each shift change.`,
      `${ctx.coord}.`,
      `Intensify barangay-wide IEC on responsible pet ownership, leash laws, and immediate wound care.`,
      `Mandate same-day BiteAlert entry and dose scheduling for every patient.`,
      `Coordinate with the City Veterinary Office for concurrent dog vaccination sweeps in hotspot areas.`
    ]
  }
];

const buildSituationAnalysis = (ctx, template) => {
  const parts = typeof template.reasoning === 'function' ? template.reasoning(ctx) : [];
  return joinSentences(parts);
};

const buildPrescription = (ctx, template) => {
  const parts = typeof template.intervention === 'function' ? template.intervention(ctx) : [];
  return joinSentences(parts);
};

const buildResourceNeeds = (ctx) => {
  if (ctx.priority === 'high') {
    return `ARV doses (${ctx.arvBuffer}), ERIG/RIG (${ctx.erigUnits} units), 2 nurses, 1 physician, IEC materials, cold-chain supplies`;
  }
  if (ctx.priority === 'medium') {
    return `ARV doses (${ctx.arvBuffer}), ERIG contingency (${ctx.erigUnits}), 1 nurse, IEC materials`;
  }
  return `Routine ARV stock (${ctx.arvBuffer} doses), IEC materials, standard clinic supplies`;
};

const summaryToIntervention = (summary, template) => {
  const ctx = buildContext(summary);
  const ageGroupFocus = ctx.dominantAgeGroup || '';
  const timePattern = ctx.peakDayOfWeek
    ? (ctx.tags.includes('weekend_peak') ? `Weekend spikes (${ctx.peakDayOfWeek})` : `Peak on ${ctx.peakDayOfWeek}`)
    : '';

  return {
    barangay: ctx.barangay,
    riskScore: ctx.riskScore,
    priority: ctx.priority,
    reasoning: buildSituationAnalysis(ctx, template),
    intervention: buildPrescription(ctx, template),
    totalCases: ctx.totalCases,
    recentCases: ctx.recentCases,
    severeCases: ctx.severeCases,
    ageGroupFocus,
    timePattern,
    resourceNeeds: buildResourceNeeds(ctx),
    coordinationRequired: ctx.coord
  };
};

const generatePrescriptions = (barangaySummaries = []) => {
  const usedTemplateIds = new Set();
  const sorted = [...barangaySummaries].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  return sorted.map((summary) => {
    const ctx = buildContext(summary);
    const template = selectTemplate(TEMPLATES, ctx, usedTemplateIds);
    usedTemplateIds.add(template.id);
    return summaryToIntervention(summary, template);
  });
};

module.exports = {
  SEVERITY_TIERS,
  SEVERITY_THRESHOLDS,
  classifySeverity,
  severityTierLabel,
  computeTrendMetrics,
  buildContext,
  buildSituationAnalysis,
  buildPrescription,
  buildResourceNeeds,
  generatePrescriptions
};
