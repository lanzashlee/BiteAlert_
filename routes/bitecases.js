const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BiteCase = require('../models/BiteCase');
const VaccinationDate = require('../models/VaccinationDate');

// ─── CORS helper ──────────────────────────────────────────────────────────────
const setCorsHeaders = (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
};

router.options('/api/bitecases', (req, res) => { setCorsHeaders(req, res); res.sendStatus(200); });
router.options('/api/bitecases/find', (req, res) => { setCorsHeaders(req, res); res.sendStatus(200); });

// ─── GET /api/bitecases ───────────────────────────────────────────────────────
// Supports filtering by: center, patientId, registrationNumber, name,
// firstName+lastName, and today (joins with vaccinationdates for daily view).
router.get('/api/bitecases', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        console.log('🔍 GET /api/bitecases called with query:', req.query);
        const { center, patientId, registrationNumber, name, firstName, lastName, today } = req.query;

        const filter = {};

        if (center) filter.center = { $regex: center, $options: 'i' };

        const orConditions = [];
        if (patientId) {
            const maybeId = String(patientId).trim();
            if (mongoose.Types.ObjectId.isValid(maybeId)) {
                orConditions.push({ patientId: new mongoose.Types.ObjectId(maybeId) });
            }
            orConditions.push({ patientId: maybeId });
            orConditions.push({ patientID: maybeId });
        }
        if (registrationNumber) orConditions.push({ registrationNumber: String(registrationNumber).trim() });
        if (name) orConditions.push({ patientName: { $regex: String(name).trim(), $options: 'i' } });
        if (firstName && lastName) {
            orConditions.push({
                firstName: { $regex: `^${String(firstName).trim()}$`, $options: 'i' },
                lastName:  { $regex: `^${String(lastName).trim()}$`,  $options: 'i' }
            });
        }
        if (orConditions.length > 0) filter.$or = orConditions;

        // "today" filter — cross-references VaccinationDate for today's appointments
        if (today === 'true') {
            const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            console.log('🔍 Filtering for today\'s appointments:', todayString);

            // Find vaccination records that have any dose date matching today
            const matchingVaxDocs = await VaccinationDate.find({
                $or: [
                    { d0Date:  { $gte: new Date(todayString), $lt: new Date(todayString + 'T23:59:59.999Z') } },
                    { d3Date:  { $gte: new Date(todayString), $lt: new Date(todayString + 'T23:59:59.999Z') } },
                    { d7Date:  { $gte: new Date(todayString), $lt: new Date(todayString + 'T23:59:59.999Z') } },
                    { d14Date: { $gte: new Date(todayString), $lt: new Date(todayString + 'T23:59:59.999Z') } },
                    { d28Date: { $gte: new Date(todayString), $lt: new Date(todayString + 'T23:59:59.999Z') } }
                ]
            }, { biteCaseId: 1 });

            const biteCaseIds = matchingVaxDocs.map(v => v.biteCaseId);

            // Also check scheduleDates on BiteCase itself
            const todayFilter = {
                $or: [
                    { _id: { $in: biteCaseIds } },
                    { scheduleDates: { $elemMatch: { $regex: `^${todayString}` } } }
                ]
            };

            if (Object.keys(filter).length > 0) {
                filter.$and = [filter, todayFilter];
            } else {
                Object.assign(filter, todayFilter);
            }
        }

        const cases = await BiteCase.find(filter).sort({ createdAt: -1 });
        console.log('🔍 Found bite cases:', cases.length);
        res.json(cases);
    } catch (error) {
        console.error('Error fetching bite cases:', error);
        res.status(500).json({ error: 'Failed to fetch bite cases' });
    }
});

// ─── GET /api/bitecases/find ──────────────────────────────────────────────────
// Fetch single bitecase by patientId or registrationNumber
router.get('/api/bitecases/find', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { patientId, registrationNumber } = req.query;
        if (!patientId && !registrationNumber) {
            return res.status(400).json({ success: false, message: 'Provide patientId or registrationNumber' });
        }
        const query = patientId ? { patientId } : { registrationNumber };
        const doc = await BiteCase.findOne(query).sort({ createdAt: -1 });
        if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });
        return res.json({ success: true, data: doc });
    } catch (error) {
        console.error('Error fetching bitecase by key:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch bitecase' });
    }
});

