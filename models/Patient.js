const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('Patient', patientSchema, 'patients');
