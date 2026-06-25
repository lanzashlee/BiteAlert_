const mongoose = require('mongoose');

const vaccinationDateSchema = new mongoose.Schema({
    biteCaseId: {
        type: String,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        required: true
    },
    d0Date: {
        type: Date,
        required: true
    },
    d3Date: {
        type: Date,
        required: true
    },
    d7Date: {
        type: Date,
        required: true
    },
    d14Date: {
        type: Date,
        required: false
    },
    d28Date: {
        type: Date,
        required: false
    },
    d0Status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending'
    },
    d3Status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending'
    },
    d7Status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending'
    },
    d14Status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending'
    },
    d28Status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending'
    },
    treatmentStatus: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'missed'],
        default: 'in_progress'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VaccinationDate', vaccinationDateSchema); 