const AuditTrail = require('../models/AuditTrail');

const normCenterLabel = (v) => String(v || '')
    .toLowerCase()
    .replace(/\s*health\s*center$/i, '')
    .replace(/\s*center$/i, '')
    .replace(/-/g, ' ')
    .trim();

const extractBarangayFromCenterRecord = (center = {}) => {
    const raw = center.centerName || center.name || '';
    const match = String(raw).match(/barangay health center\s*-\s*(.+)/i);
    if (match) return match[1].trim();
    return String(raw).replace(/barangay health center\s*/i, '').trim();
};

const coerceCaseDate = (c = {}) => {
    const v = c.incidentDate || c.exposureDate || c.dateRegistered || c.arrivalDate || c.createdAt || c.updatedAt;
    if (!v) return null;
    if (typeof v === 'string') return new Date(v);
    if (typeof v === 'number') return new Date(v);
    if (v?.$date?.$numberLong) return new Date(Number(v.$date.$numberLong));
    if (v?.$date) return new Date(v.$date);
    return new Date(v);
};

const getCaseExposureMeta = (c = {}) => {
    const mgmtCategory = Array.isArray(c.management?.category) ? c.management.category[0] : c.management?.category;
    const raw = String(c.exposureCategory || mgmtCategory || c.category || '').toUpperCase();
    if (raw.includes('III') || raw === '3' || raw.includes('CATEGORY 3')) {
        return { exposureCategory: 'III', exposureType: '3', severity: 'high' };
    }
    if (raw.includes('II') || raw === '2' || raw.includes('CATEGORY 2')) {
        return { exposureCategory: 'II', exposureType: '2', severity: 'medium' };
    }
    if (raw.includes('I') || raw === '1' || raw.includes('CATEGORY 1')) {
        return { exposureCategory: 'I', exposureType: '1', severity: 'low' };
    }
    const exposureType = (c.exposureType || '').toString();
    if (exposureType === '3') return { exposureCategory: 'III', exposureType: '3', severity: 'high' };
    if (exposureType === '2') return { exposureCategory: 'II', exposureType: '2', severity: 'medium' };
    return { exposureCategory: 'I', exposureType: '1', severity: c.severity || 'low' };
};

const emptyBarangayRisk = () => ({
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
});

async function logAuditTrail(role, firstName, middleName, lastName, action, ids = {}, center = null) {
    try {
        const auditLog = new AuditTrail({
            role,
            firstName,
            middleName,
            lastName,
            action,
            adminID: ids.adminID || null,
            superAdminID: ids.superAdminID || null,
            patientID: ids.patientID || null,
            staffID: ids.staffID || null,
            center: center || ids.center || null
        });
        await auditLog.save();
    } catch (error) {
        console.error('Error logging audit trail:', error);
    }
}

module.exports = {
    normCenterLabel,
    extractBarangayFromCenterRecord,
    coerceCaseDate,
    getCaseExposureMeta,
    emptyBarangayRisk,
    logAuditTrail
};