// ─── POST /api/bitecases ──────────────────────────────────────────────────────
// Create a new bite case. Fields are validated against the BiteCase schema.
// Vaccination schedule dates (d0Date … d28Date) are stored in VaccinationDate,
// NOT on the BiteCase document, so they are extracted and saved separately here.
router.post('/api/bitecases', async (req, res) => {
    try {
        console.log('Creating bite case with payload:', req.body);
        const payload = req.body || {};

        // ── Required-field check (mirrors BiteCase schema) ────────────────────
        const requiredFields = [
            'patientId', 'registrationNumber', 'dateRegistered',
            'firstName', 'lastName',
            'houseNo', 'street', 'barangay', 'city', 'province', 'zipCode',
            'age', 'weight', 'sex', 'center', 'scheduleDates'
        ];
        const missingFields = requiredFields.filter(f => {
            const v = payload[f];
            if (f === 'scheduleDates') return !Array.isArray(v) || v.length === 0;
            return v === undefined || v === null || String(v).trim() === '';
        });

        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // ── Auto-generate patientId if missing ────────────────────────────────
        if (!payload.patientId) {
            payload.patientId = `${payload.firstName}_${payload.lastName}_${Date.now()}`;
        }

        // ── Block creation if patient has active (pending) vaccination schedule ─
        try {
            const activeSchedules = await VaccinationDate.find({
                patientId: payload.patientId,
                treatmentStatus: { $in: ['pending', 'in_progress'] }
            });
            if (activeSchedules.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot create a new case for this patient because they have an active vaccination schedule. All doses must be completed or missed first.'
                });
            }
        } catch (schedErr) {
            console.error('Error verifying active vaccination schedules:', schedErr);
        }

        // ── Helper: safely parse a date value ────────────────────────────────
        const toDate = (v) => {
            try { const d = new Date(v); return isNaN(d.getTime()) ? null : d; } catch { return null; }
        };

        // ── Separate dose-day fields — they belong in VaccinationDate ─────────
        const doseDayFields = ['d0Date', 'd3Date', 'd7Date', 'd14Date', 'd28Date'];
        const doseDayValues = {};
        doseDayFields.forEach(k => {
            if (payload[k]) {
                doseDayValues[k] = toDate(payload[k]);
                delete payload[k];  // do not store on BiteCase
            }
        });
        // Also strip status-only fields that belong to VaccinationDate
        ['d0Status','d3Status','d7Status','d14Status','d28Status'].forEach(k => delete payload[k]);

        // ── Build clean BiteCase payload ──────────────────────────────────────
        const cleanPayload = {
            ...payload,
            dateRegistered:  payload.dateRegistered  || new Date().toISOString().split('T')[0],
            arrivalDate:     payload.arrivalDate     || '',
            arrivalTime:     payload.arrivalTime     || '',
            philhealthNo:    payload.philhealthNo    || '',
            middleName:      payload.middleName      || '',
            civilStatus:     payload.civilStatus     || '',
            birthdate:       payload.birthdate       || '',
            birthplace:      payload.birthplace      || '',
            nationality:     payload.nationality     || '',
            religion:        payload.religion        || '',
            occupation:      payload.occupation      || '',
            contactNo:       payload.contactNo       || '',
            subdivision:     payload.subdivision     || '',
            age:             String(payload.age  || ''),
            weight:          String(payload.weight || ''),
            // Arrays — ensure proper format
            scheduleDates:   Array.isArray(payload.scheduleDates) ? payload.scheduleDates : [],
            typeOfExposure:  Array.isArray(payload.typeOfExposure)  ? payload.typeOfExposure  : [],
            siteOfBite:      Array.isArray(payload.siteOfBite)      ? payload.siteOfBite      : [],
            natureOfInjury:  Array.isArray(payload.natureOfInjury)  ? payload.natureOfInjury  : [],
            externalCause:   Array.isArray(payload.externalCause)   ? payload.externalCause   : [],
            placeOfOccurrence: Array.isArray(payload.placeOfOccurrence) ? payload.placeOfOccurrence : [],
            disposition:     Array.isArray(payload.disposition)     ? payload.disposition     : [],
            circumstanceOfBite: Array.isArray(payload.circumstanceOfBite) ? payload.circumstanceOfBite : [],
            status:          payload.status || 'in_progress',
        };

        console.log('Creating bite case with clean payload:', cleanPayload);

        // ── Save the BiteCase document ────────────────────────────────────────
        let savedDoc;
        try {
            const doc = new BiteCase(cleanPayload);
            savedDoc = await doc.save();
            console.log('Bite case created successfully:', savedDoc._id);
        } catch (saveError) {
            console.error('Error saving bite case:', saveError);
            let userMessage = 'Failed to save bite case to database';
            if (saveError.code === 11000) {
                const dupField = Object.keys(saveError.keyValue || {})[0] || 'field';
                const dupVal   = saveError.keyValue ? saveError.keyValue[dupField] : '';
                userMessage = dupField === 'registrationNumber'
                    ? `Registration Number "${dupVal}" already exists. Please use a different registration number.`
                    : `Duplicate value for ${dupField}: "${dupVal}". Please use a unique value.`;
            } else if (saveError.name === 'ValidationError') {
                const firstMsg = Object.values(saveError.errors || {})[0]?.message || saveError.message;
                userMessage = `Validation error: ${firstMsg}`;
            } else {
                userMessage = saveError.message || userMessage;
            }
            return res.status(saveError.code === 11000 ? 409 : 500).json({
                success: false, message: userMessage, error: saveError.message
            });
        }

        // ── If dose-day dates were supplied, create the VaccinationDate record ─
        if (Object.keys(doseDayValues).length > 0 && doseDayValues.d0Date) {
            try {
                const vaxRecord = new VaccinationDate({
                    biteCaseId:         String(savedDoc._id),
                    patientId:          savedDoc.patientId,
                    registrationNumber: savedDoc.registrationNumber,
                    d0Date:  doseDayValues.d0Date  || null,
                    d3Date:  doseDayValues.d3Date  || null,
                    d7Date:  doseDayValues.d7Date  || null,
                    d14Date: doseDayValues.d14Date || null,
                    d28Date: doseDayValues.d28Date || null,
                    d0Status:  'pending',
                    d3Status:  'pending',
                    d7Status:  'pending',
                    d14Status: 'pending',
                    d28Status: 'pending',
                    treatmentStatus: 'in_progress'
                });
                await vaxRecord.save();
                console.log('VaccinationDate record created for biteCase:', savedDoc._id);
            } catch (vaxErr) {
                console.error('Warning: BiteCase saved but VaccinationDate creation failed:', vaxErr);
                // Do not fail the whole request — return the bite case with a warning
                return res.status(201).json({
                    success: true,
                    data: savedDoc,
                    warning: 'Bite case saved, but vaccination schedule could not be created: ' + vaxErr.message
                });
            }
        }

        return res.status(201).json({ success: true, data: savedDoc });
    } catch (error) {
        console.error('Error creating bitecase:', error);
        return res.status(500).json({ success: false, message: 'Failed to create bitecase', error: error.message });
    }
});

