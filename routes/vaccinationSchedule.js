const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const VaccinationDate = require('../models/VaccinationDate');
const BiteCase = require('../models/BiteCase');

// ─── Helper: labels → schema field names ──────────────────────────────────────
const DOSE_LABELS  = ['Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28'];
const ADD_DAYS     = [0, 3, 7, 14, 28];
const DATE_FIELD   = { 'Day 0': 'd0Date',  'Day 3': 'd3Date',  'Day 7': 'd7Date',  'Day 14': 'd14Date',  'Day 28': 'd28Date'  };
const STATUS_FIELD = { 'Day 0': 'd0Status','Day 3': 'd3Status','Day 7': 'd7Status','Day 14': 'd14Status','Day 28': 'd28Status' };

// Helper: given a VaccinationDate doc, check if all doses are done
const allDosesFinished = (doc) =>
    ['d0Status','d3Status','d7Status','d14Status','d28Status']
        .every(f => doc[f] === 'completed' || doc[f] === 'missed');

// ─── GET /api/vaccinationdates ────────────────────────────────────────────────
// Returns vaccination date records filtered by patientId, biteCaseId,
// registrationNumber, or center (center requires a BiteCase join).
router.get('/api/vaccinationdates', async (req, res) => {
    try {
        console.log('🔍 GET /api/vaccinationdates called with query:', req.query);
        const { patientId, biteCaseId, center, registrationNumber } = req.query;

        const filter = {};
        if (patientId)          filter.patientId          = patientId;
        if (biteCaseId)         filter.biteCaseId         = biteCaseId;
        if (registrationNumber) filter.registrationNumber = registrationNumber;

        // Center filter requires joining with bitecases
        if (center) {
            const matchingBiteCases = await BiteCase.find(
                { center: { $regex: center, $options: 'i' } }, { _id: 1 }
            );
            filter.biteCaseId = { $in: matchingBiteCases.map(bc => String(bc._id)) };
        }

        const list = await VaccinationDate.find(filter).sort({ updatedAt: -1, createdAt: -1 });
        console.log('🔍 Found vaccination dates:', list.length);
        res.json(list);
    } catch (err) {
        console.error('Error fetching vaccinationdates:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch vaccination dates' });
    }
});

// ─── GET /api/vaccinationdates/:id ────────────────────────────────────────────
router.get('/api/vaccinationdates/:id', async (req, res) => {
    try {
        const item = await VaccinationDate.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json(item);
    } catch (err) {
        console.error('Error fetching vaccinationdates by id:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch vaccination date' });
    }
});

// ─── POST /api/vaccinationdates ───────────────────────────────────────────────
// Create a new VaccinationDate record.
// Required: biteCaseId, patientId, registrationNumber, d0Date, d3Date, d7Date
router.post('/api/vaccinationdates', async (req, res) => {
    try {
        console.log('🔍 POST /api/vaccinationdates called with:', req.body);
        const body = req.body || {};

        // Required field validation
        const required = ['biteCaseId', 'patientId', 'registrationNumber', 'd0Date', 'd3Date', 'd7Date'];
        const missing = required.filter(f => !body[f]);
        if (missing.length > 0) {
            return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
        }

        // Parse Date fields from the schema
        ['d0Date','d3Date','d7Date','d14Date','d28Date'].forEach(k => {
            if (body[k]) body[k] = new Date(body[k]);
        });

        const newRecord = new VaccinationDate({
            biteCaseId:         body.biteCaseId,
            patientId:          body.patientId,
            registrationNumber: body.registrationNumber,
            d0Date:  body.d0Date,
            d3Date:  body.d3Date,
            d7Date:  body.d7Date,
            d14Date: body.d14Date || null,
            d28Date: body.d28Date || null,
            d0Status:       body.d0Status       || 'pending',
            d3Status:       body.d3Status       || 'pending',
            d7Status:       body.d7Status       || 'pending',
            d14Status:      body.d14Status      || 'pending',
            d28Status:      body.d28Status      || 'pending',
            treatmentStatus: body.treatmentStatus || 'in_progress'
        });

        const result = await newRecord.save();
        console.log('🔍 Created vaccination date record:', result._id);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        console.error('Error creating vaccinationdates:', err);
        res.status(500).json({ success: false, message: 'Failed to create vaccination date', error: err.message });
    }
});

