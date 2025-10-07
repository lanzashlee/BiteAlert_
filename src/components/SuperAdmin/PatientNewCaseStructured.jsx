import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { apiFetch } from '../../config/api';

// Compact, structured new-case form that mirrors the mobile Dart layout.
export default function PatientNewCaseStructured({ selectedPatient, onSaved, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Core identifiers / defaults
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [philhealth, setPhilhealth] = useState('');
  const [dateRegistered, setDateRegistered] = useState('');
  const [center, setCenter] = useState('');
  const [centers, setCenters] = useState([]);

  // Helper function to count selected injuries
  const getSelectedInjuryCount = () => {
    const injuryTypes = ['abrasion', 'avulsion', 'burn', 'concussion', 'contusion', 'openWound', 'trauma'];
    return injuryTypes.filter(type => injury[type]).length;
  };

  // Load vaccine stocks from database
  const loadVaccineStocks = async () => {
    try {
      setStockLoading(true);
      const response = await apiFetch('/api/vaccinestocks');
      const data = await response.json();
      
      if (data.success && data.data) {
        setVaccineStocks(data.data);
        console.log('📦 Loaded vaccine stocks:', data.data);
      }
    } catch (error) {
      console.error('Error loading vaccine stocks:', error);
    } finally {
      setStockLoading(false);
    }
  };

  // Load centers for dropdown
  useEffect(() => {
    const loadCenters = async () => {
      try {
        console.log('Loading centers...');
        const endpoints = ['/api/centers', '/api/center', '/api/health-centers'];

        const fetchAllPages = async (baseEndpoint) => {
          let page = 1;
          const pageSize = 100;
          let all = [];
          while (true) {
            const url = baseEndpoint.includes('?')
              ? `${baseEndpoint}&page=${page}&limit=${pageSize}`
              : `${baseEndpoint}?page=${page}&limit=${pageSize}`;
            try {
              const res = await apiFetch(url);
              const json = await res.json();
              const list = Array.isArray(json) ? json : (json.data || json.centers || []);
              if (!list || list.length === 0) break;
              all = all.concat(list);
              const totalPages = json.totalPages || json.pages || null;
              if (totalPages && page >= totalPages) break;
              if (!totalPages && list.length < pageSize) break;
              page += 1;
            } catch (e) {
              console.log('Centers paging fetch failed for', url, e);
              break;
            }
          }
          return all;
        };

        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const list = await fetchAllPages(endpoint);
            if (Array.isArray(list) && list.length) {
              const cleaned = list
                .filter(c => !c.isArchived)
                .map(c => ({ _id: c._id || c.id || String(c.name || c.centerName), name: String(c.centerName || c.name || '').trim() }))
                .filter(c => c.name)
                .sort((a,b)=>a.name.localeCompare(b.name));
              setCenters(cleaned);
              console.log('Centers loaded successfully from:', endpoint, 'count:', cleaned.length);
              return;
            }
          } catch (endpointError) {
            console.log(`${endpoint} failed:`, endpointError);
            continue;
          }
        }

        console.log('All center endpoints failed, using fallback data');
        setCenters([
          { _id: '1', name: 'Balong-Bato Center' },
          { _id: '2', name: 'Salapan Center' },
          { _id: '3', name: 'San Juan Center' }
        ]);

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
    loadVaccineStocks();
  }, []);

  // Basic info
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [sex, setSex] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [religion, setReligion] = useState('');
  const [occupation, setOccupation] = useState('');
  const [phone, setPhone] = useState('');

  // Address
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [subdivision, setSubdivision] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [zipCode, setZipCode] = useState('');

  // History of bite
  const [typeNonBite, setTypeNonBite] = useState(false);
  const [typeBite, setTypeBite] = useState(true); // Default to bite
  const [dateOfInquiry, setDateOfInquiry] = useState(new Date().toISOString().split('T')[0]);
  const [timeOfInjury, setTimeOfInjury] = useState('AM');
  const [site, setSite] = useState({ head:false, face:false, neck:false, chest:false, back:false, abdomen:false, upper:false, lower:false, others:false, othersText:'' });

  // Nature of injury
  const [injury, setInjury] = useState({ multiple:false, abrasion:false, avulsion:false, burn:false, burnDegree:1, burnSite:'', concussion:false, contusion:false, openWound:false, trauma:false, others:false, othersText:'' });

  // External cause / place / disposition
  const [biteSting, setBiteSting] = useState(false);
  const [biteStingDetails, setBiteStingDetails] = useState('');
  const [chemicalSubstance, setChemicalSubstance] = useState(false);
  const [chemicalDetails, setChemicalDetails] = useState('');
  const [place, setPlace] = useState({ home:false, school:false, road:false, neighbor:false, others:false, othersText:'' });
  const [treated, setTreated] = useState(false);
  const [transferred, setTransferred] = useState(false);
  const [transferredTo, setTransferredTo] = useState('');
  const [provoked, setProvoked] = useState(false);
  const [unprovoked, setUnprovoked] = useState(false);
  
  // Washing of Wound
  const [woundWashing, setWoundWashing] = useState(true); // Default to yes
  const [noWoundWashing, setNoWoundWashing] = useState(false);
  
  // Diagnosis and Category
  const [diagnosis, setDiagnosis] = useState('Okay na');
  const [category1, setCategory1] = useState(false);
  const [category2, setCategory2] = useState(true); // Default to category 2
  const [category3, setCategory3] = useState(false);
  
  // Medical History
  const [allergyHistory, setAllergyHistory] = useState('None');
  const [maintenanceMedications, setMaintenanceMedications] = useState('');
  const [management, setManagement] = useState('Sent Home');

  // Animal profile
  const [animal, setAnimal] = useState({ 
    dog: true, // Default to dog
    cat: false, 
    other: false, 
    otherText: '', 
    healthy: true, // Default to healthy
    sick: false, 
    died: false, 
    killed: false, 
    brainExam: false, 
    noBrainExam: true, // Default to no brain exam
    unknown: false, 
    immunized: false, 
    notImmunized: true, // Default to not immunized
    immunizedYear: '', 
    pet: true, // Default to pet
    neighbor: false, 
    stray: false
  });

  // Patient immunization (DPT / TT)
  const [dpt, setDpt] = useState({ complete:false, incomplete:false, none:false, year:'', doses:'', previousDoses:'', previousYear:'' });
  const [tt, setTt] = useState({ active:false, passive:false, tt1:'', tt2:'', tt3:'' });

  // Current anti-rabies immunization
  const [current, setCurrent] = useState({ 
    active:true, post:true, pre:false, prevImm:false, pvrv:false, pcec:false, id:false, im:false, 
    passive:false, toxoid:false, skinTest:false, skinTime:'', skinRead:'', skinResult:'', skinDose:'', skinDate:'', 
    tig:false, tigDose:'', tigDate:'', toxoidDate1:'', toxoidDate2:'', toxoidDate3:'',
    hrig:false, hrigDose:'', hrigDate:'', localInfiltration:false, structured:false, unstructured:false 
  });

  // Vaccine stock data
  const [vaccineStocks, setVaccineStocks] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);

  // Check if vaccine is available in stock
  const isVaccineAvailable = (vaccineName, centerName) => {
    const centerStock = vaccineStocks.find(stock => 
      stock.center === centerName || stock.centerName === centerName
    );
    
    if (!centerStock) return false;
    
    const vaccine = centerStock.vaccines?.find(v => 
      v.name === vaccineName || v.vaccineName === vaccineName
    );
    
    if (!vaccine) return false;
    
    const totalStock = vaccine.stockEntries?.reduce((sum, entry) => 
      sum + (Number(entry.stock) || 0), 0
    ) || 0;
    
    return totalStock > 0;
  };

  // Get available vaccines for center
  const getAvailableVaccines = (centerName) => {
    const centerStock = vaccineStocks.find(stock => 
      stock.center === centerName || stock.centerName === centerName
    );
    
    if (!centerStock) return [];
    
    return centerStock.vaccines?.filter(vaccine => {
      const totalStock = vaccine.stockEntries?.reduce((sum, entry) => 
        sum + (Number(entry.stock) || 0), 0
      ) || 0;
      return totalStock > 0;
    }) || [];
  };

  // Deduct vaccine stock
  const deductVaccineStock = async (vaccineName, centerName, quantity = 1) => {
    try {
      const response = await apiFetch('/api/stock/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centerName: centerName,
          itemName: vaccineName,
          quantity: quantity,
          operation: 'deduct'
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deducting vaccine stock:', error);
      return { success: false, message: 'Failed to deduct stock' };
    }
  };

  // Schedule
  const [schedule, setSchedule] = useState({ d0:'', d3:'', d7:'', d14:'', d28:'' });

  // Utilities
  const toIsoUtcNoon = (mmddyyyy) => {
    if (!mmddyyyy) return null;
    try {
      const d = new Date(mmddyyyy);
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
    } catch { return null; }
  };

  const toISO = (d) => d.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

  const genReg = () => {
    const yy = String(new Date().getFullYear()).slice(2);
    const rnd = Math.floor(Math.random()*10000).toString().padStart(4,'0');
    const tail = String(Date.now()).slice(-2);
    return `${yy}-${rnd}${tail}`;
  };

  // Generate registration number only once when component mounts
  const [initialRegistrationNumber] = useState(() => genReg());

  // Generate date registered only once when component mounts
  const [initialDateRegistered] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
  });

  // Generate initial schedule only once when component mounts
  const [initialSchedule] = useState(() => {
    const base = new Date();
    return { 
      d0: toISO(base), 
      d3: toISO(new Date(base.getTime()+3*86400000)), 
      d7: toISO(new Date(base.getTime()+7*86400000)), 
      d14: toISO(new Date(base.getTime()+14*86400000)), 
      d28: toISO(new Date(base.getTime()+28*86400000))
    };
  });

  useEffect(() => {
    const p = selectedPatient || {};
    setRegistrationNumber(initialRegistrationNumber);
    setDateRegistered(initialDateRegistered);
    setCenter((p.barangay ? (p.barangay.endsWith('Center')? p.barangay : `${p.barangay} Center`) : '') || '');

    setFirstName(p.firstName||'');
    setMiddleName(p.middleName||'');
    setLastName(p.lastName||'');
    setBirthdate(p.birthdate ? new Date(p.birthdate).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : '');
    setSex(p.sex||'');
    setAge(p.birthdate ? String(new Date().getFullYear() - new Date(p.birthdate).getFullYear()) : '');
    setPhone(p.phone||'');
    setBirthPlace(p.birthPlace||'');
    setCivilStatus(p.civilStatus||'');
    setNationality(p.nationality||'');
    setReligion(p.religion||'');
    setOccupation(p.occupation||'');
    setHouseNo(p.houseNo||'');
    setStreet(p.street||'');
    setBarangay(p.barangay||'');
    setSubdivision(p.subdivision||'');
    setCity(p.city||'');
    setProvince(p.province||'');
    setZipCode(p.zipCode||'');

    // Set the pre-generated schedule
    setSchedule(initialSchedule);
  }, [selectedPatient, initialRegistrationNumber, initialDateRegistered, initialSchedule]);

  // Memoized onChange handlers to prevent re-renders
  const handleFirstNameChange = useCallback((e) => setFirstName(e.target.value), []);
  const handleMiddleNameChange = useCallback((e) => setMiddleName(e.target.value), []);
  const handleLastNameChange = useCallback((e) => setLastName(e.target.value), []);
  const handleSexChange = useCallback((e) => setSex(e.target.value), []);
  const handleAgeChange = useCallback((e) => setAge(e.target.value), []);
  const handleWeightChange = useCallback((e) => setWeight(e.target.value), []);
  const handleBirthPlaceChange = useCallback((e) => setBirthPlace(e.target.value), []);
  const handlePhoneChange = useCallback((e) => setPhone(e.target.value), []);
  const handleHouseNoChange = useCallback((e) => setHouseNo(e.target.value), []);
  const handleStreetChange = useCallback((e) => setStreet(e.target.value), []);
  const handleBarangayChange = useCallback((e) => setBarangay(e.target.value), []);
  const handleCityChange = useCallback((e) => setCity(e.target.value), []);
  const handleProvinceChange = useCallback((e) => setProvince(e.target.value), []);
  const handleZipCodeChange = useCallback((e) => setZipCode(e.target.value), []);
  const handleNationalityChange = useCallback((e) => setNationality(e.target.value), []);
  const handleReligionChange = useCallback((e) => setReligion(e.target.value), []);
  const handleOccupationChange = useCallback((e) => setOccupation(e.target.value), []);
  const handleCivilStatusChange = useCallback((e) => setCivilStatus(e.target.value), []);
  const handleSubdivisionChange = useCallback((e) => setSubdivision(e.target.value), []);
  const handlePhilhealthChange = useCallback((e) => setPhilhealth(e.target.value), []);
  
  // Memoized handlers for complex state updates
  const handleTypeNonBiteChange = useCallback((e) => {
    const checked = e.target.checked;
    setTypeNonBite(checked);
    if (checked) setTypeBite(false);
  }, []);
  
  const handleTypeBiteChange = useCallback((e) => {
    const checked = e.target.checked;
    setTypeBite(checked);
    if (checked) setTypeNonBite(false);
  }, []);
  
  const handleTreatedChange = useCallback((e) => {
    const checked = e.target.checked;
    setTreated(checked);
    if (checked) setTransferred(false);
  }, []);
  
  const handleTransferredChange = useCallback((e) => {
    const checked = e.target.checked;
    setTransferred(checked);
    if (checked) setTreated(false);
  }, []);
  
  const handleProvokedChange = useCallback((e) => {
    const checked = e.target.checked;
    setProvoked(checked);
    if (checked) setUnprovoked(false);
  }, []);
  
  const handleUnprovokedChange = useCallback((e) => {
    const checked = e.target.checked;
    setUnprovoked(checked);
    if (checked) setProvoked(false);
  }, []);
  
  const handleWoundWashingChange = useCallback((e) => {
    const checked = e.target.checked;
    setWoundWashing(checked);
    if (checked) setNoWoundWashing(false);
  }, []);
  
  const handleNoWoundWashingChange = useCallback((e) => {
    const checked = e.target.checked;
    setNoWoundWashing(checked);
    if (checked) setWoundWashing(false);
  }, []);
  
  const handleCategory1Change = useCallback((e) => {
    const checked = e.target.checked;
    setCategory1(checked);
    if (checked) {
      setCategory2(false);
      setCategory3(false);
    }
  }, []);
  
  const handleCategory2Change = useCallback((e) => {
    const checked = e.target.checked;
    setCategory2(checked);
    if (checked) {
      setCategory1(false);
      setCategory3(false);
    }
  }, []);
  
  const handleCategory3Change = useCallback((e) => {
    const checked = e.target.checked;
    setCategory3(checked);
    if (checked) {
      setCategory1(false);
      setCategory2(false);
    }
  }, []);

  const validate = () => {
    // Basic information validation
    if (!firstName || !lastName || !sex) return 'Basic information is incomplete';
    if (!barangay || !city || !province) return 'Address is incomplete';
    
    // Animal Profile validation
    if (!animal.dog && !animal.cat && !animal.other) return 'Please select at least one animal type';
    if (animal.other && !animal.otherText.trim()) return 'Please specify the animal type in "Others" field';
    
    if (!animal.healthy && !animal.sick && !animal.died && !animal.killed) return 'Please select animal condition';
    
    if (!animal.brainExam && !animal.noBrainExam && !animal.unknown) return 'Please select brain exam status';
    
    if (!animal.immunized && !animal.notImmunized) return 'Please select immunization status';
    if (animal.immunized && !animal.immunizedYear.trim()) return 'Please specify the year of immunization';
    
    if (!animal.pet && !animal.neighbor && !animal.stray) return 'Please select animal ownership';
    
    // Nature of Injury validation
    if (!injury.multiple && !injury.abrasion && !injury.avulsion && !injury.burn && !injury.concussion && !injury.contusion && !injury.openWound && !injury.trauma && !injury.others) {
      return 'Please select at least one injury type or mark as "No" for multiple injuries';
    }
    if (injury.others && !injury.othersText.trim()) return 'Please specify other injury details';
    if (injury.burn && (!injury.burnDegree || injury.burnDegree < 1 || injury.burnDegree > 4)) return 'Please specify valid burn degree (1-4)';
    
    // External Cause validation
    if (!biteSting && !chemicalSubstance) return 'Please select at least one external cause';
    if (biteSting && !biteStingDetails.trim()) return 'Please specify the animal/insect for bite/sting';
    if (chemicalSubstance && !chemicalDetails.trim()) return 'Please specify the chemical substance';
    
    // Place of Occurrence validation
    if (!place.home && !place.school && !place.road && !place.neighbor && !place.others) return 'Please select place of occurrence';
    if (place.others && !place.othersText.trim()) return 'Please specify other place of occurrence';
    
    // Disposition validation
    if (!treated && !transferred) return 'Please select disposition (Treated & Sent Home or Transferred)';
    if (transferred && !transferredTo.trim()) return 'Please select facility/hospital for transfer';
    
    // Circumstance of Bite validation
    if (!provoked && !unprovoked) return 'Please select circumstance of bite (Provoked or Unprovoked)';
    
    // Medical History validation
    if (!diagnosis.trim()) return 'Please enter diagnosis';
    if (!category1 && !category2 && !category3) return 'Please select bite category';
    if (!allergyHistory.trim()) return 'Please enter allergy history';
    if (!maintenanceMedications.trim()) return 'Please enter maintenance medications';
    if (!management.trim()) return 'Please enter management plan';
    
    // Patient Immunization validation
    if (!dpt.complete && !dpt.incomplete && !dpt.none) return 'Please select DPT immunization status';
    if (dpt.complete && !dpt.year.trim()) return 'Please specify the year for complete DPT immunization';
    if (dpt.incomplete && !dpt.doses.trim()) return 'Please specify number of doses for incomplete DPT immunization';
    
    // Current Anti-Rabies Immunization validation
    if (!current.active && !current.passive) return 'Please select immunization type (Active or Passive)';
    if (current.active && !current.post && !current.pre && !current.prevImm) return 'Please select exposure type for active immunization';
    
    // Vaccine selection validation
    if (current.active && !current.pvrv && !current.pcec) return 'Please select at least one vaccine (SPEEDA or VAXIRAB)';
    if (current.active && !current.id && !current.im) return 'Please select route of administration (ID or IM)';
    
    if (current.passive && !current.skinTest && !current.hrig) return 'Please select passive immunization type (SKIN TEST or HRIG)';
    if (current.skinTest && (!current.skinTime || !current.skinRead || !current.skinResult.trim() || !current.skinDate)) return 'Please complete SKIN TEST details';
    if (current.hrig && (!current.hrigDose.trim() || !current.hrigDate)) return 'Please specify HRIG dose and date';
    
    // Schedule dates validation
    if (!schedule.d0 || !schedule.d3 || !schedule.d7 || !schedule.d14 || !schedule.d28) return 'Please complete all vaccination schedule dates';
    
    // Date sequence validation
    const d0Date = new Date(schedule.d0);
    const d3Date = new Date(schedule.d3);
    const d7Date = new Date(schedule.d7);
    const d14Date = new Date(schedule.d14);
    const d28Date = new Date(schedule.d28);
    
    if (d0Date >= d3Date) return 'D3 date must be after D0 date';
    if (d3Date >= d7Date) return 'D7 date must be after D3 date';
    if (d7Date >= d14Date) return 'D14 date must be after D7 date';
    if (d14Date >= d28Date) return 'D28 date must be after D14 date';
    
    // Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    if (d0Date < today) return 'D0 date cannot be in the past';
    
    return '';
  };

  const onSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true); setError('');
    try {
      // Deduct vaccine stock if vaccines are selected
      if (current.active && (current.pvrv || current.pcec)) {
        if (current.pvrv) {
          const stockResult = await deductVaccineStock('SPEEDA', center, 1);
          if (!stockResult.success) {
            setError(`Failed to deduct SPEEDA stock: ${stockResult.message}`);
            setSaving(false);
            return;
          }
        }
        if (current.pcec) {
          const stockResult = await deductVaccineStock('VAXIRAB', center, 1);
          if (!stockResult.success) {
            setError(`Failed to deduct VAXIRAB stock: ${stockResult.message}`);
            setSaving(false);
            return;
          }
        }
      }
      // Build arrays for multi-select fields
      const typeOfExposure = [];
      if (typeNonBite) typeOfExposure.push('NON-BITE');
      if (typeBite) typeOfExposure.push('BITE');
      
      const siteOfBite = [];
      if (site.head) siteOfBite.push('Head');
      if (site.face) siteOfBite.push('Face');
      if (site.neck) siteOfBite.push('Neck');
      if (site.chest) siteOfBite.push('Chest');
      if (site.back) siteOfBite.push('Back');
      if (site.abdomen) siteOfBite.push('Abdomen');
      if (site.upper) siteOfBite.push('Upper Extremities');
      if (site.lower) siteOfBite.push('Lower Extremities');
      if (site.others) siteOfBite.push('Others');
      
      const natureOfInjury = [];
      if (injury.multiple) natureOfInjury.push('Multiple Injuries');
      if (injury.abrasion) natureOfInjury.push('Abrasion');
      if (injury.avulsion) natureOfInjury.push('Avulsion');
      if (injury.burn) natureOfInjury.push('Burn');
      if (injury.concussion) natureOfInjury.push('Concussion');
      if (injury.contusion) natureOfInjury.push('Contusion');
      if (injury.openWound) natureOfInjury.push('Open Wound');
      if (injury.trauma) natureOfInjury.push('Trauma');
      if (injury.others) natureOfInjury.push('Others');
      
      const placeOfOccurrence = [];
      if (place.home) placeOfOccurrence.push('Home');
      if (place.school) placeOfOccurrence.push('School');
      if (place.road) placeOfOccurrence.push('Road');
      if (place.neighbor) placeOfOccurrence.push('Neighbor');
      if (place.others) placeOfOccurrence.push('Others');
      
      const disposition = [];
      if (treated) disposition.push('Treated & Sent Home');
      if (transferred) disposition.push('Transferred');
      
      const circumstanceOfBite = [];
      if (provoked) circumstanceOfBite.push('Provoked');
      if (unprovoked) circumstanceOfBite.push('Unprovoked');
      
      const animalSpecies = [];
      if (animal.dog) animalSpecies.push('Dog');
      if (animal.cat) animalSpecies.push('Cat');
      if (animal.other) animalSpecies.push('Others');
      
      const animalClinicalStatus = [];
      if (animal.healthy) animalClinicalStatus.push('Healthy');
      if (animal.sick) animalClinicalStatus.push('Sick');
      if (animal.died) animalClinicalStatus.push('Died');
      if (animal.killed) animalClinicalStatus.push('Killed');
      
      const animalBrainExam = [];
      if (animal.brainExam) animalBrainExam.push('Done');
      if (animal.noBrainExam) animalBrainExam.push('Not Done');
      if (animal.unknown) animalBrainExam.push('Unknown');
      
      const animalVaccinationStatus = [];
      if (animal.immunized) animalVaccinationStatus.push('Immunized');
      if (animal.notImmunized) animalVaccinationStatus.push('Not Immunized');
      
      const animalOwnership = [];
      if (animal.pet) animalOwnership.push('Pet');
      if (animal.neighbor) animalOwnership.push('Neighbor');
      if (animal.stray) animalOwnership.push('Stray');
      
      const externalCause = [];
      if (biteSting) externalCause.push('Bite/Sting');
      if (chemicalSubstance) externalCause.push('Chemical Substance');
      
      const washingWound = [];
      if (woundWashing) washingWound.push('Yes');
      if (noWoundWashing) washingWound.push('No');
      
      const category = [];
      if (category1) category.push('Category 1');
      if (category2) category.push('Category 2');
      if (category3) category.push('Category 3');
      
      const currentImmunizationType = [];
      if (current.active) currentImmunizationType.push('Active');
      if (current.post) currentImmunizationType.push('Post-exposure');
      if (current.pre) currentImmunizationType.push('Pre-exposure');
      if (current.prevImm) currentImmunizationType.push('Previously Immunized');
      
      const currentImmunizationVaccine = [];
      if (current.pvrv) currentImmunizationVaccine.push('PVRV');
      if (current.pcec) currentImmunizationVaccine.push('PCEC');
      
      const currentImmunizationRoute = [];
      if (current.id) currentImmunizationRoute.push('ID');
      if (current.im) currentImmunizationRoute.push('IM');
      
      const payload = {
        patientId: selectedPatient?._id || selectedPatient?.patientId,
        registrationNumber,
        philhealthNo: '',
        dateRegistered: toIsoUtcNoon(dateRegistered),
        arrivalDate: dateOfInquiry || null,
        arrivalTime: timeOfInjury || null,
        firstName,
        middleName: middleName || '',
        lastName,
        civilStatus: civilStatus || null,
        birthdate: toIsoUtcNoon(birthdate),
        birthplace: birthPlace || null,
        nationality: nationality || null,
        religion: religion || null,
        occupation: occupation || null,
        contactNo: phone || null,
        houseNo,
        street,
        barangay,
        subdivision,
        city,
        province,
        zipCode,
        age,
        weight,
        sex,
        center,
        scheduleDates: [schedule.d0, schedule.d3, schedule.d7, schedule.d14, schedule.d28].map(toIsoUtcNoon).filter(Boolean),
        animalStatus: animal.healthy ? 'Alive' : (animal.died ? 'Died' : 'Unknown'),
        remarks: diagnosis || 'Completed',
        dateOfInquiry: dateOfInquiry || null,
        timeOfInjury: timeOfInjury || null,
        typeOfExposure,
        siteOfBite,
        othersBiteSpecify: site.othersText || '',
        natureOfInjury,
        burnDegree: injury.burnDegree,
        burnSite: injury.burnSite || '',
        othersInjuryDetails: injury.othersText || '',
        externalCause,
        biteStingDetails: biteStingDetails || '',
        chemicalSubstanceDetails: chemicalDetails || '',
        placeOfOccurrence,
        placeOthersDetails: place.othersText || '',
        disposition,
        transferredTo: transferred ? transferredTo : '',
        circumstanceOfBite,
        animalProfile: {
          species: animalSpecies,
          othersSpecify: animal.otherText || '',
          clinicalStatus: animalClinicalStatus,
          brainExam: animalBrainExam,
          vaccinationStatus: animalVaccinationStatus,
          vaccinationDate: animal.immunizedYear || '',
          ownership: animalOwnership
        },
        management: {
          washingWound,
          category,
          diagnosis: diagnosis || 'Okay na',
          allergyHistory: allergyHistory || 'None',
          maintenanceMedications: maintenanceMedications || '',
          managementDetails: management || 'Sent Home'
        },
        patientImmunization: {
          dpt: [],
          dptYearGiven: dpt.year || null,
          dptDosesGiven: dpt.doses || null,
          tt: [],
          ttDates: [],
          skinTest: current.skinTest,
          skinTestTime: current.skinTime || null,
          skinTestReadTime: current.skinRead || null,
          skinTestResult: current.skinResult || null,
          skinTestDose: null,
          skinTestDate: current.skinDate || null,
          tig: current.hrig,
          tigDose: current.hrigDose || null,
          tigDate: current.hrigDate || null
        },
        currentImmunization: {
          type: currentImmunizationType,
          vaccine: currentImmunizationVaccine,
          route: currentImmunizationRoute,
          passive: current.passive,
          skinTest: current.skinTest,
          skinTestTime: current.skinTime || '',
          skinTestReadTime: current.skinRead || '',
          skinTestResult: current.skinResult || '',
          skinTestDate: current.skinDate || '',
          hrig: current.hrig,
          hrigDose: current.hrigDose || '',
          hrigDate: current.hrigDate || '',
          localInfiltration: current.localInfiltration,
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
        },
        status: 'completed',
        initiallyAssessedBy: 'Duke Reyes',
        finalAssessedBy: 'Duke Reyes'
      };

      const res = await apiFetch('/api/bitecases', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const created = await res.json();
      if (!res.ok || !created?.success && !created?._id) throw new Error(created?.message || 'Failed to create bitecase');
      const biteCaseId = created._id || created.data?._id;

      // Vaccination dates
      const vdates = { biteCaseId, patientId: payload.patientId, registrationNumber, d0Date: toIsoUtcNoon(schedule.d0), d3Date: toIsoUtcNoon(schedule.d3), d7Date: toIsoUtcNoon(schedule.d7), d14Date: toIsoUtcNoon(schedule.d14), d28Date: toIsoUtcNoon(schedule.d28), treatmentStatus: 'in_progress', exposureCategory: payload.exposureCategory, lastTreatmentDate: null };
      const res2 = await apiFetch('/api/vaccinationdates', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(vdates) });
      await res2.json().catch(()=>({}));

      if (onSaved) onSaved(created);
    } catch (e) {
      setError(String(e.message||e));
    } finally { setSaving(false); }
  };

  // --- Modern Styling System ---
  const palette = { 
    brand: '#7D0C0C', 
    brandLight: '#9B1C1C',
    paper: '#FFFFFF', 
    line: '#E5E7EB', 
    subtle: '#F9FAFB',
    text: '#1F2937',
    textLight: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  };
  
  const card = { 
    background: palette.paper, 
    border: '1px solid ' + palette.line, 
    borderRadius: 16, 
    padding: 24, 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    marginBottom: 20,
    transition: 'all 0.2s ease-in-out'
  };
  
  const h3Style = { 
    color: palette.brand, 
    fontSize: 20, 
    fontWeight: 700, 
    margin: '0 0 16px 0',
    borderBottom: `2px solid ${palette.brand}`,
    paddingBottom: 8
  };
  
  const h4Style = { 
    color: palette.text, 
    fontSize: 16, 
    fontWeight: 600, 
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  };
  
  const label = { 
    fontSize: 14, 
    fontWeight: 600, 
    color: palette.text, 
    marginBottom: 8,
    display: 'block'
  };
  
  const inputCss = { 
    width: '100%', 
    padding: '12px 16px', 
    border: '2px solid #E5E7EB', 
    borderRadius: 8, 
    background: '#fff', 
    outline: 'none',
    fontSize: 14,
    transition: 'all 0.2s ease-in-out',
    '&:focus': {
      borderColor: palette.brand,
      boxShadow: `0 0 0 3px ${palette.brand}20`
    }
  };
  
  const checkboxStyle = {
    width: 18,
    height: 18,
    accentColor: palette.brand,
    cursor: 'pointer'
  };
  
  const row = { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
    gap: 20,
    marginBottom: 16
  };
  
  const sectionStyle = {
    marginBottom: 24,
    padding: '20px 0',
    borderBottom: `1px solid ${palette.line}`,
    '&:last-child': {
      borderBottom: 'none'
    }
  };
  
  const buttonStyle = {
    primary: {
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${palette.brand} 0%, ${palette.brandLight} 100%)`,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 6px 8px -1px rgba(0, 0, 0, 0.15)'
      },
      '&:disabled': {
        opacity: 0.6,
        cursor: 'not-allowed',
        transform: 'none'
      }
    },
    secondary: {
      padding: '12px 24px',
      background: '#F3F4F6',
      color: palette.text,
      border: '2px solid #E5E7EB',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        background: '#E5E7EB',
        borderColor: palette.textLight
      }
    }
  };

  const Labeled = ({ labelText, children, required = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140, marginBottom: 16 }}>
      <label style={label}>
        {labelText}
        {required && <span style={{ color: palette.error, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .modern-form input:focus {
            border-color: ${palette.brand} !important;
            box-shadow: 0 0 0 3px ${palette.brand}20 !important;
            outline: none !important;
          }
          
          .modern-form input:hover {
            border-color: ${palette.brandLight} !important;
          }
          
          .modern-form select:focus {
            border-color: ${palette.brand} !important;
            box-shadow: 0 0 0 3px ${palette.brand}20 !important;
            outline: none !important;
          }
          
          .modern-form textarea:focus {
            border-color: ${palette.brand} !important;
            box-shadow: 0 0 0 3px ${palette.brand}20 !important;
            outline: none !important;
          }
          
          .modern-form button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
          }
          
          .modern-form button:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        `}
      </style>
      <div className="modern-form" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 24,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        background: palette.subtle,
        minHeight: '100vh'
      }}>
      {error ? (
        <div style={{ 
          color: palette.error, 
          background: '#FEF2F2', 
          border: `2px solid ${palette.error}20`, 
          padding: 16, 
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      ) : null}

      {/* Basic info */}
      <div style={card}>
        <h3 style={h3Style}>Basic Information</h3>
        <div style={row}>
          <Labeled labelText="Registration Number" required>
            <input style={inputCss} value={registrationNumber} readOnly />
          </Labeled>
          <Labeled labelText="Philhealth No.">
            <input style={inputCss} value={philhealth} onChange={handlePhilhealthChange} placeholder="Enter Philhealth number" />
          </Labeled>
        </div>
        <div style={{ height:10 }} />
        <div style={row}>
          <Labeled labelText="Date Registered"><input style={inputCss} value={dateRegistered} readOnly /></Labeled>
          <Labeled labelText="Center"><input style={inputCss} value={center} readOnly /></Labeled>
        </div>
        <div style={{ height:10 }} />
        <div style={row}>
          <Labeled labelText="First Name"><input style={inputCss} value={firstName} onChange={handleFirstNameChange} /></Labeled>
          <Labeled labelText="Middle Name"><input style={inputCss} value={middleName} onChange={handleMiddleNameChange} /></Labeled>
          <Labeled labelText="Last Name"><input style={inputCss} value={lastName} onChange={handleLastNameChange} /></Labeled>
          <Labeled labelText="Birthdate"><input type="date" style={inputCss} value={birthdate} onChange={e=>setBirthdate(e.target.value)} /></Labeled>
          <Labeled labelText="Sex"><input style={inputCss} value={sex} onChange={handleSexChange} /></Labeled>
          <Labeled labelText="Age"><input style={inputCss} value={age} onChange={handleAgeChange} /></Labeled>
          <Labeled labelText="Weight (kg)"><input style={inputCss} value={weight} onChange={handleWeightChange} /></Labeled>
          <Labeled labelText="Birthplace"><input style={inputCss} value={birthPlace} onChange={handleBirthPlaceChange} /></Labeled>
          <Labeled labelText="Civil Status">
            <select style={inputCss} value={civilStatus} onChange={handleCivilStatusChange}>
              <option value="">Select Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
              <option value="Separated">Separated</option>
            </select>
          </Labeled>
          <Labeled labelText="Nationality"><input style={inputCss} value={nationality} onChange={handleNationalityChange} /></Labeled>
          <Labeled labelText="Religion"><input style={inputCss} value={religion} onChange={handleReligionChange} /></Labeled>
          <Labeled labelText="Contact No."><input style={inputCss} value={phone} onChange={handlePhoneChange} /></Labeled>
        </div>
      </div>

      {/* Address */}
      <div style={card}>
        <h3 style={h3Style}>Address</h3>
        <div style={row}>
          <Labeled labelText="House No."><input style={inputCss} value={houseNo} onChange={handleHouseNoChange} /></Labeled>
          <Labeled labelText="Street"><input style={inputCss} value={street} onChange={handleStreetChange} /></Labeled>
          <Labeled labelText="Barangay"><input style={inputCss} value={barangay} onChange={handleBarangayChange} /></Labeled>
          <Labeled labelText="Subdivision"><input style={inputCss} value={subdivision} onChange={handleSubdivisionChange} /></Labeled>
          <Labeled labelText="City"><input style={inputCss} value={city} onChange={handleCityChange} /></Labeled>
          <Labeled labelText="Province"><input style={inputCss} value={province} onChange={handleProvinceChange} /></Labeled>
          <Labeled labelText="Zip Code"><input style={inputCss} value={zipCode} onChange={handleZipCodeChange} /></Labeled>
        </div>
      </div>

      {/* History of Bite */}
      <div style={card}>
        <h3 style={h3Style}>History of Bite</h3>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={typeNonBite} onChange={handleTypeNonBiteChange} /> NON-BITE</label>
        <label><input type="checkbox" checked={typeBite} onChange={handleTypeBiteChange} /> BITE</label>
        </div>
        <div style={row}>
          <Labeled labelText="Date of Inquiry"><input type="date" style={inputCss} value={dateOfInquiry} onChange={e=>setDateOfInquiry(e.target.value)} /></Labeled>
          <Labeled labelText="Time of Injury"><input type="time" style={inputCss} value={timeOfInjury} onChange={e=>setTimeOfInjury(e.target.value)} /></Labeled>
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:8 }}>
        {['head','face','neck','chest','back','abdomen','upper','lower'].map(k => (
          <label key={k}><input type="checkbox" checked={site[k]} onChange={e=>setSite(s=>({ ...s, [k]: e.target.checked }))} /> {k === 'upper' ? 'Upper Extremities' : k === 'lower' ? 'Lower Extremities' : k.charAt(0).toUpperCase()+k.slice(1)}</label>
        ))}
        <label><input type="checkbox" checked={site.others} onChange={e=>setSite(s=>({ ...s, others: e.target.checked }))} /> Others</label>
          <input style={{ ...inputCss, maxWidth:320 }} placeholder="Others (specify)" value={site.othersText} onChange={e=>setSite(s=>({ ...s, othersText: e.target.value }))} />
        </div>
      </div>

      {/* Nature of Injury */}
      <div style={card}>
        <h3 style={h3Style}>Nature of Injury/ies:</h3>
        
        {/* Multiple Injuries Question */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Multiple Injuries?</p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={injury.multiple} onChange={e=>setInjury(s=>({ ...s, multiple: e.target.checked }))} />
              Yes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!injury.multiple} onChange={e=>setInjury(s=>({ ...s, multiple: !e.target.checked }))} />
              No
            </label>
          </div>
          <p style={{ fontStyle: 'italic', color: '#666', fontSize: '14px', margin: '0 0 16px 0' }}>
            Check if Applicable, indicate in the black space opposite each type of injury the body location affected and other details.
          </p>
        </div>

        {/* Injury Type Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.abrasion} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, abrasion: e.target.checked }))} 
            />
            Abrasion
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.avulsion} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, avulsion: e.target.checked }))} 
            />
            Avulsion
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.burn} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, burn: e.target.checked }))} 
            />
            Burn (Degree of Burn and Extent of Body Surface involve Degree)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.concussion} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, concussion: e.target.checked }))} 
            />
            Concussion
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.contusion} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, contusion: e.target.checked }))} 
            />
            Contusion
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.openWound} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, openWound: e.target.checked }))} 
            />
            Open wound/laceration
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.trauma} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, trauma: e.target.checked }))} 
            />
            Trauma
          </label>
        </div>

        {/* Others field with text area */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input 
              type="checkbox" 
              checked={injury.others} 
              disabled={!injury.multiple}
              onChange={e=>setInjury(s=>({ ...s, others: e.target.checked }))} 
            />
            Others:
          </label>
          <textarea 
            style={{ 
              width: '100%', 
              height: '80px', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              resize: 'vertical',
              opacity: injury.others ? 1 : 0.5
            }} 
            placeholder="Specify other injury details..."
            value={injury.othersText} 
            onChange={e=>setInjury(s=>({ ...s, othersText: e.target.value }))}
            disabled={!injury.others || !injury.multiple}
          />
        </div>

        {/* Burn details (if burn is selected) */}
        {injury.burn ? (
          <div style={row}>
            <Labeled labelText="Burn Degree (1-4)"><input style={inputCss} value={injury.burnDegree} onChange={e=>setInjury(s=>({ ...s, burnDegree: Number(e.target.value||1) }))} /></Labeled>
            <Labeled labelText="Burn Site"><input style={inputCss} value={injury.burnSite} onChange={e=>setInjury(s=>({ ...s, burnSite: e.target.value }))} /></Labeled>
          </div>
        ) : null}
      </div>

      {/* External Cause / Place / Disposition */}
      <div style={card}>
        <h3 style={h3Style}>External Cause/s of Injury/ies:</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={biteSting} onChange={e=>setBiteSting(e.target.checked)} />
            Bite/ Sting, Specify animal/insect
          </label>
          {biteSting ? <input style={{ ...inputCss, maxWidth:400, marginLeft:24 }} placeholder="Specify animal/insect" value={biteStingDetails} onChange={e=>setBiteStingDetails(e.target.value)} /> : null}
          
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={chemicalSubstance} onChange={e=>setChemicalSubstance(e.target.checked)} />
            Chemical Substance, specify (applied to bite site)
          </label>
          {chemicalSubstance ? <input style={{ ...inputCss, maxWidth:400, marginLeft:24 }} placeholder="Specify chemical substance" value={chemicalDetails} onChange={e=>setChemicalDetails(e.target.value)} /> : null}
        </div>

        <h3 style={{ ...h3Style, marginTop:14 }}>Place of Occurrence:</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={place.home} onChange={e=>setPlace(s=>({ ...s, home: e.target.checked }))} />
              Home
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={place.road} onChange={e=>setPlace(s=>({ ...s, road: e.target.checked }))} />
              Road
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={place.others} onChange={e=>setPlace(s=>({ ...s, others: e.target.checked }))} />
              Others:
            </label>
            {place.others ? <input style={{ ...inputCss, marginLeft:24 }} placeholder="Others (specify)" value={place.othersText} onChange={e=>setPlace(s=>({ ...s, othersText: e.target.value }))} /> : null}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={place.school} onChange={e=>setPlace(s=>({ ...s, school: e.target.checked }))} />
              School
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={place.neighbor} onChange={e=>setPlace(s=>({ ...s, neighbor: e.target.checked }))} />
              Neighbor
            </label>
          </div>
        </div>

        <h3 style={{ ...h3Style, marginTop:14 }}>Disposition:</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={treated} onChange={handleTreatedChange} />
            Treated & Sent Home
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={transferred} onChange={handleTransferredChange} />
            Transferred to another facility/hospital, specify:
          </label>
          {transferred ? (
            <div style={{ marginLeft:24 }}>
              <label style={{ display:'block', marginBottom:4, fontWeight:'bold' }}>Specify facility/hospital:</label>
              <select style={inputCss} value={transferredTo} onChange={e=>{
                setTransferredTo(e.target.value);
              }}>
                <option value="">Select facility/hospital</option>
                {centers.length > 0 ? (
                  centers.map(center => (
                    <option key={center._id} value={center.name}>{center.name}</option>
                  ))
                ) : (
                  <option value="" disabled>Loading centers...</option>
                )}
              </select>
              {centers.length === 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  No centers available. Check console for errors.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <h3 style={{ ...h3Style, marginTop:14 }}>Circumstance of Bite:</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={provoked} onChange={handleProvokedChange} />
            Provoked
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={unprovoked} onChange={handleUnprovokedChange} />
            Unprovoked
          </label>
        </div>
      </div>

      {/* Animal Profile */}
      <div style={card}>
        <h3 style={h3Style}>Animal Profile:</h3>
        
        {/* Animal Type */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Animal Type:</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.dog} onChange={e=>setAnimal(s=>({ ...s, dog: e.target.checked }))} />
              Dog
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.cat} onChange={e=>setAnimal(s=>({ ...s, cat: e.target.checked }))} />
              Cat
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.other} onChange={e=>setAnimal(s=>({ ...s, other: e.target.checked }))} />
              Others:
            </label>
            {animal.other ? <input style={{ ...inputCss, marginLeft:24, maxWidth:400 }} placeholder="Others (specify)" value={animal.otherText} onChange={e=>setAnimal(s=>({ ...s, otherText: e.target.value }))} /> : null}
          </div>
        </div>

        {/* Animal Condition */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Animal Condition:</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.healthy} onChange={e=>setAnimal(s=>({ ...s, healthy: e.target.checked }))} />
              Healthy
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.sick} onChange={e=>setAnimal(s=>({ ...s, sick: e.target.checked }))} />
              Sick
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.died} onChange={e=>setAnimal(s=>({ ...s, died: e.target.checked }))} />
              Died
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.killed} onChange={e=>setAnimal(s=>({ ...s, killed: e.target.checked }))} />
              Killed
            </label>
          </div>
        </div>

        {/* Brain Exam */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Brain Exam:</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.brainExam} onChange={e=>setAnimal(s=>({ ...s, brainExam: e.target.checked }))} />
              Brain Exam Done
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.noBrainExam} onChange={e=>setAnimal(s=>({ ...s, noBrainExam: e.target.checked }))} />
              No Brain Exam
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.unknown} onChange={e=>setAnimal(s=>({ ...s, unknown: e.target.checked }))} />
              Unknown
            </label>
          </div>
        </div>

        {/* Immunization Status */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Immunization Status:</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.immunized} onChange={e=>setAnimal(s=>({ ...s, immunized: e.target.checked, notImmunized: e.target.checked?false:s.notImmunized }))} />
              Immunized
            </label>
            {animal.immunized ? <input style={{ ...inputCss, marginLeft:24, maxWidth:160 }} placeholder="Year" value={animal.immunizedYear} onChange={e=>setAnimal(s=>({ ...s, immunizedYear: e.target.value }))} /> : null}
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.notImmunized} onChange={e=>setAnimal(s=>({ ...s, notImmunized: e.target.checked, immunized: e.target.checked?false:s.immunized }))} />
              None
            </label>
          </div>
        </div>

        {/* Animal Ownership */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Animal Ownership:</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.pet} onChange={e=>setAnimal(s=>({ ...s, pet: e.target.checked }))} />
              Pet
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.neighbor} onChange={e=>setAnimal(s=>({ ...s, neighbor: e.target.checked }))} />
              Neighbor
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={animal.stray} onChange={e=>setAnimal(s=>({ ...s, stray: e.target.checked }))} />
              Stray
            </label>
          </div>
        </div>
      </div>

      {/* Washing of Wound */}
      <div style={card}>
        <h3 style={h3Style}>Washing of Wound:</h3>
        <div style={{ display:'flex', gap:16, marginBottom:16 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={woundWashing} onChange={handleWoundWashingChange} />
            Yes
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={noWoundWashing} onChange={handleNoWoundWashingChange} />
            No
          </label>
        </div>
      </div>

      {/* Diagnosis */}
      <div style={card}>
        <h3 style={h3Style}>Diagnosis:</h3>
        <textarea 
          style={{ 
            width: '100%', 
            height: '80px', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            resize: 'vertical'
          }} 
          placeholder="Enter diagnosis..."
          value={diagnosis} 
          onChange={e=>setDiagnosis(e.target.value)} 
        />
      </div>

      {/* Category of Bite */}
      <div style={card}>
        <h3 style={h3Style}>Category of Bite:</h3>
        <div style={{ display:'flex', gap:16, marginBottom:16 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={category1} onChange={handleCategory1Change} />
            Category 1
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={category2} onChange={handleCategory2Change} />
            Category 2
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={category3} onChange={handleCategory3Change} />
            Category 3
          </label>
        </div>
      </div>

      {/* Any History of Allergy */}
      <div style={card}>
        <h3 style={h3Style}>Any History of Allergy:</h3>
        <textarea 
          style={{ 
            width: '100%', 
            height: '80px', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            resize: 'vertical'
          }} 
          placeholder="Enter allergy history..."
          value={allergyHistory} 
          onChange={e=>setAllergyHistory(e.target.value)} 
        />
      </div>

      {/* Maintenance Medications */}
      <div style={card}>
        <h3 style={h3Style}>Maintenance Medications:</h3>
        <textarea 
          style={{ 
            width: '100%', 
            height: '80px', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            resize: 'vertical'
          }} 
          placeholder="Enter maintenance medications..."
          value={maintenanceMedications} 
          onChange={e=>setMaintenanceMedications(e.target.value)} 
        />
      </div>

      {/* Management */}
      <div style={card}>
        <h3 style={h3Style}>MANAGEMENT:</h3>
        <textarea 
          style={{ 
            width: '100%', 
            height: '80px', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            resize: 'vertical'
          }} 
          placeholder="Enter management plan..."
          value={management} 
          onChange={e=>setManagement(e.target.value)} 
        />
      </div>

      {/* Patient Immunization */}
      <div style={card}>
        <h3 style={h3Style}>Patient Immunization</h3>
        
        {/* DPT Immunization */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ ...h3Style, fontSize: '16px', marginBottom: 12 }}>a. DPT Immunization</h4>
          
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={dpt.complete} onChange={e=>setDpt(s=>({ ...s, complete:e.target.checked, incomplete:e.target.checked?false:s.incomplete, none:e.target.checked?false:s.none }))} />
              <span>Complete</span>
              {dpt.complete && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:16 }}>
                  <span style={{ fontSize: '14px' }}>Year Given (last dose):</span>
                  <input type="date" style={{ ...inputCss, maxWidth:120 }} value={dpt.year} onChange={e=>setDpt(s=>({ ...s, year:e.target.value }))} />
                </div>
              )}
            </div>
            
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={dpt.incomplete} onChange={e=>setDpt(s=>({ ...s, incomplete:e.target.checked, complete:e.target.checked?false:s.complete, none:e.target.checked?false:s.none }))} />
              <span>Incomplete</span>
              {dpt.incomplete && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:16 }}>
                  <span style={{ fontSize: '14px' }}>No. of Dose given:</span>
                  <input style={{ ...inputCss, maxWidth:100 }} placeholder="Number" value={dpt.doses} onChange={e=>setDpt(s=>({ ...s, doses:e.target.value }))} />
                </div>
              )}
            </div>
            
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={dpt.none} onChange={e=>setDpt(s=>({ ...s, none:e.target.checked, complete:false, incomplete:false }))} />
              <span>None</span>
            </div>
          </div>
        </div>

        {/* Previous Section */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ ...h3Style, fontSize: '16px', marginBottom: 12 }}>Previous</h4>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <Labeled labelText="No. of doses given:">
              <input style={inputCss} value={dpt.previousDoses} onChange={e=>setDpt(s=>({ ...s, previousDoses:e.target.value }))} />
            </Labeled>
            <Labeled labelText="Year last dose given:">
              <input type="date" style={inputCss} value={dpt.previousYear} onChange={e=>setDpt(s=>({ ...s, previousYear:e.target.value }))} />
            </Labeled>
          </div>
        </div>

        {/* TT Immunization */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ ...h3Style, fontSize: '16px', marginBottom: 12 }}>b. TT Immunization</h4>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={tt.active} onChange={e=>setTt(s=>({ ...s, active:e.target.checked }))} />
              TT Active
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={tt.passive} onChange={e=>setTt(s=>({ ...s, passive:e.target.checked }))} />
              TT Passive
            </label>
          </div>
          <div style={row}>
            <Labeled labelText="TT1 Date"><input type="date" style={inputCss} value={tt.tt1} onChange={e=>setTt(s=>({ ...s, tt1:e.target.value }))} /></Labeled>
            <Labeled labelText="TT2 Date"><input type="date" style={inputCss} value={tt.tt2} onChange={e=>setTt(s=>({ ...s, tt2:e.target.value }))} /></Labeled>
            <Labeled labelText="TT3 Date"><input type="date" style={inputCss} value={tt.tt3} onChange={e=>setTt(s=>({ ...s, tt3:e.target.value }))} /></Labeled>
          </div>
        </div>
      </div>


      {/* Current Anti-Rabies Immunization */}
      <div style={card}>
        <h3 style={h3Style}>Current Anti‑Rabies Immunization</h3>
        
        {/* Active Immunization */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
            <input type="checkbox" checked={current.active} onChange={e=>setCurrent(s=>({ ...s, active:e.target.checked }))} />
            <span style={{ fontWeight: 'bold' }}>Active</span>
          </label>
          
          {current.active && (
            <div style={{ marginLeft: 24 }}>
              {/* Exposure/Immunization Type */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={current.post} onChange={e=>setCurrent(s=>({ ...s, post:e.target.checked, pre:e.target.checked?false:s.pre, prevImm:e.target.checked?false:s.prevImm }))} />
                    Post Exposure
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={current.pre} onChange={e=>setCurrent(s=>({ ...s, pre:e.target.checked, post:e.target.checked?false:s.post, prevImm:e.target.checked?false:s.prevImm }))} />
                    Pre-Exposure Prophylaxis
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={current.prevImm} onChange={e=>setCurrent(s=>({ ...s, prevImm:e.target.checked, post:false, pre:false }))} />
                    (Previously Immunized/PEP)
                  </label>
                </div>
              </div>


              {/* Schedule Dates */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ ...h3Style, fontSize: '16px', marginBottom: 8 }}>SCHEDULE DATES OF IMMUNIZATION</h4>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>DATE</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ minWidth: '30px', fontWeight: 'bold' }}>D0:</span>
                    <input 
                      type="date" 
                      style={inputCss} 
                      value={schedule.d0} 
                      min={toISO(new Date())} // Cannot select past dates
                      onChange={e => {
                        const d0Date = e.target.value;
                        if (d0Date) {
                          const baseDate = new Date(d0Date);
                          setSchedule({
                            d0: d0Date,
                            d3: toISO(new Date(baseDate.getTime() + 3 * 86400000)),
                            d7: toISO(new Date(baseDate.getTime() + 7 * 86400000)),
                            d14: toISO(new Date(baseDate.getTime() + 14 * 86400000)),
                            d28: toISO(new Date(baseDate.getTime() + 28 * 86400000))
                          });
                        } else {
                          setSchedule(s => ({ ...s, d0: '' }));
                        }
                      }}
                    />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ minWidth: '30px', fontWeight: 'bold' }}>D3:</span>
                    <input 
                      type="date" 
                      style={inputCss} 
                      value={schedule.d3} 
                      min={schedule.d0 || toISO(new Date())} // Cannot be before D0
                      onChange={e=>setSchedule(s=>({ ...s, d3:e.target.value }))} 
                    />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ minWidth: '30px', fontWeight: 'bold' }}>D7:</span>
                    <input 
                      type="date" 
                      style={inputCss} 
                      value={schedule.d7} 
                      min={schedule.d3 || schedule.d0 || toISO(new Date())} // Cannot be before D3
                      onChange={e=>setSchedule(s=>({ ...s, d7:e.target.value }))} 
                    />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ minWidth: '30px', fontWeight: 'bold' }}>D14:</span>
                    <input 
                      type="date" 
                      style={inputCss} 
                      value={schedule.d14} 
                      min={schedule.d7 || schedule.d3 || schedule.d0 || toISO(new Date())} // Cannot be before D7
                      onChange={e=>setSchedule(s=>({ ...s, d14:e.target.value }))} 
                    />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ minWidth: '30px', fontWeight: 'bold' }}>D28:</span>
                    <input 
                      type="date" 
                      style={inputCss} 
                      value={schedule.d28} 
                      min={schedule.d14 || schedule.d7 || schedule.d3 || schedule.d0 || toISO(new Date())} // Cannot be before D14
                      onChange={e=>setSchedule(s=>({ ...s, d28:e.target.value }))} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Passive Immunization */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
            <input type="checkbox" checked={current.passive} onChange={e=>setCurrent(s=>({ ...s, passive:e.target.checked }))} />
            <span style={{ fontWeight: 'bold' }}>Passive</span>
          </label>
          
          {current.passive && (
            <div style={{ marginLeft: 24 }}>
              {/* SKIN TEST */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 8 }}>
                  <input type="checkbox" checked={current.skinTest} onChange={e=>setCurrent(s=>({ ...s, skinTest:e.target.checked }))} />
                  <span style={{ fontWeight: 'bold' }}>SKIN TEST</span>
                </label>
                
                {current.skinTest && (
                  <div style={{ marginLeft: 24, display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                      <Labeled labelText="Time Tested:">
                        <input type="time" style={inputCss} value={current.skinTime} onChange={e=>setCurrent(s=>({ ...s, skinTime:e.target.value }))} />
                      </Labeled>
                      <Labeled labelText="Time Read:">
                        <input type="time" style={inputCss} value={current.skinRead} onChange={e=>setCurrent(s=>({ ...s, skinRead:e.target.value }))} />
                      </Labeled>
                    </div>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                      <Labeled labelText="Result:">
                        <input style={inputCss} value={current.skinResult} onChange={e=>setCurrent(s=>({ ...s, skinResult:e.target.value }))} />
                      </Labeled>
                      <Labeled labelText="Dose:">
                        <input style={inputCss} value={current.skinDose || 'U'} onChange={e=>setCurrent(s=>({ ...s, skinDose:e.target.value }))} />
                      </Labeled>
                    </div>
                    <Labeled labelText="Date Given:">
                      <input type="date" style={inputCss} value={current.skinDate} onChange={e=>setCurrent(s=>({ ...s, skinDate:e.target.value }))} />
                    </Labeled>
                  </div>
                )}
              </div>

              {/* HRIG */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 8 }}>
                  <input type="checkbox" checked={current.hrig} onChange={e=>setCurrent(s=>({ ...s, hrig:e.target.checked }))} />
                  <span style={{ fontWeight: 'bold' }}>HRIG</span>
                </label>
                
                {current.hrig && (
                  <div style={{ marginLeft: 24, display:'flex', gap:16, flexWrap:'wrap' }}>
                    <Labeled labelText="Dose:">
                      <input style={inputCss} value={current.hrigDose || 'U'} onChange={e=>setCurrent(s=>({ ...s, hrigDose:e.target.value }))} />
                    </Labeled>
                    <Labeled labelText="Date Given:">
                      <input type="date" style={inputCss} value={current.hrigDate} onChange={e=>setCurrent(s=>({ ...s, hrigDate:e.target.value }))} />
                    </Labeled>
                  </div>
                )}
              </div>

              {/* Local Infiltration */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 8 }}>
                  <input type="checkbox" checked={current.localInfiltration} onChange={e=>setCurrent(s=>({ ...s, localInfiltration:e.target.checked }))} />
                  <span>Local Infiltration done</span>
                </label>
              </div>

              {/* Structured/Unstructured */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={current.structured} onChange={e=>setCurrent(s=>({ ...s, structured:e.target.checked }))} />
                    <span>Structured</span>
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={current.unstructured} onChange={e=>setCurrent(s=>({ ...s, unstructured:e.target.checked }))} />
                    <span>Unstructured</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vaccine Selection */}
      <div style={card}>
        <h3 style={h3Style}>Vaccine Selection</h3>
        <p style={{ margin: '0 0 16px 0', color: palette.textLight, fontSize: '14px' }}>
          Select the vaccines to be used for this patient. Stock will be automatically deducted.
        </p>
        
        {stockLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              border: '2px solid #f3f3f3', 
              borderTop: '2px solid #7D0C0C', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
            <p style={{ margin: '8px 0 0 0', color: palette.textLight }}>Loading vaccine stocks...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ARV Vaccines */}
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ ...h3Style, fontSize: '16px', marginBottom: 12 }}>Anti-Rabies Vaccines (ARV)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={current.pvrv} 
                    disabled={!isVaccineAvailable('SPEEDA', center)}
                    onChange={e => {
                      setCurrent(s => ({ ...s, pvrv: e.target.checked }));
                      if (e.target.checked) {
                        deductVaccineStock('SPEEDA', center, 1);
                      }
                    }}
                  />
                  <span>SPEEDA (PVRV)</span>
                  {!isVaccineAvailable('SPEEDA', center) && (
                    <span style={{ color: palette.error, fontSize: '12px' }}>❌ Out of stock</span>
                  )}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={current.pcec} 
                    disabled={!isVaccineAvailable('VAXIRAB', center)}
                    onChange={e => {
                      setCurrent(s => ({ ...s, pcec: e.target.checked }));
                      if (e.target.checked) {
                        deductVaccineStock('VAXIRAB', center, 1);
                      }
                    }}
                  />
                  <span>VAXIRAB (PCEC)</span>
                  {!isVaccineAvailable('VAXIRAB', center) && (
                    <span style={{ color: palette.error, fontSize: '12px' }}>❌ Out of stock</span>
                  )}
                </label>
              </div>
            </div>

            {/* Route Selection */}
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ ...h3Style, fontSize: '16px', marginBottom: 12 }}>Route of Administration</h4>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={current.id} 
                    onChange={e => setCurrent(s => ({ ...s, id: e.target.checked, im: e.target.checked ? false : s.im }))}
                  />
                  <span>Intradermal (ID)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={current.im} 
                    onChange={e => setCurrent(s => ({ ...s, im: e.target.checked, id: e.target.checked ? false : s.id }))}
                  />
                  <span>Intramuscular (IM)</span>
                </label>
              </div>
            </div>

            {/* Stock Information */}
            {center && (
              <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                <h4 style={{ color: '#0369a1', fontSize: '16px', marginBottom: 12 }}>Available Stock for {center}</h4>
                {getAvailableVaccines(center).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {getAvailableVaccines(center).map((vaccine, index) => {
                      const totalStock = vaccine.stockEntries?.reduce((sum, entry) => 
                        sum + (Number(entry.stock) || 0), 0
                      ) || 0;
                      return (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '500' }}>{vaccine.name}</span>
                          <span style={{ 
                            color: totalStock > 10 ? palette.success : totalStock > 0 ? palette.warning : palette.error,
                            fontWeight: '600'
                          }}>
                            {Math.round(totalStock * 100) / 100} vials
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: palette.error, margin: 0 }}>No vaccines available for this center</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save/Cancel */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        justifyContent: 'flex-end', 
        marginTop: 32,
        padding: '24px',
        background: palette.paper,
        borderRadius: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${palette.line}`
      }}>
        <button 
          onClick={onCancel} 
          style={{
            ...buttonStyle.secondary,
            padding: '12px 24px',
            background: '#F3F4F6',
            color: palette.text,
            border: '2px solid #E5E7EB',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Cancel
        </button>
        <button 
          disabled={saving} 
          onClick={onSave} 
          style={{
            ...buttonStyle.primary,
            padding: '12px 24px',
            background: saving ? '#9CA3AF' : `linear-gradient(135deg, ${palette.brand} 0%, ${palette.brandLight} 100%)`,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease-in-out',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ 
                width: 16, 
                height: 16, 
                border: '2px solid #ffffff40', 
                borderTop: '2px solid #ffffff', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}></span>
              Saving...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💾</span>
              Save Case
            </span>
          )}
        </button>
      </div>
      </div>
    </>
  );
}
  