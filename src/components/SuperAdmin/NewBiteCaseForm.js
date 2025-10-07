import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../config/api';

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">New Bite Case</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => handleInputChange('birthdate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
                  <input
                    type="text"
                    value={formData.contactNo}
                    onChange={(e) => handleInputChange('contactNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House No.</label>
                  <input
                    type="text"
                    value={formData.houseNo}
                    onChange={(e) => handleInputChange('houseNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                  <input
                    type="text"
                    value={formData.barangay}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bite Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bite Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Inquiry</label>
                  <input
                    type="date"
                    value={formData.dateOfInquiry}
                    onChange={(e) => handleInputChange('dateOfInquiry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Injury</label>
                  <select
                    value={formData.timeOfInjury}
                    onChange={(e) => handleInputChange('timeOfInjury', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Exposure</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.typeOfExposure.includes('BITE')}
                      onChange={(e) => handleArrayChange('typeOfExposure', 'BITE', e.target.checked)}
                      className="mr-2"
                    />
                    BITE
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.typeOfExposure.includes('NON-BITE')}
                      onChange={(e) => handleArrayChange('typeOfExposure', 'NON-BITE', e.target.checked)}
                      className="mr-2"
                    />
                    NON-BITE
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Site of Bite *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Head', 'Face', 'Neck', 'Chest', 'Back', 'Abdomen', 'Upper Extremities', 'Lower Extremities'].map(site => (
                    <label key={site} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.siteOfBite.includes(site)}
                        onChange={(e) => handleArrayChange('siteOfBite', site, e.target.checked)}
                        className="mr-2"
                      />
                      {site}
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
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Profile</h3>
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
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Management</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                  <textarea
                    value={formData.management.diagnosis}
                    onChange={(e) => handleNestedChange('management', 'diagnosis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergy History</label>
                  <textarea
                    value={formData.management.allergyHistory}
                    onChange={(e) => handleNestedChange('management', 'allergyHistory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Management Details</label>
                  <textarea
                    value={formData.management.managementDetails}
                    onChange={(e) => handleNestedChange('management', 'managementDetails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Case'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewBiteCaseForm;