// ─── PUT /api/vaccinationdates (by biteCaseId query param) ───────────────────
router.put('/api/vaccinationdates', async (req, res) => {
    try {
        const { biteCaseId } = req.query;
        if (!biteCaseId) return res.status(400).json({ success: false, message: 'biteCaseId is required' });

        const update = req.body || {};
        // Parse any incoming Date strings
        ['d0Date','d3Date','d7Date','d14Date','d28Date'].forEach(k => {
            if (update[k]) update[k] = new Date(update[k]);
        });

        const result = await VaccinationDate.findOneAndUpdate(
            { biteCaseId },
            { $set: { ...update, updatedAt: new Date() } },
            { new: true }
        );
        if (!result) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error updating vaccinationdates (by biteCaseId):', err);
        res.status(500).json({ success: false, message: 'Failed to update vaccination date' });
    }
});

// ─── PUT /api/vaccinationdates/:id ────────────────────────────────────────────
// General update by MongoDB _id.  Parses Date strings for dose date fields.
router.put('/api/vaccinationdates/:id', async (req, res) => {
    try {
        console.log('🔍 PUT /api/vaccinationdates/:id:', req.params.id);
        const update = req.body || {};

        // Parse Date strings
        ['d0Date','d3Date','d7Date','d14Date','d28Date'].forEach(k => {
            if (update[k]) update[k] = new Date(update[k]);
        });

        const result = await VaccinationDate.findByIdAndUpdate(
            req.params.id,
            { $set: { ...update, updatedAt: new Date() } },
            { new: true }
        );
        if (!result) return res.status(404).json({ success: false, message: 'Not found' });

        // After update, check if all doses are finished → sync BiteCase status
        await syncBiteCaseStatus(result);

        console.log('🔍 Updated vaccination date:', result._id);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error updating vaccinationdates by id:', err);
        res.status(500).json({ success: false, message: 'Failed to update vaccination date' });
    }
});

// ─── POST /api/vaccinationdates/:id/reschedule ───────────────────────────────
// Update a base dose date and cascade all downstream pending/missed doses.
// Body: { dayLabel: "Day 0"|"Day 3"|"Day 7"|"Day 14"|"Day 28", newDate: "YYYY-MM-DD" }
router.post('/api/vaccinationdates/:id/reschedule', async (req, res) => {
    try {
        const { id } = req.params;
        const { dayLabel, newDate } = req.body || {};

        if (!dayLabel || !newDate) {
            return res.status(400).json({ success: false, message: 'dayLabel and newDate are required' });
        }

        const idxBase = DOSE_LABELS.indexOf(dayLabel);
        if (idxBase < 0) return res.status(400).json({ success: false, message: 'Invalid dayLabel' });

        const doc = await VaccinationDate.findById(id);
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

        const base = new Date(newDate);
        if (isNaN(base.getTime())) return res.status(400).json({ success: false, message: 'Invalid newDate' });

        const update = {};
        // Set the base dose
        update[DATE_FIELD[dayLabel]] = base;
        if (doc[STATUS_FIELD[dayLabel]] !== 'completed') update[STATUS_FIELD[dayLabel]] = 'pending';

        // Cascade to downstream doses (skip completed)
        for (let i = idxBase + 1; i < DOSE_LABELS.length; i++) {
            const label = DOSE_LABELS[i];
            const d = new Date(base);
            d.setDate(d.getDate() + (ADD_DAYS[i] - ADD_DAYS[idxBase]));
            update[DATE_FIELD[label]] = d;
            if (doc[STATUS_FIELD[label]] !== 'completed') update[STATUS_FIELD[label]] = 'pending';
        }

        const result = await VaccinationDate.findByIdAndUpdate(
            id, { $set: { ...update, updatedAt: new Date() } }, { new: true }
        );
        return res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error in reschedule endpoint:', err);
        res.status(500).json({ success: false, message: 'Failed to reschedule' });
    }
});