// ─── PUT /api/bitecases/:id/diagnosis ────────────────────────────────────────
// Upsert management / diagnosis sub-fields on a BiteCase document.
router.put('/api/bitecases/:id/diagnosis', async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};
        const update = { $set: { ...body, updatedAt: new Date() } };
        const doc = await BiteCase.findByIdAndUpdate(id, update, { new: true });
        if (!doc) return res.status(404).json({ success: false, message: 'Bite case not found' });
        return res.json({ success: true, data: doc });
    } catch (error) {
        console.error('Error updating diagnosis:', error);
        return res.status(500).json({ success: false, message: 'Failed to update diagnosis' });
    }
});

// ─── PUT /api/bitecases/:id ───────────────────────────────────────────────────
// Generic update for BiteCase fields (patient info, management, immunization,
// animalProfile, status, etc.).  Dose-day scheduling is handled in
// vaccinationSchedule.js — this endpoint no longer cascades dose dates.
router.put('/api/bitecases/:id', async (req, res) => {
    try {
        console.log('🔍 PUT /api/bitecases/:id called with:', { id: req.params.id, body: req.body });
        const { id } = req.params;
        const body = req.body || {};

        // Strip any dose-day fields that accidentally end up here — they must
        // be updated through /api/vaccinationdates/:id instead.
        ['d0Date','d3Date','d7Date','d14Date','d28Date',
         'd0Status','d3Status','d7Status','d14Status','d28Status'].forEach(k => delete body[k]);

        const existing = await BiteCase.findById(id);
        if (!existing) return res.status(404).json({ success: false, message: 'Bite case not found' });

        const update = { $set: { ...body, updatedAt: new Date() } };
        const doc = await BiteCase.findByIdAndUpdate(id, update, { new: true });
        if (!doc) return res.status(404).json({ success: false, message: 'Bite case not found' });

        console.log('🔍 Updated bite case:', doc._id);
        return res.json({ success: true, data: doc });
    } catch (error) {
        console.error('Error updating bitecase:', error);
        return res.status(500).json({ success: false, message: 'Failed to update bitecase' });
    }
});

// ─── DELETE /api/bitecases/:id ────────────────────────────────────────────────
// Delete a bite case and its associated VaccinationDate record(s).
router.delete('/api/bitecases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await BiteCase.findByIdAndDelete(id);
        if (!doc) return res.status(404).json({ success: false, message: 'Bite case not found' });

        // Cascade-delete linked vaccination records
        await VaccinationDate.deleteMany({ biteCaseId: String(id) });

        console.log('✅ Deleted bite case and associated vaccination records:', id);
        return res.json({ success: true, message: 'Bite case deleted successfully' });
    } catch (error) {
        console.error('Error deleting bitecase:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete bitecase' });
    }
});

module.exports = router;
