const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Patient = require('../models/Patient');
const BiteCase = require('../models/BiteCase');
const { logAuditTrail } = require('../utils/helpers');

// --- PATIENT REGISTRATION ENDPOINT ---
router.post('/api/patients', async (req, res) => {
    try {
        console.log('Creating patient with payload:', req.body);

        const {
            firstName,
            middleName,
            lastName,
            email,
            phone,
            birthdate,
            sex,
            password,
            houseNo,
            street,
            barangay,
            subdivision,
            city,
            province,
            zipCode,
            birthPlace,
            religion,
            occupation,
            nationality,
            civilStatus,
            role = 'Patient',
            isVerified = true,
            ...rest
        } = req.body;

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'sex', 'password'];
        const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');

        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Check if email already exists
        const existingPatient = await Patient.findOne({ email: email.toLowerCase() });

        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: 'This email address is already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate patient ID as PAT-<initials><year><4-digit sequence>
        const yearNow = new Date().getFullYear();
        const initials = [firstName, middleName, lastName]
            .filter(Boolean)
            .map(v => String(v).trim()[0] || '')
            .join('')
            .toUpperCase() || 'PTN';
        let patientId = '';
        try {
            const seqPrefix = `PAT-${initials}${yearNow}`;
            const countSamePrefix = await Patient.countDocuments({ patientId: { $regex: `^${seqPrefix}` } });
            const nextSeq = String(countSamePrefix + 1).padStart(4, '0');
            patientId = `${seqPrefix}${nextSeq}`;
        } catch (_) {
            patientId = `PAT-${initials}${yearNow}${String(Date.now()).slice(-4)}`;
        }

        // Create new patient
        const newPatient = new Patient({
            firstName,
            middleName,
            lastName,
            email: email.toLowerCase(),
            phone,
            birthdate: birthdate ? new Date(birthdate) : null,
            sex,
            password: hashedPassword,
            houseNo,
            street,
            barangay,
            subdivision,
            city: city || 'San Juan City',
            province: province || 'Metro Manila',
            zipCode: zipCode || '1500',
            birthPlace,
            religion,
            occupation,
            nationality: nationality || 'Filipino',
            civilStatus,
            role,
            isVerified,
            patientId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'active',
            ...rest
        });

        await newPatient.save();

        console.log('Patient created successfully:', newPatient._id);

        // Log audit trail for patient registration
        try {
            await logAuditTrail(
                'patient',
                newPatient.firstName,
                newPatient.middleName,
                newPatient.lastName,
                'Registered',
                { patientID: newPatient.patientId },
                newPatient.center || newPatient.centerName || newPatient.barangay || null
            );
        } catch (auditError) {
            console.warn('Audit logging failed:', auditError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            patient: {
                _id: newPatient._id,
                patientId: newPatient.patientId,
                firstName: newPatient.firstName,
                lastName: newPatient.lastName,
                email: newPatient.email,
                phone: newPatient.phone,
                sex: newPatient.sex,
                createdAt: newPatient.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create patient: ' + error.message
        });
    }
});

// --- PATIENT LIST & FETCH ENDPOINTS ---
router.get('/api/patients', async (req, res) => {
    try {
        const { q, status, vaccinationDay, barangay, dateFilter, vaccinationDate, page = 1, limit = 20, sort = '-createdAt', center } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

        let filter = {};

        // Handle center filtering for role-based access
        if (center) {
            filter.center = center;
        }

        // Handle vaccination day filtering
        if (vaccinationDay) {
            // First, find bite cases that have the specified vaccination day
            const biteCaseFilter = {};

            // Map vaccination day to the corresponding date field
            const vaccinationDateFields = {
                'day0': ['day0Date', 'day0_date', 'd0Date'],
                'day3': ['day3Date', 'day3_date', 'd3Date'],
                'day7': ['day7Date', 'day7_date', 'd7Date'],
                'day14': ['day14Date', 'day14_date', 'd14Date'],
                'day28': ['day28Date', 'day28_date', 'd28Date']
            };

            const dateFields = vaccinationDateFields[vaccinationDay] || [];
            if (dateFields.length > 0) {
                if (vaccinationDate) {
                    // If specific vaccination date is provided, filter by that date
                    const selectedDate = new Date(vaccinationDate);
                    const startOfDay = new Date(selectedDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(selectedDate);
                    endOfDay.setHours(23, 59, 59, 999);

                    biteCaseFilter.$or = dateFields.map(field => ({
                        [field]: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        }
                    }));
                } else {
                    // If no specific date, just check if the vaccination day exists
                    biteCaseFilter.$or = dateFields.map(field => ({ [field]: { $exists: true, $ne: null } }));
                }
            }

            // Find bite cases with the specified vaccination day
            const biteCases = await BiteCase.find(biteCaseFilter);

            // Extract patient IDs from bite cases
            const patientIds = biteCases.map(case_ => {
                // Try to match by patient ID, registration number, or name
                return case_.patientId || case_.patientID || case_._id;
            }).filter(Boolean);

            if (patientIds.length > 0) {
                filter._id = { $in: patientIds };
            } else {
                // If no bite cases found, return empty result
                return res.json({
                    success: true,
                    data: [],
                    page: pageNumber,
                    limit: pageSize,
                    total: 0,
                    totalPages: 0
                });
            }
        }

        // Handle other filters
        if (status && status !== 'all') {
            filter.status = status;
        }

        if (barangay) {
            filter.barangay = { $regex: barangay, $options: 'i' };
        }

        if (dateFilter) {
            const selectedDate = new Date(dateFilter);
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            filter.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        if (q && q.trim()) {
            const term = q.trim();
            filter.$or = [
                { firstName: { $regex: term, $options: 'i' } },
                { middleName: { $regex: term, $options: 'i' } },
                { lastName: { $regex: term, $options: 'i' } },
                { contactNumber: { $regex: term, $options: 'i' } },
                { address: { $regex: term, $options: 'i' } }
            ];
        }

        const total = await Patient.countDocuments(filter);
        const patients = await Patient.find(filter)
            .sort(sort)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        // Calculate age from birthdate for each patient
        const patientsWithAge = patients.map(patient => {
            let age = '';
            if (patient.birthdate) {
                const birthDate = new Date(patient.birthdate);
                const today = new Date();
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }

                age = calculatedAge.toString();
            }

            return {
                ...patient.toObject(),
                age: age
            };
        });

        res.json({
            success: true,
            data: patientsWithAge,
            page: pageNumber,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/api/patients/:id', async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PATIENT UPDATE ENDPOINT ---
router.put('/api/patients/:id', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        // Log audit trail for patient update
        await logAuditTrail(
            'patient',
            patient.firstName,
            patient.middleName,
            patient.lastName,
            'Updated profile',
            { patientID: patient.patientId }
        );
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PATIENT STATUS CHANGE (DEACTIVATE/ACTIVATE) ---
router.post('/api/patients/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'active', 'inactive', 'deceased'
        const patient = await Patient.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        // Log audit trail for status change
        await logAuditTrail(
            'patient',
            patient.firstName,
            patient.middleName,
            patient.lastName,
            `Status changed to ${status}`,
            { patientID: patient.patientId }
        );
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get patient password endpoint
router.get('/api/get-patient-password/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id).select('password');

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json({ success: true, password: patient.password });
    } catch (error) {
        console.error('Error getting patient password:', error);
        res.status(500).json({ error: error.message });
    }
});

// Change patient password endpoint
router.post('/api/change-patient-password', async (req, res) => {
    try {
        const { patientId, newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const patient = await Patient.findByIdAndUpdate(patientId, { password: hashedPassword });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing patient password:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