// ─── PUT /api/vaccinations/:id ───────────────────────────────────────────────
// Mark a specific dose as completed or missed.
// Body fields that map to VaccinationDate schema:
//   dayLabel  → "Day 0" | "Day 3" | "Day 7" | "Day 14" | "Day 28"
//   doseStatus → "completed" | "missed" | "pending"
//   (any other VaccinationDate field is also accepted via $set)
router.put('/api/vaccinations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body || {};

        console.log('Updating vaccination:', { id, updateData });

        const vaccination = await VaccinationDate.findById(id);
        if (!vaccination) {
            return res.status(404).json({ success: false, message: 'Vaccination record not found' });
        }

        // If dayLabel + doseStatus provided, resolve to the correct status field
        if (updateData.dayLabel && updateData.doseStatus) {
            const statusField = STATUS_FIELD[updateData.dayLabel];
            if (statusField) {
                updateData[statusField] = updateData.doseStatus;
            }
            delete updateData.dayLabel;
            delete updateData.doseStatus;
        }

        // Parse any Date strings
        ['d0Date','d3Date','d7Date','d14Date','d28Date'].forEach(k => {
            if (updateData[k]) updateData[k] = new Date(updateData[k]);
        });

        const updatedVaccination = await VaccinationDate.findByIdAndUpdate(
            id,
            { $set: { ...updateData, updatedAt: new Date() } },
            { new: true }
        );

        // Sync BiteCase status if all doses are now finished
        await syncBiteCaseStatus(updatedVaccination);

        return res.json({
            success: true,
            data: updatedVaccination,
            message: 'Vaccination status updated successfully'
        });
    } catch (error) {
        console.error('Error updating vaccination:', error);
        res.status(500).json({ success: false, message: 'Failed to update vaccination' });
    }
});

// ─── GET /api/vaccinations ────────────────────────────────────────────────────
// Fetch all VaccinationDate records for a patient.
router.get('/api/vaccinations', async (req, res) => {
    try {
        const { patientId } = req.query;
        if (!patientId) return res.status(400).json({ error: 'Patient ID is required' });

        const vaccinations = await VaccinationDate.find({ patientId }).sort({ createdAt: 1 });
        console.log('Found vaccinations for patient', patientId, ':', vaccinations.length);
        res.json(vaccinations);
    } catch (error) {
        console.error('Error fetching vaccinations:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── GET /api/vaccination-data ───────────────────────────────────────────────
// Returns all VaccinationDate records (admin/report use).
router.get('/api/vaccination-data', async (req, res) => {
    try {
        const vaccinations = await VaccinationDate.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: vaccinations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Internal helper: sync BiteCase.status after a VaccinationDate update ────
// If all dose statuses in the VaccinationDate record are completed/missed,
// update the linked BiteCase to status='completed' and set VaccinationDate
// treatmentStatus='completed' as well.
async function syncBiteCaseStatus(vaxDoc) {
    try {
        if (!vaxDoc || !vaxDoc.biteCaseId) return;

        if (allDosesFinished(vaxDoc)) {
            // Mark VaccinationDate treatment as completed
            await VaccinationDate.findByIdAndUpdate(vaxDoc._id, {
                $set: { treatmentStatus: 'completed', updatedAt: new Date() }
            });

            // Mark the linked BiteCase as completed
            await BiteCase.findByIdAndUpdate(vaxDoc.biteCaseId, {
                $set: { status: 'completed', updatedAt: new Date() }
            });

            console.log('✅ All doses finished — BiteCase', vaxDoc.biteCaseId, 'moved to completed.');
        } else {
            // Ensure treatmentStatus reflects in_progress if not yet finished
            if (vaxDoc.treatmentStatus !== 'in_progress') {
                await VaccinationDate.findByIdAndUpdate(vaxDoc._id, {
                    $set: { treatmentStatus: 'in_progress', updatedAt: new Date() }
                });
            }
        }
    } catch (err) {
        console.error('Warning: syncBiteCaseStatus failed:', err.message);
    }
}

module.exports = router;
