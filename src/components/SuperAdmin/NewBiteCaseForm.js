import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../config/api';
import './NewBiteCaseForm.css';

const NewBiteCaseForm = ({ selectedPatient, onSaved, onCancel }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [centers, setCenters] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    middleName: '',
    lastName: '',
    birthdate: '',
    sex: '',
    age: '',
    weight: '',
    birthPlace: '',
    civilStatus: '',
    nationality: '',
    religion: '',
    occupation: '',
    contactNo: '',
    
    // Address
    houseNo: '',
    street: '',
    barangay: '',
    subdivision: '',
    city: '',
    province: '',
    zipCode: '',
    
    // Bite Information
    dateOfInquiry: new Date().toISOString().split('T')[0],
    timeOfInjury: 'AM',
    typeOfExposure: ['BITE'],
    siteOfBite: [],
    othersBiteSpecify: '',
    natureOfInjury: [],
    burnDegree: 1,
    burnSite: '',
    othersInjuryDetails: '',
    externalCause: [],
    biteStingDetails: '',
    chemicalSubstanceDetails: '',
    placeOfOccurrence: ['Home'],
    placeOthersDetails: '',
    disposition: ['Treated & Sent Home'],
    transferredTo: '',
    circumstanceOfBite: ['Provoked'],
    
    // Animal Profile
    animalProfile: {
      species: ['Dog'],
      othersSpecify: '',
      clinicalStatus: ['Healthy'],
      brainExam: [],
      vaccinationStatus: ['Not Immunized'],
      vaccinationDate: '',
      ownership: ['Pet']
    },
    
    // Management
    management: {
      washingWound: ['Yes'],
      category: ['Category 2'],
      diagnosis: 'Okay na',
      allergyHistory: 'None',
      maintenanceMedications: '',
      managementDetails: 'Sent Home'
    },
    
    // Immunization
    patientImmunization: {
      dpt: [],
      dptYearGiven: null,
      dptDosesGiven: null,
      tt: [],
      ttDates: [],
      skinTest: false,
      skinTestTime: null,
      skinTestReadTime: null,
      skinTestResult: null,
      skinTestDose: null,
      skinTestDate: null,
      tig: false,
      tigDose: null,
      tigDate: null
    },
    
    currentImmunization: {
      type: ['Active', 'Previously Immunized'],
      vaccine: ['PVRV'],
      route: ['ID'],
      passive: false,
      skinTest: false,
      skinTestTime: '',
      skinTestReadTime: '',
      skinTestResult: '',
      skinTestDate: '',
      hrig: false,
      hrigDose: '',
      hrigDate: '',
      localInfiltration: false,
      schedule: [],
      doseMedicines: [{
        dose: 'D0',
        medicineUsed: 'SPEEDA (BOOSTER)',
        branchNo: '002'
      }],
      erig: {
        dateTaken: '',
        medicineUsed: '',
        branchNo: ''
      }
    }
  });

  // Generate registration number and dates
  const [registrationNumber] = useState(() => {
    const yy = String(new Date().getFullYear()).slice(2);
    const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const tail = String(Date.now()).slice(-2);
    return `${yy}-${rnd}${tail}`;
  });

  const [dateRegistered] = useState(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  const [center] = useState(() => {
    return selectedPatient?.barangay ? 
      (selectedPatient.barangay.endsWith('Center') ? selectedPatient.barangay : `${selectedPatient.barangay} Center`) : 
      'Batis Center';
  });

  // Generate vaccination schedule
  const [schedule] = useState(() => {
    const base = new Date();
    const toISO = (d) => d.toISOString().split('T')[0];
    return {
      d0: toISO(base),
      d3: toISO(new Date(base.getTime() + 3 * 86400000)),
      d7: toISO(new Date(base.getTime() + 7 * 86400000)),
      d14: toISO(new Date(base.getTime() + 14 * 86400000)),
      d28: toISO(new Date(base.getTime() + 28 * 86400000))
    };
  });

  // Load centers
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const response = await apiFetch('/api/centers');
        const data = await response.json();
        if (data.success && data.data) {
          setCenters(data.data);
        }
      } catch (error) {
        console.error('Error loading centers:', error);
        setCenters([
          { _id: '1', name: 'Balong-Bato Center' },
          { _id: '2', name: 'Salapan Center' },
          { _id: '3', name: 'San Juan Center' }
        ]);
      }
    };
    loadCenters();
  }, []);

  // Populate form with patient data
  useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({
        ...prev,
        firstName: selectedPatient.firstName || '',
        middleName: selectedPatient.middleName || '',
        lastName: selectedPatient.lastName || '',
        birthdate: selectedPatient.birthdate ? new Date(selectedPatient.birthdate).toISOString().split('T')[0] : '',
        sex: selectedPatient.sex || '',
        age: selectedPatient.birthdate ? String(new Date().getFullYear() - new Date(selectedPatient.birthdate).getFullYear()) : '',
        contactNo: selectedPatient.phone || '',
        birthPlace: selectedPatient.birthPlace || '',
        civilStatus: selectedPatient.civilStatus || '',
        nationality: selectedPatient.nationality || '',
        religion: selectedPatient.religion || '',
        occupation: selectedPatient.occupation || '',
        houseNo: selectedPatient.houseNo || '',
        street: selectedPatient.street || '',
        barangay: selectedPatient.barangay || '',
        subdivision: selectedPatient.subdivision || '',
        city: selectedPatient.city || '',
        province: selectedPatient.province || '',
        zipCode: selectedPatient.zipCode || ''
      }));
    }
  }, [selectedPatient]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleNestedChange = useCallback((parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  }, []);

  const handleArrayChange = useCallback((field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  }, []);

  // Validation
  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.sex) {
      return 'Basic information is incomplete';
    }
    if (!formData.barangay || !formData.city || !formData.province) {
      return 'Address is incomplete';
    }
    if (formData.siteOfBite.length === 0) {
      return 'Please select at least one bite site';
    }
    if (formData.natureOfInjury.length === 0) {
      return 'Please select at least one injury type';
    }
    return '';
  };

  // Save function
  const handleSave = async () => {
    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Convert dates to ISO format
      const toIsoUtcNoon = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
      };

      const payload = {
        patientId: selectedPatient?._id || selectedPatient?.patientId,
        registrationNumber,
        philhealthNo: '',
        dateRegistered: toIsoUtcNoon(dateRegistered),
        arrivalDate: formData.dateOfInquiry ? new Date(formData.dateOfInquiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null,
        arrivalTime: formData.timeOfInjury || null,
        firstName: formData.firstName,
        middleName: formData.middleName || '',
        lastName: formData.lastName,
        civilStatus: formData.civilStatus || null,
        birthdate: toIsoUtcNoon(formData.birthdate),
        birthplace: formData.birthPlace || null,
        nationality: formData.nationality || null,
        religion: formData.religion || null,
        occupation: formData.occupation || null,
        contactNo: formData.contactNo || null,
        houseNo: formData.houseNo,
        street: formData.street,
        barangay: formData.barangay,
        subdivision: formData.subdivision,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,
        age: formData.age,
        weight: formData.weight,
        sex: formData.sex,
        center,
        scheduleDates: [schedule.d0, schedule.d3, schedule.d7, schedule.d14, schedule.d28].map(toIsoUtcNoon).filter(Boolean),
        animalStatus: 'Alive',
        remarks: 'Completed',
        dateOfInquiry: formData.dateOfInquiry ? new Date(formData.dateOfInquiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null,
        timeOfInjury: formData.timeOfInjury || null,
        typeOfExposure: formData.typeOfExposure,
        siteOfBite: formData.siteOfBite,
        othersBiteSpecify: formData.othersBiteSpecify || '',
        natureOfInjury: formData.natureOfInjury,
        burnDegree: formData.burnDegree,
        burnSite: formData.burnSite || '',
        othersInjuryDetails: formData.othersInjuryDetails || '',
        externalCause: formData.externalCause,
        biteStingDetails: formData.biteStingDetails || '',
        chemicalSubstanceDetails: formData.chemicalSubstanceDetails || '',
        placeOfOccurrence: formData.placeOfOccurrence,
        placeOthersDetails: formData.placeOthersDetails || '',
        disposition: formData.disposition,
        transferredTo: formData.transferredTo || '',
        circumstanceOfBite: formData.circumstanceOfBite,
        animalProfile: formData.animalProfile,
        management: formData.management,
        patientImmunization: formData.patientImmunization,
        currentImmunization: formData.currentImmunization,
        status: 'completed',
        initiallyAssessedBy: 'Duke Reyes',
        finalAssessedBy: 'Duke Reyes'
      };

      const res = await apiFetch('/api/bitecases', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      const created = await res.json();
      if (!res.ok || !created?.success && !created?._id) {
        throw new Error(created?.message || 'Failed to create bitecase');
      }

      const biteCaseId = created._id || created.data?._id;

      // Create vaccination dates
      const vdates = {
        biteCaseId,
        patientId: payload.patientId,
        registrationNumber,
        d0Date: toIsoUtcNoon(schedule.d0),
        d3Date: toIsoUtcNoon(schedule.d3),
        d7Date: toIsoUtcNoon(schedule.d7),
        d14Date: toIsoUtcNoon(schedule.d14),
        d28Date: toIsoUtcNoon(schedule.d28),
        d0Status: 'completed',
        d3Status: 'scheduled',
        d7Status: 'scheduled',
        d14Status: 'scheduled',
        d28Status: 'scheduled',
        treatmentStatus: 'in_progress',
        exposureCategory: 'Category 2',
        lastTreatmentDate: null
      };

      const res2 = await apiFetch('/api/vaccinationdates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vdates)
      });
      await res2.json().catch(() => ({}));

      if (onSaved) onSaved(created);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-bite-case-form">
      <div className="form-container">
        {/* Header */}
        <div className="form-header">
          <div className="form-header-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="form-title">New Bite Case</h1>
          <p className="form-subtitle">Create a new bite case record for patient treatment</p>
        </div>

        <div className="form-card">
          {/* Progress Indicator */}
          <div className="progress-bar">
            <div className="progress-steps">
              <div className="progress-step active">
                <div className="step-dot"></div>
                <span className="step-text">Patient Information</span>
              </div>
              <div className="progress-step inactive">
                <div className="step-dot"></div>
                <span className="step-text">Bite Details</span>
              </div>
              <div className="progress-step inactive">
                <div className="step-dot"></div>
                <span className="step-text">Management</span>
              </div>
            </div>
          </div>

          <div className="form-content">
            {error && (
              <div className="error-message">
                <div className="error-content">
                  <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="error-text">{error}</p>
                </div>
              </div>
            )}

            <form>
            {/* Basic Information */}
            <div className="form-section section-blue">
              <div className="section-header">
                <div className="section-icon" style={{backgroundColor: '#3b82f6'}}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="section-title">Patient Information</h3>
                  <p className="section-description">Basic patient details and contact information</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 bg-opacity-50 text-gray-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Registered</label>
                  <input
                    type="text"
                    value={dateRegistered}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <input
                    type="text"
                    value={center}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => handleInputChange('birthdate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    required
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
                  <input
                    type="text"
                    value={formData.contactNo}
                    onChange={(e) => handleInputChange('contactNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Address Information</h3>
                  <p className="text-xs text-gray-600">Patient's residential address details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House No.</label>
                  <input
                    type="text"
                    value={formData.houseNo}
                    onChange={(e) => handleInputChange('houseNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                  <input
                    type="text"
                    value={formData.barangay}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bite Information */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Bite Information</h3>
                  <p className="text-xs text-gray-600">Details about the bite incident and injury</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Inquiry</label>
                  <input
                    type="date"
                    value={formData.dateOfInquiry}
                    onChange={(e) => handleInputChange('dateOfInquiry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Injury</label>
                  <select
                    value={formData.timeOfInjury}
                    onChange={(e) => handleInputChange('timeOfInjury', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Exposure</label>
                <div className="flex space-x-4">
                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={formData.typeOfExposure.includes('BITE')}
                      onChange={(e) => handleArrayChange('typeOfExposure', 'BITE', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">BITE</span>
                  </label>
                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={formData.typeOfExposure.includes('NON-BITE')}
                      onChange={(e) => handleArrayChange('typeOfExposure', 'NON-BITE', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">NON-BITE</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Site of Bite *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Head', 'Face', 'Neck', 'Chest', 'Back', 'Abdomen', 'Upper Extremities', 'Lower Extremities'].map(site => (
                    <label key={site} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 cursor-pointer transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={formData.siteOfBite.includes(site)}
                        onChange={(e) => handleArrayChange('siteOfBite', site, e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">{site}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nature of Injury *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Multiple Injuries', 'Abrasion', 'Avulsion', 'Burn', 'Concussion', 'Contusion', 'Open Wound', 'Trauma'].map(injury => (
                    <label key={injury} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.natureOfInjury.includes(injury)}
                        onChange={(e) => handleArrayChange('natureOfInjury', injury, e.target.checked)}
                        className="mr-2"
                      />
                      {injury}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Animal Profile */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Animal Profile</h3>
                  <p className="text-xs text-gray-600">Information about the animal involved in the incident</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
                  <div className="space-y-2">
                    {['Dog', 'Cat', 'Others'].map(species => (
                      <label key={species} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.animalProfile.species.includes(species)}
                          onChange={(e) => {
                            const newSpecies = e.target.checked 
                              ? [...formData.animalProfile.species, species]
                              : formData.animalProfile.species.filter(s => s !== species);
                            handleNestedChange('animalProfile', 'species', newSpecies);
                          }}
                          className="mr-2"
                        />
                        {species}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Status</label>
                  <div className="space-y-2">
                    {['Healthy', 'Sick', 'Died', 'Killed'].map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.animalProfile.clinicalStatus.includes(status)}
                          onChange={(e) => {
                            const newStatus = e.target.checked 
                              ? [...formData.animalProfile.clinicalStatus, status]
                              : formData.animalProfile.clinicalStatus.filter(s => s !== status);
                            handleNestedChange('animalProfile', 'clinicalStatus', newStatus);
                          }}
                          className="mr-2"
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Management */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">Treatment Management</h3>
                  <p className="text-xs text-gray-600">Medical diagnosis and treatment plan</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                  <textarea
                    value={formData.management.diagnosis}
                    onChange={(e) => handleNestedChange('management', 'diagnosis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergy History</label>
                  <textarea
                    value={formData.management.allergyHistory}
                    onChange={(e) => handleNestedChange('management', 'allergyHistory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Management Details</label>
                  <textarea
                    value={formData.management.managementDetails}
                    onChange={(e) => handleNestedChange('management', 'managementDetails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 text-sm"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Case
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default NewBiteCaseForm;
