const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    role: { type: String, required: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    action: { type: String, required: true },
    adminID: String,
    superAdminID: String,
    patientID: String,
    staffID: String,
    center: { type: String, default: null } // barangay/center name for scoping
});

module.exports = mongoose.model('AuditTrail', auditLogSchema, 'audittrail');
