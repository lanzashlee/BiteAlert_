import React, { useState, useEffect } from "react";

export default function PatientDiagnosisManagement({ selectedPatient }) {
  const [centers, setCenters] = useState([]);
  const [formData, setFormData] = useState({
    // Registration
    registrationNumber: '',
    philhealthNo: '',
    weight: '',
    arrivalDate: '',
    arrivalTime: '',
    civilStatus: '',
    birthPlace: '',
    nationality: '',
    religion: '',
    occupation: '',
    
    // Patient Information
    lastName: '',
    firstName: '',
    middleName: '',
    birthdate: '',
    age: '',
    sex: '',
    contactNo: '',
    
    // Address Information
    houseNo: '',
    street: '',
    barangay: '',
    subdivision: '',
    city: '',
    province: '',
    zipCode: '',
    permanentAddress: '',
    
    // Center
    center: 'Batis Center',
    
    // History of Bite
    typeNonBite: false,
    typeBite: false,
    biteSites: {
      head: false,
      face: false,
      neck: false,
      chest: false,
      back: false,
      abdomen: false,
      upperExtremities: false,
      lowerExtremities: false,
      others: false
    },
    othersBiteSpecify: '',
    dateOfInjury: '',
    dateOfInquiry: '',
    timeOfInjury: '',
    natureOfInjuries: {
      multipleInjuries: false,
      abrasion: false,
      avulsion: false,
      burn: false,
      concussion: false,
      contusion: false,
      openWound: false,
      trauma: false,
      others: false
    },
    burnDegree: 1,
    burnSite: '',
    othersInjuryDetails: '',
    
    // External Causes
    externalCauses: {
      biteSting: false,
      chemicalSubstance: false
    },
    biteStingDetails: '',
    chemicalSubstanceDetails: '',
    
    // Place of Occurrence
    placeOfOccurrence: {
      home: false,
      school: false,
      road: false,
      neighbor: false,
      others: false
    },
    placeOthersDetails: '',
    
    // Disposition
    disposition: {
      treatedSentHome: false,
      transferred: false
    },
    transferredTo: '',
    
    // Circumstance of Bite
    circumstanceProvoked: false,
    circumstanceUnprovoked: false,
    
    // Animal Profile
    animalType: {
      dog: false,
      cat: false,
      others: false
    },
    otherAnimal: '',
    animalStatus: {
      healthy: false,
      sick: false,
      died: false,
      killed: false
    },
    brainExam: {
      brainExamDone: false,
      noBrainExam: false,
      unknown: false
    },
    vaccinationStatus: {
      immunized: false,
      notImmunized: false,
      unknown: false
    },
    vaccinationDate: '',
    ownership: {
      pet: false,
      neighbor: false,
      stray: false
    },
    
    // Management
    washingWound: {
      yes: false,
      no: false
    },
    category: {
      category1: false,
      category2: false,
      category3: false
    },
    
    // Allergies & Medications
    allergyHistory: '',
    maintenanceMedications: '',
    
    // Diagnosis & Management
    diagnosis: '',
    managementDetails: '',
    
    // Patient Immunization
    patientImmunization: {
      dpt: {
        complete: false,
        incomplete: false,
        none: false
      },
      dptYearGiven: '',
      dptDosesGiven: '',
      tt: {
        active: false,
        passive: false
      },
      ttDates: ['', '', ''], // TT1, TT2, TT3
      skinTest: false,
      skinTestTime: '',
      skinTestReadTime: '',
      skinTestResult: '',
      tig: false,
      tigDose: '',
      tigDate: '',
      // Signatures
      ttRnSignatures: ['', '', ''],
      skinTestMdSignature: '',
      tigMdSignature: ''
    },
    
    // ERIG Section
    erig: {
      dateTaken: '',
      medicineUsed: '',
      branchNo: ''
    },
    
    // Current Anti-Rabies Immunization
    currentImmunization: {
      type: {
        active: false,
        postExposure: false,
        preExposure: false,
        previouslyImmunized: false
      },
      vaccine: {
        pvrv: false,
        pcec: false
      },
      route: {
        id: false,
        im: false
      },
      passive: false,
      skinTest: false,
      skinTestTime: '',
      skinTestReadTime: '',
      skinTestResult: '',
      skinTestMdSignature: '',
      hrig: false,
      hrigDose: '',
      hrigDate: '',
      hrigMdSignature: '',
      localInfiltration: false,
      schedule: {
        structured: false,
        unstructured: false
      },
      medicineUsed: '',
      branchNo: '',
      scheduleRnSignatures: { d0: '', d3: '', d7: '', d14: '', d28: '' }
    },
    
    // Immunization Schedule
    scheduleDates: {
      d0: '',
      d3: '',
      d7: '',
      d14: '',
      d28: ''
    },
    
    // Additional fields from schema
    animalStatus: '',
    remarks: '',
    
    // Follow-up
    followUp: [
      { date: '', findings: '', management: '', mdSignature: '' },
      { date: '', findings: '', management: '', mdSignature: '' },
      { date: '', findings: '', management: '', mdSignature: '' }
    ],
    
    // Conformed
    patientSignature: '',
    witnessSignature: ''
  });

  const [caseHistory, setCaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientRegistrationNumber, setPatientRegistrationNumber] = useState('');
  const [newCaseAdded, setNewCaseAdded] = useState(false);

  // Load patient data when component mounts or selectedPatient changes
  useEffect(() => {
    if (selectedPatient) {
      setNewCaseAdded(false); // Reset new case flag when patient changes
      loadCaseHistory();
    }
  }, [selectedPatient]);

  // Load centers for disposition dropdown
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const res = await fetch('/api/centers');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json.data || []);
          setCenters(list);
        }
      } catch (_) {}
    };
    loadCenters();
  }, []);


  const loadCaseHistory = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    try {
      // Debug: Log selectedPatient to see available fields
      console.log('Selected Patient Data:', selectedPatient);
      console.log('Registration Number:', selectedPatient.registrationNumber);
      console.log('PhilHealth No:', selectedPatient.philhealthNo);
      
      // First, populate basic patient info immediately
      setFormData(prev => ({
        ...prev,
        // Registration - populate from patient data first (try multiple field names)
        registrationNumber: selectedPatient.registrationNumber || selectedPatient.regNo || selectedPatient.registration_no || selectedPatient.regNumber || '',
        philhealthNo: selectedPatient.philhealthNo || selectedPatient.philhealth_no || selectedPatient.philhealthNumber || '',
        
        // Patient Information - populate from selectedPatient
        lastName: selectedPatient.lastName || '',
        firstName: selectedPatient.firstName || '',
        middleName: selectedPatient.middleName || '',
        birthdate: selectedPatient.birthdate ? new Date(selectedPatient.birthdate).toISOString().split('T')[0] : '',
        age: selectedPatient.age || '',
        sex: selectedPatient.sex || '',
        contactNo: selectedPatient.phone || selectedPatient.contactNo || '',
        
        // Address Information - populate from selectedPatient
        houseNo: selectedPatient.houseNo || '',
        street: selectedPatient.street || '',
        barangay: selectedPatient.barangay || '',
        subdivision: selectedPatient.subdivision || '',
        city: selectedPatient.city || '',
        province: selectedPatient.province || '',
        zipCode: selectedPatient.zipCode || '',
        
        // Additional patient info
        civilStatus: selectedPatient.civilStatus || '',
        birthPlace: selectedPatient.birthPlace || '',
        nationality: selectedPatient.nationality || '',
        religion: selectedPatient.religion || '',
        occupation: selectedPatient.occupation || ''
      }));
      
      // Set patient registration number for display (try multiple field names)
      setPatientRegistrationNumber(selectedPatient.registrationNumber || selectedPatient.regNo || selectedPatient.registration_no || selectedPatient.regNumber || '');
      
      const response = await fetch('/api/bitecases');
      const data = await response.json();
      const cases = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      
      // Filter cases for this patient
      const patientId = selectedPatient._id || selectedPatient.patientId;
      const regNumber = selectedPatient.registrationNumber;
      const patientName = [selectedPatient.firstName, selectedPatient.middleName, selectedPatient.lastName].filter(Boolean).join(' ').toLowerCase();
      
      const filteredCases = cases.filter(c => {
        const casePatientId = c.patientId || c.patientID;
        const caseRegNumber = c.registrationNumber;
        const casePatientName = [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ').toLowerCase();
        
        if (patientId && casePatientId && patientId === casePatientId) return true;
        if (regNumber && caseRegNumber && regNumber === caseRegNumber) return true;
        if (patientName && casePatientName && patientName === casePatientName) return true;
        
        return false;
      });
      
      // Get registration number and populate form with existing case data
      if (filteredCases.length > 0) {
        const latestCase = filteredCases[0]; // Most recent case
        setPatientRegistrationNumber(latestCase.registrationNumber || '');
        
        // Pre-populate form with existing case data based on actual database structure
        setFormData(prev => ({
          ...prev,
          // Registration - prioritize case data, fallback to patient data (try multiple field names)
          registrationNumber: latestCase.registrationNumber || selectedPatient.registrationNumber || selectedPatient.regNo || selectedPatient.registration_no || selectedPatient.regNumber || '',
          philhealthNo: latestCase.philhealthNo || selectedPatient.philhealthNo || selectedPatient.philhealth_no || selectedPatient.philhealthNumber || '',
          weight: latestCase.weight || '',
          arrivalDate: latestCase.arrivalDate || '',
          arrivalTime: latestCase.arrivalTime || '',
          civilStatus: latestCase.civilStatus || '',
          birthPlace: latestCase.birthplace || '',
          nationality: latestCase.nationality || '',
          religion: latestCase.religion || '',
          occupation: latestCase.occupation || '',
          
          // Patient Information
          lastName: latestCase.lastName || selectedPatient.lastName || '',
          firstName: latestCase.firstName || selectedPatient.firstName || '',
          middleName: latestCase.middleName || selectedPatient.middleName || '',
          birthdate: latestCase.birthdate ? new Date(latestCase.birthdate).toISOString().split('T')[0] : (selectedPatient.birthdate ? new Date(selectedPatient.birthdate).toISOString().split('T')[0] : ''),
          age: latestCase.age || selectedPatient.age || '',
          sex: latestCase.sex || selectedPatient.sex || '',
          // Address Information
          houseNo: latestCase.houseNo || '',
          street: latestCase.street || '',
          barangay: latestCase.barangay || '',
          subdivision: latestCase.subdivision || '',
          city: latestCase.city || '',
          province: latestCase.province || '',
          zipCode: latestCase.zipCode || '',
          center: latestCase.center || 'Batis Center',
          contactNo: latestCase.contactNo || selectedPatient.phone || '',
          
          // History of Bite - based on typeOfExposure array
          typeNonBite: Array.isArray(latestCase.typeOfExposure) && latestCase.typeOfExposure.includes('NON-BITE'),
          typeBite: Array.isArray(latestCase.typeOfExposure) && latestCase.typeOfExposure.includes('BITE'),
          biteSites: {
            head: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Head'),
            face: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Face'),
            neck: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Neck'),
            chest: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Chest'),
            back: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Back'),
            abdomen: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Abdomen'),
            upperExtremities: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Upper Extremities'),
            lowerExtremities: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Lower Extremities'),
            others: Array.isArray(latestCase.siteOfBite) && latestCase.siteOfBite.includes('Others')
          },
          othersBiteSpecify: latestCase.othersBiteSpecify || '',
          dateOfInjury: latestCase.dateOfInquiry || '',
          timeOfInjury: latestCase.timeOfInjury || '',
          natureOfInjuries: {
            multipleInjuries: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Multiple Injuries'),
            abrasion: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Abrasion'),
            avulsion: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Avulsion'),
            burn: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Burn'),
            concussion: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Concussion'),
            contusion: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Contusion'),
            openWound: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Open Wound'),
            trauma: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Trauma'),
            others: Array.isArray(latestCase.natureOfInjury) && latestCase.natureOfInjury.includes('Others')
          },
          burnDegree: latestCase.burnDegree || 1,
          burnSite: latestCase.burnSite || '',
          othersInjuryDetails: latestCase.othersInjuryDetails || '',
          
          // External Causes - based on externalCause array
          externalCauses: {
            biteSting: Array.isArray(latestCase.externalCause) && latestCase.externalCause.includes('Bite/Sting'),
            chemicalSubstance: Array.isArray(latestCase.externalCause) && latestCase.externalCause.includes('Chemical Substance')
          },
          biteStingDetails: latestCase.biteStingDetails || '',
          chemicalSubstanceDetails: latestCase.chemicalSubstanceDetails || '',
          
          // Place of Occurrence - based on placeOfOccurrence array
          placeOfOccurrence: {
            home: Array.isArray(latestCase.placeOfOccurrence) && latestCase.placeOfOccurrence.includes('Home'),
            school: Array.isArray(latestCase.placeOfOccurrence) && latestCase.placeOfOccurrence.includes('School'),
            road: Array.isArray(latestCase.placeOfOccurrence) && latestCase.placeOfOccurrence.includes('Road'),
            neighbor: Array.isArray(latestCase.placeOfOccurrence) && latestCase.placeOfOccurrence.includes('Neighbor'),
            others: Array.isArray(latestCase.placeOfOccurrence) && latestCase.placeOfOccurrence.includes('Others')
          },
          placeOthersDetails: latestCase.placeOthersDetails || '',
          
          // Disposition
          disposition: {
            treatedSentHome: Array.isArray(latestCase.disposition) && latestCase.disposition.includes('Treated & Sent Home'),
            transferred: Array.isArray(latestCase.disposition) && latestCase.disposition.includes('Transferred to another facility/hospital')
          },
          transferredTo: latestCase.transferredTo || '',
          
          // Circumstance of Bite - based on circumstanceOfBite array
          circumstanceProvoked: Array.isArray(latestCase.circumstanceOfBite) && latestCase.circumstanceOfBite.includes('Provoked'),
          circumstanceUnprovoked: Array.isArray(latestCase.circumstanceOfBite) && latestCase.circumstanceOfBite.includes('Unprovoked'),
          
          // Animal Profile - based on animalProfile object
          animalType: {
            dog: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.species) && latestCase.animalProfile.species.includes('Dog'),
            cat: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.species) && latestCase.animalProfile.species.includes('Cat'),
            others: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.species) && latestCase.animalProfile.species.includes('Others')
          },
          otherAnimal: latestCase.animalProfile && latestCase.animalProfile.othersSpecify || '',
          animalStatus: {
            healthy: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.clinicalStatus) && latestCase.animalProfile.clinicalStatus.includes('Healthy'),
            sick: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.clinicalStatus) && latestCase.animalProfile.clinicalStatus.includes('Sick'),
            died: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.clinicalStatus) && latestCase.animalProfile.clinicalStatus.includes('Died'),
            killed: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.clinicalStatus) && latestCase.animalProfile.clinicalStatus.includes('Killed')
          },
          brainExam: {
            brainExamDone: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.brainExam) && latestCase.animalProfile.brainExam.includes('Brain Exam Done'),
            noBrainExam: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.brainExam) && latestCase.animalProfile.brainExam.includes('No Brain Exam'),
            unknown: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.brainExam) && latestCase.animalProfile.brainExam.includes('Unknown')
          },
          vaccinationStatus: {
            immunized: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.vaccinationStatus) && latestCase.animalProfile.vaccinationStatus.includes('Immunized'),
            notImmunized: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.vaccinationStatus) && latestCase.animalProfile.vaccinationStatus.includes('Not Immunized')
          },
          vaccinationDate: latestCase.animalProfile && latestCase.animalProfile.vaccinationDate || '',
          ownership: {
            pet: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.ownership) && latestCase.animalProfile.ownership.includes('Pet'),
            neighbor: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.ownership) && latestCase.animalProfile.ownership.includes('Neighbor'),
            stray: latestCase.animalProfile && Array.isArray(latestCase.animalProfile.ownership) && latestCase.animalProfile.ownership.includes('Stray')
          },
          
          // Management
          washingWound: {
            yes: latestCase.management && Array.isArray(latestCase.management.washingWound) && latestCase.management.washingWound.includes('Yes'),
            no: latestCase.management && Array.isArray(latestCase.management.washingWound) && latestCase.management.washingWound.includes('No')
          },
          category: {
            category1: latestCase.management && Array.isArray(latestCase.management.category) && latestCase.management.category.includes('Category 1'),
            category2: latestCase.management && Array.isArray(latestCase.management.category) && latestCase.management.category.includes('Category 2'),
            category3: latestCase.management && Array.isArray(latestCase.management.category) && latestCase.management.category.includes('Category 3')
          },
          
          // Allergies & Medications
          allergyHistory: latestCase.allergyHistory || '',
          maintenanceMedications: latestCase.maintenanceMedications || '',
          
          // Diagnosis & Management
          diagnosis: latestCase.diagnosis || '',
          managementDetails: latestCase.managementDetails || '',
          
          // Patient Immunization - based on patientImmunization object
          patientImmunization: {
            dpt: {
              complete: latestCase.patientImmunization && Array.isArray(latestCase.patientImmunization.dpt) && latestCase.patientImmunization.dpt.includes('Complete'),
              incomplete: latestCase.patientImmunization && Array.isArray(latestCase.patientImmunization.dpt) && latestCase.patientImmunization.dpt.includes('Incomplete'),
              none: latestCase.patientImmunization && Array.isArray(latestCase.patientImmunization.dpt) && latestCase.patientImmunization.dpt.includes('None')
            },
            dptYearGiven: latestCase.patientImmunization && latestCase.patientImmunization.dptYearGiven || '',
            dptDosesGiven: latestCase.patientImmunization && latestCase.patientImmunization.dptDosesGiven || '',
            tt: {
              active: latestCase.patientImmunization && Array.isArray(latestCase.patientImmunization.tt) && latestCase.patientImmunization.tt.includes('Active'),
              passive: latestCase.patientImmunization && Array.isArray(latestCase.patientImmunization.tt) && latestCase.patientImmunization.tt.includes('Passive')
            },
            ttDates: latestCase.patientImmunization && latestCase.patientImmunization.ttDates ? 
              Array.isArray(latestCase.patientImmunization.ttDates) ? 
                [...latestCase.patientImmunization.ttDates, '', '', ''].slice(0, 3) : 
                ['', '', ''] : 
              ['', '', ''],
            skinTest: latestCase.patientImmunization && latestCase.patientImmunization.skinTest || false,
            skinTestTime: latestCase.patientImmunization && latestCase.patientImmunization.skinTestTime || '',
            skinTestReadTime: latestCase.patientImmunization && latestCase.patientImmunization.skinTestReadTime || '',
            skinTestResult: latestCase.patientImmunization && latestCase.patientImmunization.skinTestResult || '',
            tig: latestCase.patientImmunization && latestCase.patientImmunization.tig || false,
            tigDose: latestCase.patientImmunization && latestCase.patientImmunization.tigDose || '',
            tigDate: latestCase.patientImmunization && latestCase.patientImmunization.tigDate || ''
          },
          
          // ERIG Section
          erig: {
            dateTaken: latestCase.erig && latestCase.erig.dateTaken || '',
            medicineUsed: latestCase.erig && latestCase.erig.medicineUsed || '',
            branchNo: latestCase.erig && latestCase.erig.branchNo || ''
          },
          
          // Current Anti-Rabies Immunization - based on currentImmunization object
          currentImmunization: {
            type: {
              active: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.type) && latestCase.currentImmunization.type.includes('Active'),
              postExposure: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.type) && latestCase.currentImmunization.type.includes('Post-exposure'),
              preExposure: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.type) && latestCase.currentImmunization.type.includes('Pre-exposure'),
              previouslyImmunized: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.type) && latestCase.currentImmunization.type.includes('Previously Immunized')
            },
            vaccine: {
              pvrv: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.vaccine) && latestCase.currentImmunization.vaccine.includes('PVRV'),
              pcec: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.vaccine) && latestCase.currentImmunization.vaccine.includes('PCEC')
            },
            route: {
              id: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.route) && latestCase.currentImmunization.route.includes('ID'),
              im: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.route) && latestCase.currentImmunization.route.includes('IM')
            },
            passive: latestCase.currentImmunization && latestCase.currentImmunization.passive || false,
            skinTest: latestCase.currentImmunization && latestCase.currentImmunization.skinTest || false,
            skinTestTime: latestCase.currentImmunization && latestCase.currentImmunization.skinTestTime || '',
            skinTestReadTime: latestCase.currentImmunization && latestCase.currentImmunization.skinTestReadTime || '',
            skinTestResult: latestCase.currentImmunization && latestCase.currentImmunization.skinTestResult || '',
            hrig: latestCase.currentImmunization && latestCase.currentImmunization.hrig || false,
            hrigDose: latestCase.currentImmunization && latestCase.currentImmunization.hrigDose || '',
            hrigDate: latestCase.currentImmunization && latestCase.currentImmunization.hrigDate || '',
            localInfiltration: latestCase.currentImmunization && latestCase.currentImmunization.localInfiltration || false,
            schedule: {
              structured: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.schedule) && latestCase.currentImmunization.schedule.includes('Structured'),
              unstructured: latestCase.currentImmunization && Array.isArray(latestCase.currentImmunization.schedule) && latestCase.currentImmunization.schedule.includes('Unstructured')
            },
            medicineUsed: latestCase.currentImmunization && latestCase.currentImmunization.medicineUsed || '',
            branchNo: latestCase.currentImmunization && latestCase.currentImmunization.branchNo || ''
          },
          
          // Immunization Schedule - based on scheduleDates array
          scheduleDates: {
            d0: Array.isArray(latestCase.scheduleDates) && latestCase.scheduleDates[0] || '',
            d3: Array.isArray(latestCase.scheduleDates) && latestCase.scheduleDates[1] || '',
            d7: Array.isArray(latestCase.scheduleDates) && latestCase.scheduleDates[2] || '',
            d14: Array.isArray(latestCase.scheduleDates) && latestCase.scheduleDates[3] || '',
            d28: Array.isArray(latestCase.scheduleDates) && latestCase.scheduleDates[4] || ''
          },
          
          // Additional fields from schema
          animalStatus: latestCase.animalStatus || '',
          remarks: latestCase.remarks || ''
        }));
      } else {
        // No existing cases - populate with patient data only
        setPatientRegistrationNumber(selectedPatient.registrationNumber || selectedPatient.regNo || selectedPatient.registration_no || selectedPatient.regNumber || '');
        
        setFormData(prev => ({
          ...prev,
          // Registration - populate from patient data (try multiple field names)
          registrationNumber: selectedPatient.registrationNumber || selectedPatient.regNo || selectedPatient.registration_no || selectedPatient.regNumber || '',
          philhealthNo: selectedPatient.philhealthNo || selectedPatient.philhealth_no || selectedPatient.philhealthNumber || '',
          
          // Patient Information - populate from selectedPatient
          lastName: selectedPatient.lastName || '',
          firstName: selectedPatient.firstName || '',
          middleName: selectedPatient.middleName || '',
          birthdate: selectedPatient.birthdate ? new Date(selectedPatient.birthdate).toISOString().split('T')[0] : '',
          age: selectedPatient.age || '',
          sex: selectedPatient.sex || '',
          contactNo: selectedPatient.phone || selectedPatient.contactNo || '',
          
          // Address Information - populate from selectedPatient
          houseNo: selectedPatient.houseNo || '',
          street: selectedPatient.street || '',
          barangay: selectedPatient.barangay || '',
          subdivision: selectedPatient.subdivision || '',
          city: selectedPatient.city || '',
          province: selectedPatient.province || '',
          zipCode: selectedPatient.zipCode || '',
          
          // Additional patient info
          civilStatus: selectedPatient.civilStatus || '',
          birthPlace: selectedPatient.birthPlace || '',
          nationality: selectedPatient.nationality || '',
          religion: selectedPatient.religion || '',
          occupation: selectedPatient.occupation || ''
        }));
      }
      
      setCaseHistory(filteredCases.sort((a, b) => new Date(b.createdAt || b.incidentDate || 0) - new Date(a.createdAt || a.incidentDate || 0)));
    } catch (error) {
      console.error('Error loading case history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Helper function to get nested values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper function to set nested values
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const result = { ...obj };
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    return result;
  };

  // Handle nested checkbox changes
  const handleNestedCheckboxChange = (path, value) => {
    setFormData(prev => setNestedValue(prev, path, value));
  };

  // Handle nested input changes
  const handleNestedInputChange = (path, value) => {
    setFormData(prev => setNestedValue(prev, path, value));
  };

  // Calculate immunization schedule dates based on D0
  const calculateScheduleDates = (d0Date) => {
    const baseDate = new Date(d0Date);
    const d3Date = new Date(baseDate);
    d3Date.setDate(baseDate.getDate() + 3);
    const d7Date = new Date(baseDate);
    d7Date.setDate(baseDate.getDate() + 7);
    const d14Date = new Date(baseDate);
    d14Date.setDate(baseDate.getDate() + 14);
    const d28Date = new Date(baseDate);
    d28Date.setDate(baseDate.getDate() + 28);
    
    return {
      d0: d0Date,
      d3: d3Date.toISOString().split('T')[0],
      d7: d7Date.toISOString().split('T')[0],
      d14: d14Date.toISOString().split('T')[0],
      d28: d28Date.toISOString().split('T')[0]
    };
  };

  const handleFollowUpChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      followUp: prev.followUp.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Ensure only one disposition is selected
  const handleDisposition = (choice) => {
    setFormData(prev => ({
      ...prev,
      disposition: {
        treatedSentHome: choice === 'treated',
        transferred: choice === 'transferred'
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Convert form data to match the database structure
      const submitData = {
        patientId: selectedPatient._id || selectedPatient.patientId,
        registrationNumber: formData.registrationNumber,
        philhealthNo: formData.philhealthNo,
        dateRegistered: new Date().toISOString(),
        arrivalDate: formData.arrivalDate,
        arrivalTime: formData.arrivalTime,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        civilStatus: formData.civilStatus,
        birthdate: formData.birthdate ? new Date(formData.birthdate).toISOString() : null,
        birthplace: formData.birthPlace,
        nationality: formData.nationality,
        religion: formData.religion,
        occupation: formData.occupation,
        contactNo: formData.contactNo,
        houseNo: formData.houseNo,
        street: formData.street,
        barangay: formData.barangay,
        subdivision: formData.subdivision,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,
        permanentAddress: formData.permanentAddress,
        age: formData.age,
        weight: formData.weight,
        sex: formData.sex,
        center: formData.center,
        
        // Convert arrays based on form data
        typeOfExposure: [
          ...(formData.typeNonBite ? ['NON-BITE'] : []),
          ...(formData.typeBite ? ['BITE'] : [])
        ],
        
        siteOfBite: [
          ...(formData.biteSites.head ? ['Head'] : []),
          ...(formData.biteSites.face ? ['Face'] : []),
          ...(formData.biteSites.neck ? ['Neck'] : []),
          ...(formData.biteSites.chest ? ['Chest'] : []),
          ...(formData.biteSites.back ? ['Back'] : []),
          ...(formData.biteSites.abdomen ? ['Abdomen'] : []),
          ...(formData.biteSites.upperExtremities ? ['Upper Extremities'] : []),
          ...(formData.biteSites.lowerExtremities ? ['Lower Extremities'] : []),
          ...(formData.biteSites.others ? ['Others'] : [])
        ],
        
        othersBiteSpecify: formData.othersBiteSpecify,
        dateOfInquiry: formData.dateOfInquiry,
        
        natureOfInjury: [
          ...(formData.natureOfInjuries.multipleInjuries ? ['Multiple Injuries'] : []),
          ...(formData.natureOfInjuries.abrasion ? ['Abrasion'] : []),
          ...(formData.natureOfInjuries.avulsion ? ['Avulsion'] : []),
          ...(formData.natureOfInjuries.burn ? ['Burn'] : []),
          ...(formData.natureOfInjuries.concussion ? ['Concussion'] : []),
          ...(formData.natureOfInjuries.contusion ? ['Contusion'] : []),
          ...(formData.natureOfInjuries.openWound ? ['Open Wound'] : []),
          ...(formData.natureOfInjuries.trauma ? ['Trauma'] : []),
          ...(formData.natureOfInjuries.others ? ['Others'] : [])
        ],
        burnDegree: formData.burnDegree,
        burnSite: formData.burnSite,
        othersInjuryDetails: formData.othersInjuryDetails,
        
        externalCause: [
          ...(formData.externalCauses.biteSting ? ['Bite/Sting'] : []),
          ...(formData.externalCauses.chemicalSubstance ? ['Chemical Substance'] : [])
        ],
        biteStingDetails: formData.biteStingDetails,
        chemicalSubstanceDetails: formData.chemicalSubstanceDetails,
        
        placeOfOccurrence: [
          ...(formData.placeOfOccurrence.home ? ['Home'] : []),
          ...(formData.placeOfOccurrence.school ? ['School'] : []),
          ...(formData.placeOfOccurrence.road ? ['Road'] : []),
          ...(formData.placeOfOccurrence.neighbor ? ['Neighbor'] : []),
          ...(formData.placeOfOccurrence.others ? ['Others'] : [])
        ],
        
        placeOthersDetails: formData.placeOthersDetails,
        
        disposition: [
          ...(formData.disposition.treatedSentHome ? ['Treated & Sent Home'] : []),
          ...(formData.disposition.transferred ? ['Transferred to another facility/hospital'] : [])
        ],
        transferredTo: formData.transferredTo,
        
        circumstanceOfBite: [
          ...(formData.circumstanceProvoked ? ['Provoked'] : []),
          ...(formData.circumstanceUnprovoked ? ['Unprovoked'] : [])
        ],
        
        animalProfile: {
          species: [
            ...(formData.animalType.dog ? ['Dog'] : []),
            ...(formData.animalType.cat ? ['Cat'] : []),
            ...(formData.animalType.others ? ['Others'] : [])
          ],
          othersSpecify: formData.otherAnimal,
          clinicalStatus: [
            ...(formData.animalStatus.healthy ? ['Healthy'] : []),
            ...(formData.animalStatus.sick ? ['Sick'] : []),
            ...(formData.animalStatus.died ? ['Died'] : []),
            ...(formData.animalStatus.killed ? ['Killed'] : [])
          ],
          brainExam: [
            ...(formData.brainExam.brainExamDone ? ['Brain Exam Done'] : []),
            ...(formData.brainExam.noBrainExam ? ['No Brain Exam'] : []),
            ...(formData.brainExam.unknown ? ['Unknown'] : [])
          ],
          vaccinationStatus: [
            ...(formData.vaccinationStatus.immunized ? ['Immunized'] : []),
            ...(formData.vaccinationStatus.notImmunized ? ['None'] : []),
            ...(formData.vaccinationStatus.unknown ? ['Unknown'] : [])
          ],
          vaccinationDate: formData.vaccinationDate,
          ownership: [
            ...(formData.ownership.pet ? ['Pet'] : []),
            ...(formData.ownership.neighbor ? ['Neighbor'] : []),
            ...(formData.ownership.stray ? ['Stray'] : [])
          ]
        },
        
        management: {
          washingWound: [
            ...(formData.washingWound.yes ? ['Yes'] : []),
            ...(formData.washingWound.no ? ['No'] : [])
          ],
          category: [
            ...(formData.category.category1 ? ['Category 1'] : []),
            ...(formData.category.category2 ? ['Category 2'] : []),
            ...(formData.category.category3 ? ['Category 3'] : [])
          ]
        },
        
        diagnosis: formData.diagnosis,
        managementDetails: formData.managementDetails,
        allergyHistory: formData.allergyHistory,
        maintenanceMedications: formData.maintenanceMedications,
        
        patientImmunization: {
          dpt: [
            ...(formData.patientImmunization.dpt.complete ? ['Complete'] : []),
            ...(formData.patientImmunization.dpt.incomplete ? ['Incomplete'] : []),
            ...(formData.patientImmunization.dpt.none ? ['None'] : [])
          ],
          dptYearGiven: formData.patientImmunization.dptYearGiven,
          dptDosesGiven: formData.patientImmunization.dptDosesGiven,
          tt: [
            ...(formData.patientImmunization.tt.active ? ['Active'] : []),
            ...(formData.patientImmunization.tt.passive ? ['Passive'] : [])
          ],
          ttDates: formData.patientImmunization.ttDates.filter(date => date && date.trim() !== ''),
          ttRnSignatures: formData.patientImmunization.ttRnSignatures,
          skinTest: formData.patientImmunization.skinTest,
          skinTestTime: formData.patientImmunization.skinTestTime,
          skinTestReadTime: formData.patientImmunization.skinTestReadTime,
          skinTestResult: formData.patientImmunization.skinTestResult,
          skinTestMdSignature: formData.patientImmunization.skinTestMdSignature,
          tig: formData.patientImmunization.tig,
          tigDose: formData.patientImmunization.tigDose,
          tigDate: formData.patientImmunization.tigDate,
          tigMdSignature: formData.patientImmunization.tigMdSignature
        },
        
        erig: {
          dateTaken: formData.erig.dateTaken,
          medicineUsed: formData.erig.medicineUsed,
          branchNo: formData.erig.branchNo
        },
        
        currentImmunization: {
          type: [
            ...(formData.currentImmunization.type.active ? ['Active'] : []),
            ...(formData.currentImmunization.type.postExposure ? ['Post-exposure'] : []),
            ...(formData.currentImmunization.type.preExposure ? ['Pre-exposure'] : []),
            ...(formData.currentImmunization.type.previouslyImmunized ? ['Previously Immunized'] : [])
          ],
          vaccine: [
            ...(formData.currentImmunization.vaccine.pvrv ? ['PVRV'] : []),
            ...(formData.currentImmunization.vaccine.pcec ? ['PCEC'] : [])
          ],
          route: [
            ...(formData.currentImmunization.route.id ? ['ID'] : []),
            ...(formData.currentImmunization.route.im ? ['IM'] : [])
          ],
          passive: formData.currentImmunization.passive,
          skinTest: formData.currentImmunization.skinTest,
          skinTestTime: formData.currentImmunization.skinTestTime,
          skinTestReadTime: formData.currentImmunization.skinTestReadTime,
          skinTestResult: formData.currentImmunization.skinTestResult,
          skinTestMdSignature: formData.currentImmunization.skinTestMdSignature,
          hrig: formData.currentImmunization.hrig,
          hrigDose: formData.currentImmunization.hrigDose,
          hrigDate: formData.currentImmunization.hrigDate,
          hrigMdSignature: formData.currentImmunization.hrigMdSignature,
          localInfiltration: formData.currentImmunization.localInfiltration,
          schedule: [
            ...(formData.currentImmunization.schedule.structured ? ['Structured'] : []),
            ...(formData.currentImmunization.schedule.unstructured ? ['Unstructured'] : [])
          ],
          medicineUsed: formData.currentImmunization.medicineUsed,
          branchNo: formData.currentImmunization.branchNo,
          scheduleRnSignatures: formData.currentImmunization.scheduleRnSignatures
        },
        
        scheduleDates: [
          formData.scheduleDates.d0,
          formData.scheduleDates.d3,
          formData.scheduleDates.d7,
          formData.scheduleDates.d14,
          formData.scheduleDates.d28
        ].filter(date => date), // Remove empty dates
        
        animalStatus: formData.animalStatus,
        remarks: formData.remarks,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const response = await fetch('/api/bitecases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        alert(`Case submitted successfully! New case ID: ${responseData._id || 'N/A'}`);
        // Refresh case history to show the new case
        await loadCaseHistory();
        // Set flag to show new case was added
        setNewCaseAdded(true);
        // Reset flag after 3 seconds
        setTimeout(() => setNewCaseAdded(false), 3000);
        // Reset form to initial state for new case
        setFormData(prev => ({
          ...prev,
          // Keep patient info but reset case-specific fields
          registrationNumber: selectedPatient.registrationNumber || selectedPatient.regNo || selectedPatient.registration_no || selectedPatient.regNumber || '',
          philhealthNo: selectedPatient.philhealthNo || selectedPatient.philhealth_no || selectedPatient.philhealthNumber || '',
          arrivalDate: '',
          arrivalTime: '',
          weight: '',
          // Reset bite-related fields
          typeNonBite: false,
          typeBite: false,
          biteSites: {
            head: false, face: false, neck: false, chest: false, back: false, abdomen: false,
            upperExtremities: false, lowerExtremities: false, others: false
          },
          othersBiteSpecify: '',
          dateOfInjury: '',
          timeOfInjury: '',
          natureOfInjuries: {
            multipleInjuries: false, abrasion: false, avulsion: false, burn: false,
            concussion: false, contusion: false, openWound: false, trauma: false, others: false
          },
          burnDegree: 1,
          burnSite: '',
          othersInjuryDetails: '',
          // Reset other case-specific fields
          externalCauses: { biteSting: false, chemicalSubstance: false },
          biteStingDetails: '',
          chemicalSubstanceDetails: '',
          placeOfOccurrence: { home: false, school: false, road: false, neighbor: false, others: false },
          placeOthersDetails: '',
          disposition: { treatedSentHome: false, transferred: false },
          transferredTo: '',
          circumstanceProvoked: false,
          circumstanceUnprovoked: false,
          animalType: { dog: false, cat: false, others: false },
          otherAnimal: '',
          animalStatus: { healthy: false, sick: false, died: false, killed: false },
          brainExam: { brainExamDone: false, noBrainExam: false, unknown: false },
          vaccinationStatus: { immunized: false, notImmunized: false },
          vaccinationDate: '',
          ownership: { pet: false, neighbor: false, stray: false },
          washingWound: { yes: false, no: false },
          category: { category1: false, category2: false, category3: false },
          allergyHistory: '',
          maintenanceMedications: '',
          diagnosis: '',
          managementDetails: '',
          // Reset immunization fields
          patientImmunization: {
            dpt: { complete: false, incomplete: false, none: false },
            dptYearGiven: '', dptDosesGiven: '',
            tt: { active: false, passive: false },
            ttDates: ['', '', ''],
            skinTest: false, skinTestTime: '', skinTestReadTime: '', skinTestResult: '',
            tig: false, tigDose: '', tigDate: ''
          },
          erig: { dateTaken: '', medicineUsed: '', branchNo: '' },
          currentImmunization: {
            type: { active: false, postExposure: false, preExposure: false, previouslyImmunized: false },
            vaccine: { pvrv: false, pcec: false },
            route: { id: false, im: false },
            passive: false, skinTest: false, skinTestTime: '', skinTestReadTime: '', skinTestResult: '',
            hrig: false, hrigDose: '', hrigDate: '', localInfiltration: false,
            schedule: { structured: false, unstructured: false },
            medicineUsed: '', branchNo: ''
          },
          scheduleDates: { d0: '', d3: '', d7: '', d14: '', d28: '' },
          animalStatus: '', remarks: '',
          followUp: [
            { date: '', findings: '', management: '', mdSignature: '' },
            { date: '', findings: '', management: '', mdSignature: '' },
            { date: '', findings: '', management: '', mdSignature: '' }
          ],
          patientSignature: '', witnessSignature: ''
        }));
      } else {
        throw new Error('Failed to submit case');
      }
    } catch (error) {
      console.error('Error submitting case:', error);
      alert('Error submitting case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-gray-100 min-h-screen font-sans w-full">
      <div className="w-full">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">
          TIBAGAN HEALTH CENTER
        </h1>
        <p className="text-center text-lg text-gray-600 mb-8">
          Animal and Human Bite Data Sheet
        </p>

        {/* Patient Information Display */}
        {selectedPatient && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-gray-600">Full Name:</span>
                <p className="text-gray-800">
                  {[selectedPatient.firstName, selectedPatient.middleName, selectedPatient.lastName].filter(Boolean).join(' ')}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Registration No:</span>
                <p className="text-gray-800">{patientRegistrationNumber || formData.registrationNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">PhilHealth No:</span>
                <p className="text-gray-800">{formData.philhealthNo || selectedPatient.philhealthNo || selectedPatient.philhealth_no || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Case History Section */}
        {caseHistory.length > 0 && (
          <div className={`mb-8 p-6 bg-white rounded-xl shadow-sm border ${newCaseAdded ? 'border-green-300 bg-green-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 flex-1">Case History</h2>
              {newCaseAdded && (
                <span className="ml-4 text-sm text-green-600 font-medium animate-pulse">
                  ✓ New case added!
                </span>
              )}
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading case history...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-3 text-left font-medium text-gray-700">Date</th>
                      <th className="border p-3 text-left font-medium text-gray-700">Registration No</th>
                      <th className="border p-3 text-left font-medium text-gray-700">Type</th>
                      <th className="border p-3 text-left font-medium text-gray-700">Animal</th>
                      <th className="border p-3 text-left font-medium text-gray-700">Category</th>
                      <th className="border p-3 text-left font-medium text-gray-700">Diagnosis</th>
                      <th className="border p-3 text-left font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseHistory.map((case_, index) => (
                      <tr key={case_._id || index} className="hover:bg-gray-50">
                        <td className="border p-3 text-gray-800">
                          {case_.createdAt ? new Date(case_.createdAt).toLocaleDateString() : 
                           case_.arrivalDate ? new Date(case_.arrivalDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="border p-3 text-gray-800">{case_.registrationNumber || 'N/A'}</td>
                        <td className="border p-3 text-gray-800">
                          {case_.typeOfExposure && Array.isArray(case_.typeOfExposure) && case_.typeOfExposure.includes('BITE') ? 'Bite' : 
                           case_.typeOfExposure && Array.isArray(case_.typeOfExposure) && case_.typeOfExposure.includes('NON-BITE') ? 'Non-Bite' : 'N/A'}
                        </td>
                        <td className="border p-3 text-gray-800">
                          {case_.animalProfile && case_.animalProfile.species && Array.isArray(case_.animalProfile.species) && case_.animalProfile.species.includes('Dog') ? 'Dog' : 
                           case_.animalProfile && case_.animalProfile.species && Array.isArray(case_.animalProfile.species) && case_.animalProfile.species.includes('Cat') ? 'Cat' : 
                           case_.animalProfile && case_.animalProfile.species && Array.isArray(case_.animalProfile.species) && case_.animalProfile.species.includes('Others') ? (case_.animalProfile.othersSpecify || 'Other') : 'N/A'}
                        </td>
                        <td className="border p-3 text-gray-800">
                          {case_.management && case_.management.category && Array.isArray(case_.management.category) && case_.management.category.includes('Category 1') ? 'Category 1' : 
                           case_.management && case_.management.category && Array.isArray(case_.management.category) && case_.management.category.includes('Category 2') ? 'Category 2' : 
                           case_.management && case_.management.category && Array.isArray(case_.management.category) && case_.management.category.includes('Category 3') ? 'Category 3' : 'N/A'}
                        </td>
                        <td className="border p-3 text-gray-800">{case_.diagnosis || 'N/A'}</td>
                        <td className="border p-3 text-gray-800">{case_.status || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Registration */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Registration</h2>
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              <strong>✓ Auto-populated:</strong> Registration Number and PhilHealth ID are automatically filled from patient data. You can edit them if needed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Registration Number *
                {formData.registrationNumber && (
                  <span className="ml-2 text-xs text-green-600">✓ Auto-filled</span>
                )}
              </label>
              <input 
                type="text" 
                placeholder="e.g., 25-123456" 
                className={`border p-3 rounded-xl shadow-sm ${
                  formData.registrationNumber ? 'border-green-300 bg-green-50' : ''
                }`}
                value={formData.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                PhilHealth Number
                {formData.philhealthNo && (
                  <span className="ml-2 text-xs text-green-600">✓ Auto-filled</span>
                )}
              </label>
              <input 
                type="text" 
                placeholder="e.g., 12-345678901-2" 
                className={`border p-3 rounded-xl shadow-sm ${
                  formData.philhealthNo ? 'border-green-300 bg-green-50' : ''
                }`}
                value={formData.philhealthNo}
                onChange={(e) => handleInputChange('philhealthNo', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Weight (kg) *</label>
              <input 
                type="number" 
                placeholder="e.g., 65" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Arrival Date *</label>
              <input 
                type="date" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.arrivalDate}
                onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Arrival Time *</label>
              <input 
                type="time" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.arrivalTime}
                onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Civil Status *</label>
              <select 
                className="border p-3 rounded-xl shadow-sm"
                value={formData.civilStatus}
                onChange={(e) => handleInputChange('civilStatus', e.target.value)}
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Separated">Separated</option>
                <option value="Widowed">Widowed</option>
            </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Birth Place</label>
              <input 
                type="text" 
                placeholder="e.g., Manila, Philippines" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.birthPlace}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Nationality</label>
              <input 
                type="text" 
                placeholder="e.g., Filipino" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Religion</label>
              <input 
                type="text" 
                placeholder="e.g., Roman Catholic" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.religion}
                onChange={(e) => handleInputChange('religion', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Occupation</label>
              <input 
                type="text" 
                placeholder="e.g., Teacher, Engineer" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
              />
            </div>
            <div className="md:col-span-3 flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Permanent Address</label>
              <input 
                type="text" 
                placeholder="House/Street/Barangay/City/Province/ZIP" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.permanentAddress}
                onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Patient Information */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Last Name *</label>
              <input 
                type="text" 
                placeholder="e.g., Santos" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">First Name *</label>
              <input 
                type="text" 
                placeholder="e.g., Juan" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Middle Name</label>
              <input 
                type="text" 
                placeholder="e.g., Dela Cruz" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Birth Date *</label>
              <input 
                type="date" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.birthdate}
                onChange={(e) => handleInputChange('birthdate', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Age *</label>
              <input 
                type="number" 
                placeholder="e.g., 25" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">Sex *</label>
              <select 
                className="border p-3 rounded-xl shadow-sm"
                value={formData.sex}
                onChange={(e) => handleInputChange('sex', e.target.value)}
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-600 mb-1">Contact Number *</label>
              <input 
                type="tel" 
                placeholder="e.g., +63 912 345 6789" 
                className="border p-3 rounded-xl shadow-sm" 
                value={formData.contactNo}
                onChange={(e) => handleInputChange('contactNo', e.target.value)}
              />
            </div>
          </div>
          
          {/* Address Information */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">House No.</label>
                <input 
                  type="text" 
                  placeholder="e.g., 123" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.houseNo}
                  onChange={(e) => handleInputChange('houseNo', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Street</label>
                <input 
                  type="text" 
                  placeholder="e.g., Rizal Street" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Barangay</label>
                <input 
                  type="text" 
                  placeholder="e.g., Barangay 1" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.barangay}
                  onChange={(e) => handleInputChange('barangay', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Subdivision</label>
                <input 
                  type="text" 
                  placeholder="e.g., Greenhills" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.subdivision}
                  onChange={(e) => handleInputChange('subdivision', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">City</label>
                <input 
                  type="text" 
                  placeholder="e.g., Manila" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Province</label>
                <input 
                  type="text" 
                  placeholder="e.g., Metro Manila" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">ZIP Code</label>
                <input 
                  type="text" 
                  placeholder="e.g., 1000" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* History of Bite */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">History of Bite</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Type of Exposure *</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.typeNonBite}
                  onChange={(e) => handleInputChange('typeNonBite', e.target.checked)}
                /> 
                Non-Bite (Scratch, lick, contact)
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.typeBite}
                  onChange={(e) => handleInputChange('typeBite', e.target.checked)}
                /> 
                Bite (Puncture wound)
              </label>
          </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Site of Bite/Injury *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "head", label: "Head" },
                { key: "face", label: "Face" },
                { key: "neck", label: "Neck" },
                { key: "chest", label: "Chest" },
                { key: "back", label: "Back" },
                { key: "abdomen", label: "Abdomen" },
                { key: "upperExtremities", label: "Upper Extremities" },
                { key: "lowerExtremities", label: "Lower Extremities" },
                { key: "others", label: "Others" }
              ].map((site) => (
                <label key={site.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={formData.biteSites[site.key]}
                    onChange={(e) => handleCheckboxChange('biteSites', site.key, e.target.checked)}
                  /> 
                  {site.label}
                </label>
              ))}
          </div>
          </div>
          
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Date of Inquiry and Time/Date of Injury *</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Date of Inquiry</label>
                <input 
                  type="date" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.dateOfInquiry}
                  onChange={(e) => handleInputChange('dateOfInquiry', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Date of Injury</label>
                <input 
                  type="date" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.dateOfInjury}
                  onChange={(e) => handleInputChange('dateOfInjury', e.target.value)}
                />
          </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Time of Injury</label>
                <input 
                  type="time" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={formData.timeOfInjury}
                  onChange={(e) => handleInputChange('timeOfInjury', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Nature of Injuries *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: "multipleInjuries", label: "Multiple Injuries" },
                { key: "abrasion", label: "Abrasion" },
                { key: "avulsion", label: "Avulsion" },
                { key: "burn", label: "Burn" },
                { key: "concussion", label: "Concussion" },
                { key: "contusion", label: "Contusion" },
                { key: "openWound", label: "Open Wound" },
                { key: "trauma", label: "Trauma" },
                { key: "others", label: "Others" }
              ].map((injury) => (
                <label key={injury.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={formData.natureOfInjuries[injury.key]}
                    onChange={(e) => handleCheckboxChange('natureOfInjuries', injury.key, e.target.checked)}
                  /> 
                  {injury.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* External Causes */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">External Causes</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Type of External Cause *</label>
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.externalCauses.biteSting}
                  onChange={(e) => handleCheckboxChange('externalCauses', 'biteSting', e.target.checked)}
                /> 
                Bite/Sting
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.externalCauses.chemicalSubstance}
                  onChange={(e) => handleCheckboxChange('externalCauses', 'chemicalSubstance', e.target.checked)}
                /> 
                Chemical Substance
              </label>
            </div>
          </div>
          
          {formData.externalCauses.biteSting && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Bite/Sting Details</label>
              <input 
                type="text" 
                placeholder="e.g., Dog bite, Bee sting, etc." 
                className="w-full border p-3 rounded-xl shadow-sm" 
                value={formData.biteStingDetails}
                onChange={(e) => handleInputChange('biteStingDetails', e.target.value)}
              />
            </div>
          )}
          
          {formData.externalCauses.chemicalSubstance && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Chemical Substance Details</label>
              <input 
                type="text" 
                placeholder="e.g., Acid, Alkali, etc." 
                className="w-full border p-3 rounded-xl shadow-sm" 
                value={formData.chemicalSubstanceDetails}
                onChange={(e) => handleInputChange('chemicalSubstanceDetails', e.target.value)}
              />
            </div>
          )}
        </section>

        {/* Place of Occurrence */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Place of Occurrence</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Where did the incident occur? *</label>
          <div className="flex flex-wrap gap-6">
              {[
                { key: "home", label: "Home" },
                { key: "school", label: "School" },
                { key: "road", label: "Road/Street" },
                { key: "neighbor", label: "Neighbor's House" },
                { key: "others", label: "Others" }
              ].map((place) => (
                <label key={place.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={formData.placeOfOccurrence[place.key]}
                    onChange={(e) => handleCheckboxChange('placeOfOccurrence', place.key, e.target.checked)}
                  /> 
                  {place.label}
              </label>
            ))}
          </div>
          </div>
          
          {formData.placeOfOccurrence.others && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Please specify other location</label>
              <input 
                type="text" 
                placeholder="e.g., Park, Market, etc." 
                className="w-full border p-3 rounded-xl shadow-sm" 
                value={formData.placeOthersDetails}
                onChange={(e) => handleInputChange('placeOthersDetails', e.target.value)}
              />
            </div>
          )}
        </section>

        {/* Circumstance of Bite */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Circumstance of Bite</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">How did the bite occur? *</label>
          <div className="flex gap-6">
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.circumstanceProvoked}
                  onChange={(e) => handleInputChange('circumstanceProvoked', e.target.checked)}
                /> 
                Provoked (Patient provoked the animal)
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.circumstanceUnprovoked}
                  onChange={(e) => handleInputChange('circumstanceUnprovoked', e.target.checked)}
                /> 
                Unprovoked (Animal attacked without provocation)
              </label>
            </div>
          </div>
        </section>

        {/* Disposition */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Disposition</h2>
          <div className="mb-4 space-y-3">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="radio"
                name="disposition"
                checked={formData.disposition.treatedSentHome}
                onChange={() => handleDisposition('treated')}
              />
              Treated &amp; Sent Home
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="disposition"
                  checked={formData.disposition.transferred}
                  onChange={() => handleDisposition('transferred')}
                />
                Transferred to another facility/hospital, specify:
              </label>

              {formData.disposition.transferred && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Specify facility/hospital</label>
                  <select
                    className="w-full border p-3 rounded-xl shadow-sm"
                    value={formData.transferredTo}
                    onChange={(e) => handleInputChange('transferredTo', e.target.value)}
                  >
                    <option value="">Select Center</option>
                    {(centers || []).map((c) => (
                      <option key={c._id || c.id} value={c.name || c.centerName || ''}>{c.name || c.centerName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Animal Profile */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Animal Profile</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">What type of animal? *</label>
          <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.animalType.dog}
                  onChange={(e) => handleCheckboxChange('animalType', 'dog', e.target.checked)}
                /> 
                Dog
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.animalType.cat}
                  onChange={(e) => handleCheckboxChange('animalType', 'cat', e.target.checked)}
                /> 
                Cat
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={formData.animalType.others}
                  onChange={(e) => handleCheckboxChange('animalType', 'others', e.target.checked)}
                /> 
                Others
              </label>
          </div>
          </div>
          
          {formData.animalType.others && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Please specify other animal</label>
              <input 
                type="text" 
                placeholder="e.g., Bat, Monkey, etc." 
                className="border p-3 rounded-xl shadow-sm w-full" 
                value={formData.otherAnimal}
                onChange={(e) => handleInputChange('otherAnimal', e.target.value)}
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Animal's Clinical Status *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "healthy", label: "Healthy" },
                { key: "sick", label: "Sick" },
                { key: "died", label: "Died" },
                { key: "killed", label: "Killed" }
              ].map((status) => (
                <label key={status.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={formData.animalStatus[status.key]}
                    onChange={(e) => handleCheckboxChange('animalStatus', status.key, e.target.checked)}
                  /> 
                  {status.label}
              </label>
            ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Brain Examination Status</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: "brainExamDone", label: "Brain Exam Done" },
                { key: "noBrainExam", label: "No Brain Exam" },
                { key: "unknown", label: "Unknown" }
              ].map((status) => (
                <label key={status.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={formData.brainExam[status.key]}
                    onChange={(e) => handleCheckboxChange('brainExam', status.key, e.target.checked)}
                  /> 
                  {status.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Category of Bite */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Category of Bite</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">WHO Category Classification *</label>
            <div className="space-y-3">
              {[
                { key: "category1", label: "Category 1", description: "Touching or feeding animals, licks on intact skin" },
                { key: "category2", label: "Category 2", description: "Nibbling of uncovered skin, minor scratches or abrasions without bleeding" },
                { key: "category3", label: "Category 3", description: "Single or multiple transdermal bites or scratches, licks on broken skin" }
              ].map((cat) => (
                <label key={cat.key} className="flex items-start gap-3 text-gray-700 p-3 border rounded-lg hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={formData.category[cat.key]}
                    onChange={(e) => handleCheckboxChange('category', cat.key, e.target.checked)}
                    className="mt-1"
                  /> 
                  <div>
                    <div className="font-medium">{cat.label}</div>
                    <div className="text-sm text-gray-500">{cat.description}</div>
                  </div>
              </label>
            ))}
            </div>
          </div>
        </section>

        {/* Allergies & Medications */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Allergies & Medications</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">History of Allergies</label>
            <input 
              type="text" 
              placeholder="e.g., Penicillin, Shellfish, etc. (Leave blank if none)" 
              className="border p-3 rounded-xl shadow-sm w-full" 
              value={formData.allergyHistory}
              onChange={(e) => handleInputChange('allergyHistory', e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Current Maintenance Medications</label>
            <input 
              type="text" 
              placeholder="e.g., Metformin, Lisinopril, etc. (Leave blank if none)" 
              className="border p-3 rounded-xl shadow-sm w-full" 
              value={formData.maintenanceMedications}
              onChange={(e) => handleInputChange('maintenanceMedications', e.target.value)}
            />
          </div>
        </section>

        {/* Diagnosis */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Diagnosis & Management</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Diagnosis *</label>
            <textarea 
              className="w-full border p-4 rounded-xl shadow-sm" 
              placeholder="Enter clinical diagnosis and assessment details..." 
              rows={4}
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Management Plan *</label>
            <textarea 
              className="w-full border p-4 rounded-xl shadow-sm" 
              placeholder="Enter treatment plan, medications, and follow-up instructions..." 
              rows={4}
              value={formData.managementDetails}
              onChange={(e) => handleInputChange('managementDetails', e.target.value)}
            ></textarea>
          </div>
        </section>

        {/* Patient Immunization */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Patient Immunization</h2>
          
          {/* DPT Immunization Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">A. DPT Immunization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={getNestedValue(formData, 'patientImmunization.dpt.complete')}
                  onChange={(e) => handleNestedCheckboxChange('patientImmunization.dpt.complete', e.target.checked)}
                />
                <label className="text-gray-700">Complete</label>
                <input 
                  type="text" 
                  placeholder="Year Given (last dose)" 
                  className="flex-1 border p-2 rounded shadow-sm ml-2" 
                  value={getNestedValue(formData, 'patientImmunization.dptYearGiven')}
                  onChange={(e) => handleNestedInputChange('patientImmunization.dptYearGiven', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={getNestedValue(formData, 'patientImmunization.dpt.incomplete')}
                  onChange={(e) => handleNestedCheckboxChange('patientImmunization.dpt.incomplete', e.target.checked)}
                />
                <label className="text-gray-700">Incomplete</label>
                <input 
                  type="text" 
                  placeholder="No. of doses given" 
                  className="flex-1 border p-2 rounded shadow-sm ml-2" 
                  value={getNestedValue(formData, 'patientImmunization.dptDosesGiven')}
                  onChange={(e) => handleNestedInputChange('patientImmunization.dptDosesGiven', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={getNestedValue(formData, 'patientImmunization.dpt.none')}
                  onChange={(e) => handleNestedCheckboxChange('patientImmunization.dpt.none', e.target.checked)}
                />
                <label className="text-gray-700">None</label>
              </div>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Previous Immunization History */}
            <div className="bg-white p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Previous</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">No. of doses given</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 3" 
                    className="w-full border p-2 rounded shadow-sm" 
                    value={getNestedValue(formData, 'patientImmunization.dptDosesGiven')}
                    onChange={(e) => handleNestedInputChange('patientImmunization.dptDosesGiven', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Year last dose given</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 2023" 
                    className="w-full border p-2 rounded shadow-sm" 
                    value={getNestedValue(formData, 'patientImmunization.dptYearGiven')}
                    onChange={(e) => handleNestedInputChange('patientImmunization.dptYearGiven', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Active Immunization (Toxoid) */}
            <div className="bg-white p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Active</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Toxoid</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      checked={getNestedValue(formData, 'patientImmunization.tt.active')}
                      onChange={(e) => handleNestedCheckboxChange('patientImmunization.tt.active', e.target.checked)}
                    />
                    <label className="text-gray-700">Toxoid</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      placeholder="Date" 
                      className="border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.ttDates.0')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttDates.0', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="RN Signature over trodat" 
                      className="border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.ttRnSignatures.0')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttRnSignatures.0', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* TT1, TT2, TT3 */}
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">TT1</label>
                    <input 
                      type="date" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.ttDates.0')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttDates.0', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="RN Signature over trodat" 
                      className="w-full border p-2 rounded shadow-sm mt-1" 
                      value={getNestedValue(formData, 'patientImmunization.ttRnSignatures.0')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttRnSignatures.0', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">TT2</label>
                    <input 
                      type="date" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.ttDates.1')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttDates.1', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="RN Signature over trodat" 
                      className="w-full border p-2 rounded shadow-sm mt-1" 
                      value={getNestedValue(formData, 'patientImmunization.ttRnSignatures.1')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttRnSignatures.1', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">TT3</label>
                    <input 
                      type="date" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.ttDates.2')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttDates.2', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="RN Signature over trodat" 
                      className="w-full border p-2 rounded shadow-sm mt-1" 
                      value={getNestedValue(formData, 'patientImmunization.ttRnSignatures.2')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.ttRnSignatures.2', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Passive Immunization / Testing */}
            <div className="bg-white p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Passive</h3>
              <div className="space-y-4">
                
                {/* SKIN TEST */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      checked={getNestedValue(formData, 'patientImmunization.skinTest')}
                      onChange={(e) => handleNestedCheckboxChange('patientImmunization.skinTest', e.target.checked)}
                    />
                    <label className="text-gray-700 font-medium">SKIN TEST</label>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="time" 
                      placeholder="Time Tested" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.skinTestTime')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.skinTestTime', e.target.value)}
                    />
                    <input 
                      type="time" 
                      placeholder="Time Read" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.skinTestReadTime')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.skinTestReadTime', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Result" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.skinTestResult')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.skinTestResult', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="MD Signature over trodat" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.skinTestMdSignature')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.skinTestMdSignature', e.target.value)}
                    />
                  </div>
                </div>

                {/* TIG (Tetanus Immune Globulin) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      checked={getNestedValue(formData, 'patientImmunization.tig')}
                      onChange={(e) => handleNestedCheckboxChange('patientImmunization.tig', e.target.checked)}
                    />
                    <label className="text-gray-700 font-medium">TIG</label>
                  </div>
                  
                  {/* First TIG Entry */}
                  <div className="space-y-2 mb-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Dose" 
                        className="flex-1 border p-2 rounded shadow-sm" 
                        value={getNestedValue(formData, 'patientImmunization.tigDose')}
                        onChange={(e) => handleNestedInputChange('patientImmunization.tigDose', e.target.value)}
                      />
                      <span className="flex items-center text-gray-600">U</span>
                    </div>
                    <input 
                      type="date" 
                      placeholder="Date Given" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.tigDate')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.tigDate', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="MD Signature over trodat" 
                      className="w-full border p-2 rounded shadow-sm" 
                      value={getNestedValue(formData, 'patientImmunization.tigMdSignature')}
                      onChange={(e) => handleNestedInputChange('patientImmunization.tigMdSignature', e.target.value)}
                    />
                  </div>

                  {/* Second TIG Entry */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Dose" 
                        className="flex-1 border p-2 rounded shadow-sm" 
                      />
                      <span className="flex items-center text-gray-600">U</span>
                    </div>
                    <input 
                      type="date" 
                      placeholder="Date Given" 
                      className="w-full border p-2 rounded shadow-sm" 
                    />
                    <input 
                      type="text" 
                      placeholder="MD Signature over trodat" 
                      className="w-full border p-2 rounded shadow-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Current Anti-Rabies Immunization */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Current Anti-Rabies Immunization</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Immunization Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "active", label: "Active", path: "currentImmunization.type.active" },
                { key: "postExposure", label: "Post-Exposure", path: "currentImmunization.type.postExposure" },
                { key: "preExposure", label: "Pre-Exposure", path: "currentImmunization.type.preExposure" },
                { key: "previouslyImmunized", label: "Previously Immunized", path: "currentImmunization.type.previouslyImmunized" }
              ].map((rabies) => (
                <label key={rabies.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={getNestedValue(formData, rabies.path)}
                    onChange={(e) => handleNestedCheckboxChange(rabies.path, e.target.checked)}
                  /> 
                  {rabies.label}
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Vaccine Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "pvrv", label: "SPEEDA (PVRV)", path: "currentImmunization.vaccine.pvrv" },
                { key: "pcec", label: "VAXIRAB (PCEC)", path: "currentImmunization.vaccine.pcec" }
              ].map((rabies) => (
                <label key={rabies.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={getNestedValue(formData, rabies.path)}
                    onChange={(e) => handleNestedCheckboxChange(rabies.path, e.target.checked)}
                  /> 
                  {rabies.label}
                  </label>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Route of Administration *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "id", label: "ID (Intradermal)", path: "currentImmunization.route.id" },
                { key: "im", label: "IM (Intramuscular)", path: "currentImmunization.route.im" }
              ].map((rabies) => (
                <label key={rabies.key} className="flex items-center gap-2 text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={getNestedValue(formData, rabies.path)}
                    onChange={(e) => handleNestedCheckboxChange(rabies.path, e.target.checked)}
                  /> 
                  {rabies.label}
                  </label>
              ))}
            </div>
          </div>
        </section>

        {/* HRIG */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">HRIG (Human Rabies Immune Globulin)</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">HRIG Administration Details</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">HRIG Dose (IU/kg)</label>
                <input 
                  type="text" 
                  placeholder="e.g., 20 IU/kg" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={getNestedValue(formData, 'currentImmunization.hrigDose')}
                  onChange={(e) => handleNestedInputChange('currentImmunization.hrigDose', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Date Given</label>
                <input 
                  type="date" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={getNestedValue(formData, 'currentImmunization.hrigDate')}
                  onChange={(e) => handleNestedInputChange('currentImmunization.hrigDate', e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="MD Signature over trodat" 
                  className="mt-2 border p-3 rounded-xl shadow-sm" 
                  value={getNestedValue(formData, 'currentImmunization.hrigMdSignature')}
                  onChange={(e) => handleNestedInputChange('currentImmunization.hrigMdSignature', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Local Infiltration */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Immunization Schedule Type</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Schedule Type *</label>
          <div className="flex gap-6">
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={getNestedValue(formData, 'currentImmunization.schedule.structured')}
                  onChange={(e) => handleNestedCheckboxChange('currentImmunization.schedule.structured', e.target.checked)}
                /> 
                Structured (Fixed schedule)
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input 
                  type="checkbox" 
                  checked={getNestedValue(formData, 'currentImmunization.schedule.unstructured')}
                  onChange={(e) => handleNestedCheckboxChange('currentImmunization.schedule.unstructured', e.target.checked)}
                /> 
                Unstructured (Flexible schedule)
              </label>
            </div>
          </div>
        </section>

        {/* Immunization Schedule */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Immunization Schedule</h2>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip:</strong> Select D0 (Day 0) date and all subsequent dates (D3, D7, D14, D28) will be automatically calculated for you.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { key: "d0", label: "D0", description: "Day 0 (Initial)" },
              { key: "d3", label: "D3", description: "Day 3" },
              { key: "d7", label: "D7", description: "Day 7" },
              { key: "d14", label: "D14", description: "Day 14" },
              { key: "d28", label: "D28", description: "Day 28" }
            ].map((day) => {
              const isD0 = day.key === "d0";
              const hasDate = formData.scheduleDates[day.key];
              const isCompleted = hasDate && new Date(hasDate) <= new Date();
              const isMissed = hasDate && new Date(hasDate) < new Date() && !isCompleted;
              
              return (
                <div key={day.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-700 font-medium">{day.label}</label>
                    {isD0 && (
                      <div className="flex items-center gap-1">
                        {hasDate ? (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isCompleted ? 'bg-green-100 text-green-800' : 
                            isMissed ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isCompleted ? '✓ Complete' : isMissed ? '✗ Missed' : '⏳ Scheduled'}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            Not Set
                          </span>
                        )}
              </div>
                    )}
          </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {day.description}
                    {day.key !== 'd0' && formData.scheduleDates.d0 && (
                      <span className="ml-1 text-blue-600">(Auto-calculated)</span>
                    )}
                  </div>
                  <input 
                    type="date" 
                    className={`border p-3 rounded-xl shadow-sm ${
                      isD0 && hasDate ? (isCompleted ? 'border-green-300' : isMissed ? 'border-red-300' : 'border-yellow-300') : 
                      day.key !== 'd0' && formData.scheduleDates.d0 ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                    value={formData.scheduleDates[day.key]}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      
                      if (isD0 && selectedDate) {
                        // Calculate all subsequent dates based on D0
                        const calculatedDates = calculateScheduleDates(selectedDate);
                        setFormData(prev => ({
                          ...prev,
                          scheduleDates: {
                            ...prev.scheduleDates,
                            ...calculatedDates
                          }
                        }));
                      } else {
                        // For other dates, just update the specific date
                        setFormData(prev => ({
                          ...prev,
                          scheduleDates: {
                            ...prev.scheduleDates,
                            [day.key]: selectedDate
                          }
                        }));
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
          
          {/* D0 Status Summary */}
          {formData.scheduleDates.d0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">Immunization Schedule Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-blue-700">
                      D0 scheduled for: <strong>{new Date(formData.scheduleDates.d0).toLocaleDateString()}</strong>
                    </span>
                    {new Date(formData.scheduleDates.d0) <= new Date() ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-blue-700">
                    <strong>Auto-calculated schedule:</strong>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    D3: {formData.scheduleDates.d3 ? new Date(formData.scheduleDates.d3).toLocaleDateString() : 'N/A'} • 
                    D7: {formData.scheduleDates.d7 ? new Date(formData.scheduleDates.d7).toLocaleDateString() : 'N/A'} • 
                    D14: {formData.scheduleDates.d14 ? new Date(formData.scheduleDates.d14).toLocaleDateString() : 'N/A'} • 
                    D28: {formData.scheduleDates.d28 ? new Date(formData.scheduleDates.d28).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Follow-up */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Follow-up</h2>
          <div className="space-y-4">
            {formData.followUp.map((followUp, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  type="date" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={followUp.date}
                  onChange={(e) => handleFollowUpChange(index, 'date', e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Findings / Adverse Reaction" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={followUp.findings}
                  onChange={(e) => handleFollowUpChange(index, 'findings', e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Management" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={followUp.management}
                  onChange={(e) => handleFollowUpChange(index, 'management', e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="MD Signature" 
                  className="border p-3 rounded-xl shadow-sm" 
                  value={followUp.mdSignature}
                  onChange={(e) => handleFollowUpChange(index, 'mdSignature', e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Conformed Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Conformed</h2>
          <p className="text-gray-600 mb-4">
            Pinahihintulutan ko ang doctor at nars ng Tibagan Health Center na gamutin at gawin ang kaukulang lunas na makabubuti sa sakit o kondisyon ko o ng aking pasyente.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <input 
              type="text" 
              placeholder="Lagda ng Pasyente / Bantay" 
              className="border p-3 rounded-xl shadow-sm" 
              value={formData.patientSignature}
              onChange={(e) => handleInputChange('patientSignature', e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Lagda ng Saksi" 
              className="border p-3 rounded-xl shadow-sm" 
              value={formData.witnessSignature}
              onChange={(e) => handleInputChange('witnessSignature', e.target.value)}
            />
          </div>
        </section>

        {/* Submit */}
        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </div>
    </div>
  );
}
