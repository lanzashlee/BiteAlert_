import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import './NewBiteCaseForm.css';
import { apiFetch } from '../../config/api';
// notifications removed per request


// Reusable input component (defined outside to avoid re-creation and focus loss)
function FormInput({ name, label, type = 'text', placeholder = '', value = '', error, onChange, disabled = false, onFieldActivity }) {
  return (
    <div className="w-full">
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        id={name}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
        aria-invalid={!!error}
        disabled={disabled}
        onFocus={() => onFieldActivity?.(name)}
        onSelect={() => onFieldActivity?.(name)}
        onClick={() => onFieldActivity?.(name)}
      />
      {error && (
        <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

const BiteCaseFormContext = React.createContext(null);

function Input(props) {
  const { form, errors, handleChange, rememberFieldActivity } = useContext(BiteCaseFormContext);
  return (
    <FormInput
      {...props}
      value={form[props.name] ?? ''}
      error={errors[props.name]}
      disabled={props.disabled}
      onFieldActivity={rememberFieldActivity}
      onChange={(e) => {
        const next = e.target.value;
        rememberFieldActivity(props.name);
        if (typeof props.onChange === 'function') props.onChange(e);
        handleChange(props.name, next);
      }}
    />
  );
}

function TextArea({ name, label, rows = 3, disabled = false }) {
  const { form, errors, handleChange, rememberFieldActivity } = useContext(BiteCaseFormContext);
  return (
    <div className="w-full">
      <label className="form-label">{label}</label>
      <textarea
        id={name}
        rows={rows}
        value={form[name] ?? ''}
        disabled={disabled}
        onFocus={() => rememberFieldActivity(name)}
        onSelect={() => rememberFieldActivity(name)}
        onClick={() => rememberFieldActivity(name)}
        onChange={(e) => {
          rememberFieldActivity(name);
          handleChange(name, e.target.value);
        }}
        className="form-textarea"
        aria-invalid={!!errors[name]}
      />
      {errors[name] && <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: 4 }}>{errors[name]}</div>}
    </div>
  );
}

function Check({ name, label, onChange }) {
  const { form, handleChange } = useContext(BiteCaseFormContext);
  return (
    <label className="checkbox-item">
      <input
        type="checkbox"
        checked={!!form[name]}
        onChange={onChange ? onChange : ((e) => handleChange(name, e.target.checked))}
      />
      {label}
    </label>
  );
}

const NewBiteCaseForm = ({ onClose, onCancel, selectedPatient, onSaved }) => {
  // Initialize form with default values to ensure all fields are immediately functional
  const [form, setForm] = useState({
    registrationNumber: '',
    philhealthNo: '',
    dateRegistered: '',
    centerName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    weight: '',
    civilStatus: '',
    sex: '',
    birthdate: '',
    birthplace: '',
    age: '',
    nationality: '',
    religion: '',
    occupation: '',
    contactNo: '',
    houseNo: '',
    street: '',
    barangay: '',
    municipality: '',
    city: '',
    province: '',
    zipCode: '',
    // Initialize all other fields with empty strings
    dateOfInquiry: '',
    timeOfInjury: '',
    placeOfOccurrence: '',
    placeOthers: '',
    externalCauseBiteSting: false,
    externalCauseChemical: false,
    treatedHome: false,
    transferred: false,
    transferredTo: '',
    provoked: false,
    unprovoked: false,
    species: '',
    spOthers: '',
    spOthersSpecify: '',
    healthy: false,
    sick: false,
    dead: false,
    unknown: false,
    animalImmunized: false,
    animalImmunizedYear: '',
    pet: false,
    stray: false,
    wild: false,
    unknownOwnership: false,
    washingWound: false,
    category1: false,
    category2: false,
    category3: false,
    diagnosis: '',
    allergy: '',
    maintenance: '',
    management: '',
    vacVaxirab: false,
    routeIM: false,
    localInfiltration: false,
    immActive: false,
    immToxoid: false,
    immTT1: '',
    immTT2: '',
    immTT3: '',
    immPassive: false,
    immSkinTest: false,
    immSkinTimeTested: '',
    immSkinTimeRead: '',
    immSkinResult: '',
    immSkinDose: '',
    immSkinDateGiven: '',
    immTig: false,
    immTigDose: '',
    immTigDateGiven: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasActiveSchedules, setHasActiveSchedules] = useState(false);
  const [checkingSchedules, setCheckingSchedules] = useState(false);
  const [step, setStep] = useState(0);
  const [centers, setCenters] = useState([]);
  const [toast, setToast] = useState(null);
  const [prefillDone, setPrefillDone] = useState(false);
  const activeFieldRef = useRef(null);
  const totalSteps = 5; // 0..4
  const isLastStep = () => step === totalSteps - 1;
  const nextStep = () => setStep(s => Math.min(totalSteps - 1, s + 1));
  const prevStep = () => setStep(s => Math.max(0, s - 1));
  const stepLabels = ['Registration','Personal','Address','History','Review'];
  const stepDescriptions = [
    'Case identifiers and center details',
    'Patient identity and demographics',
    'Address and contact details',
    'Exposure, injury, and disposition',
    'Animal profile, immunization, and management'
  ];
  const progressPercent = ((step + 1) / totalSteps) * 100;
  const rememberFieldActivity = (name) => {
    activeFieldRef.current = name;
  };

  // Load draft from localStorage if present
  useEffect(() => {
    try {
      const raw = localStorage.getItem('newBiteCaseDraft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.form) setForm(prev => ({ ...prev, ...parsed.form }));
          if (typeof parsed.step === 'number') setStep(parsed.step);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist draft on changes
  useEffect(() => {
    try {
      const payload = { form, step, updatedAt: Date.now() };
      localStorage.setItem('newBiteCaseDraft', JSON.stringify(payload));
    } catch (e) {}
  }, [form, step]);

  // Ensure form is properly initialized on mount
  useEffect(() => {
    // Force a re-render to ensure all fields are visible and functional
    setForm(prev => ({ ...prev }));
  }, []);

  // Prefill from selected patient — runs every time the patient changes
  useEffect(() => {
    if (!selectedPatient) return;

    // Compute age accurately from birthdate
    let computedAge = selectedPatient.age || '';
    if (selectedPatient.birthdate) {
      try {
        const bd = new Date(selectedPatient.birthdate);
        const today = new Date();
        let a = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
        computedAge = String(Math.max(0, a));
      } catch (_) {}
    }

    setForm(prev => ({
      ...prev,
      // ── Personal ───────────────────────────────────────────
      firstName:    selectedPatient.firstName    || '',
      middleName:   selectedPatient.middleName   || '',
      lastName:     selectedPatient.lastName     || '',
      weight:       selectedPatient.weight       || '',
      civilStatus:  selectedPatient.civilStatus  || '',
      sex:          selectedPatient.sex          || '',
      birthdate:    selectedPatient.birthdate
                      ? new Date(selectedPatient.birthdate).toISOString().slice(0, 10)
                      : '',
      birthplace:   selectedPatient.birthplace   || '',
      age:          computedAge,
      nationality:  selectedPatient.nationality  || '',
      religion:     selectedPatient.religion     || '',
      occupation:   selectedPatient.occupation   || '',
      contactNo:    selectedPatient.phone || selectedPatient.contactNo || selectedPatient.phoneNumber || '',
      philhealthNo: selectedPatient.philhealthNo || selectedPatient.philHealthNo || '',
      // ── Address ────────────────────────────────────────────
      houseNo:      selectedPatient.houseNo      || '',
      street:       selectedPatient.street       || '',
      barangay:     selectedPatient.barangay     || selectedPatient.addressBarangay || '',
      subdivision:  selectedPatient.subdivision  || '',
      city:         selectedPatient.city         || selectedPatient.municipality || '',
      municipality: selectedPatient.municipality || selectedPatient.city || '',
      province:     selectedPatient.province     || '',
      zipCode:      selectedPatient.zipCode      || '',
      // ── Auto-set center from barangay if not already set ───
      centerName:   prev.centerName
                      || (selectedPatient.barangay ? `${selectedPatient.barangay} Center` : ''),
    }));

    setPrefillDone(true);
  }, [selectedPatient]);

  // Check active schedules when selectedPatient changes
  useEffect(() => {
    if (!selectedPatient) {
      setHasActiveSchedules(false);
      return;
    }
    
    const checkActiveSchedules = async () => {
      setCheckingSchedules(true);
      try {
        const patientId = selectedPatient._id || selectedPatient.patientId || selectedPatient.patientID;
        const res = await apiFetch(`/api/vaccinationdates?patientId=${encodeURIComponent(patientId)}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          const hasActive = list.some(vd => 
            vd.d0Status === 'scheduled' ||
            vd.d3Status === 'scheduled' ||
            vd.d7Status === 'scheduled' ||
            vd.d14Status === 'scheduled' ||
            vd.d28Status === 'scheduled'
          );
          setHasActiveSchedules(hasActive);
        }
      } catch (err) {
        console.error('Error checking active schedules:', err);
      } finally {
        setCheckingSchedules(false);
      }
    };
    
    checkActiveSchedules();
  }, [selectedPatient]);

  // Initialize defaults once (registration number, dateRegistered, initial schedule)
  useEffect(() => {
    const genReg = () => {
      const yy = String(new Date().getFullYear()).slice(2);
      const six = Math.floor(100000 + Math.random() * 900000);
      return `${yy}-${six}`;
    };
    setForm(prev => ({
      ...prev,
      registrationNumber: prev.registrationNumber || genReg(),
      dateRegistered: prev.dateRegistered || new Date().toISOString().slice(0,10),
      sched_0: prev.sched_0 || new Date().toISOString().slice(0,10),
      sched_1: prev.sched_1 || new Date(Date.now()+3*86400000).toISOString().slice(0,10),
      sched_2: prev.sched_2 || new Date(Date.now()+7*86400000).toISOString().slice(0,10),
      sched_3: prev.sched_3 || new Date(Date.now()+14*86400000).toISOString().slice(0,10),
      sched_4: prev.sched_4 || new Date(Date.now()+28*86400000).toISOString().slice(0,10),
    }));
  }, []);

  // Fetch centers data
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await apiFetch('/api/centers');
        const data = await response.json();
        if (response.ok) {
          setCenters(data.data || data || []);
        }
      } catch (error) {
        console.warn('Failed to fetch centers:', error);
      }
    };
    fetchCenters();
  }, []);

  const handleChange = (name, value) => {
    // Auto-calc age if birthdate changes
    if (name === 'birthdate') {
      try {
        const d = new Date(value);
        const t = new Date();
        let calculatedAge = t.getFullYear() - d.getFullYear();
        const m = t.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < d.getDate())) calculatedAge--;
        setForm((p)=> ({ ...p, birthdate: value, age: String(Math.max(0, calculatedAge)) }));
      } catch {
        setForm((p)=> ({ ...p, birthdate: value }));
      }
      if (errors['birthdate']) clearError('birthdate');
      if (errors['age']) clearError('age');
      return;
    }
    // Sync centerName when barangay changes
    if (name === 'barangay') {
      const centerName = value ? `${value} Center` : '';
      setForm((p) => ({ ...p, barangay: value, centerName }));
      if (errors['barangay']) clearError('barangay');
      if (errors['centerName']) clearError('centerName');
      return;
    }
    // Sync centerName when transferred center is chosen
    if (name === 'transferredTo') {
      const centerName = value || '';
      setForm((p) => ({ ...p, transferredTo: value, centerName }));
      if (errors['centerName']) clearError('centerName');
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) clearError(name);
  };

  const setError = (name, message) => setErrors(prev => ({ ...prev, [name]: message }));
  const clearError = (name) => setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });

  const focusField = (name) => {
    if (!name || typeof document === 'undefined') return;
    const field = document.getElementById(name);
    if (!field) return;
    try { field.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
    try { field.focus({ preventScroll: true }); } catch {}
  };

  const focusFirstError = (nextErrors, orderedKeys = []) => {
    const firstKey = orderedKeys.find((key) => nextErrors[key]);
    if (firstKey) requestAnimationFrame(() => focusField(firstKey));
    return firstKey;
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Single-select for exposure: "bite" or "nonBite"
  const toggleExposure = (key) => {
    const next = key === 'bite' ? { bite: true, nonBite: false } : { bite: false, nonBite: true };
    if (key === 'nonBite') {
      siteKeys.forEach((_, i) => {
        next[`site_${i}`] = false;
      });
    }
    setForm(prev => ({ ...prev, ...next }));
    clearError('exposure');
    if (key === 'nonBite') clearError('site');
  };

  // Single-select radio button helpers
  const toggleRadio = (group, value) => {
    const updates = {};
    // Reset all options in the group to false
    if (group === 'woundWash') {
      updates.woundWashYes = value === 'yes';
      updates.woundWashNo = value === 'no';
    } else if (group === 'category') {
      updates.cat1 = value === 'cat1';
      updates.cat2 = value === 'cat2';
      updates.cat3 = value === 'cat3';
    } else if (group === 'species') {
      updates.spDog = value === 'dog';
      updates.spCat = value === 'cat';
    } else if (group === 'ownership') {
      updates.owner_0 = value === 'pet';
      updates.owner_1 = value === 'neighbor';
      updates.owner_2 = value === 'stray';
    } else if (group === 'clinicalStatus') {
      ['cs_0', 'cs_1', 'cs_2', 'cs_3'].forEach(key => {
        updates[key] = false;
      });
      updates[`cs_${value}`] = true;
    } else if (group === 'brainExam') {
      ['brain_0', 'brain_1', 'brain_2'].forEach(key => {
        updates[key] = false;
      });
      updates[`brain_${value}`] = true;
    } else if (group === 'multipleInjuries') {
      updates.multiInjuriesYes = value === 'yes';
      updates.multiInjuriesNo = value === 'no';
      // If "No" is selected, clear all injury checkboxes and others text
      if (value === 'no') {
        updates.injOthers = '';
        ['inj_0', 'inj_1', 'inj_2', 'inj_3', 'inj_4', 'inj_5', 'inj_6'].forEach(key => {
          updates[key] = false;
        });
      }
    }
    setForm(prev => ({ ...prev, ...updates }));
    clearError(group);
  };

  // Site of bite helpers
  const siteKeys = useMemo(() => ['Head','Chest','Upper Extremities','Face','Back','Lower Extremities','Neck','Abdomen'], []);
  const toggleSite = (idx) => {
    const key = `site_${idx}`;
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
    clearError('site');
  };

  // Handle injury others checkbox toggle
  const toggleInjuryOthers = (checked) => {
    setForm(prev => ({ 
      ...prev, 
      injOthersCheckbox: checked,
      injOthers: checked ? prev.injOthers : '' // Clear text when unchecked
    }));
  };

  // Handle external causes conditional logic
  const toggleExternalCause = (cause, checked) => {
    const updates = {
      externalCauseBiteSting: cause === 'causeBiteSting' ? checked : false,
      externalCauseChemical: cause === 'causeChemical' ? checked : false,
    };
    if (!checked || cause !== 'causeBiteSting') updates.causeBiteStingDetail = '';
    if (!checked || cause !== 'causeChemical') updates.causeChemicalDetail = '';
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Handle animal immunization conditional logic
  const toggleAnimalImmunization = (type, checked) => {
    const updates = { [type]: checked };
    // Clear year when "None" is checked or when "Immunized" is unchecked
    if (type === 'animalNone' && checked) {
      updates.animalImmunized = false;
      updates.animalImmunizedYear = '';
    } else if (type === 'animalImmunized' && !checked) {
      updates.animalImmunizedYear = '';
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Handle vaccine selection conditional logic
  const toggleVaccine = (vaccine, checked) => {
    const updates = { [vaccine]: checked };
    // Ensure only one vaccine is selected
    if (checked) {
      if (vaccine === 'vacSpeeda') updates.vacVaxirab = false;
      if (vaccine === 'vacVaxirab') updates.vacSpeeda = false;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Handle route selection conditional logic
  const toggleRoute = (route, checked) => {
    const updates = { [route]: checked };
    // Ensure only one route is selected
    if (checked) {
      if (route === 'routeID') updates.routeIM = false;
      if (route === 'routeIM') updates.routeID = false;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Handle active/passive immunization toggles for conditional inputs
  const handleActiveChange = (checked) => {
    setForm(prev => {
      const next = { ...prev, immActive: checked };
      if (!checked) {
        next.immToxoid = false;
        next.immTT1 = '';
        next.immTT2 = '';
        next.immTT3 = '';
      }
      return next;
    });
  };

  const handleToxoidChange = (checked) => {
    setForm(prev => {
      const next = { ...prev, immToxoid: checked };
      if (!checked) {
        next.immTT1 = '';
        next.immTT2 = '';
        next.immTT3 = '';
      }
      return next;
    });
  };

  const handlePassiveChange = (checked) => {
    setForm(prev => {
      const next = { ...prev, immPassive: checked };
      if (!checked) {
        next.immSkinTest = false;
        next.immSkinTimeTested = '';
        next.immSkinTimeRead = '';
        next.immSkinResult = '';
        next.immSkinDose = '';
        next.immSkinDateGiven = '';
        next.immTig = false;
        next.immTigDose = '';
        next.immTigDateGiven = '';
      }
      return next;
    });
  };

  const handleSkinTestChange = (checked) => {
    setForm(prev => {
      const next = { ...prev, immSkinTest: checked };
      if (!checked) {
        next.immSkinTimeTested = '';
        next.immSkinTimeRead = '';
        next.immSkinResult = '';
        next.immSkinDose = '';
        next.immSkinDateGiven = '';
      }
      return next;
    });
  };

  const handleTigChange = (checked) => {
    setForm(prev => {
      const next = { ...prev, immTig: checked };
      if (!checked) {
        next.immTigDose = '';
        next.immTigDateGiven = '';
      }
      return next;
    });
  };

  // Handle HRIG infiltration type conditional logic
  const toggleHRIGInfiltration = (type, checked) => {
    const updates = { [type]: checked };
    // Ensure only one infiltration type is selected
    if (checked) {
      if (type === 'structured') updates.unstructured = false;
      if (type === 'unstructured') updates.structured = false;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Single choice helper for place of occurrence
  const togglePlace = (idx, checked) => {
    const updates = {};
    if (checked) {
      // Clear all other place selections
      for (let i = 0; i < 4; i++) {
        if (i !== idx) updates[`place_${i}`] = false;
      }
      updates[`place_${idx}`] = true;
    } else {
      updates[`place_${idx}`] = false;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Single choice helper for disposition
  const toggleDisposition = (type, checked) => {
    const updates = { [type]: checked };
    if (checked) {
      if (type === 'treatedHome') {
        updates.transferred = false;
        updates.transferredTo = '';
      } else if (type === 'transferred') {
        updates.treatedHome = false;
      }
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Single choice helper for provoked/unprovoked
  const toggleProvoked = (type, checked) => {
    const updates = { [type]: checked };
    if (checked) {
      if (type === 'provoked') updates.unprovoked = false;
      if (type === 'unprovoked') updates.provoked = false;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Single choice helper for DPT immunization
  const toggleDPTSingle = (type, checked) => {
    const updates = { [type]: checked };
    if (checked) {
      // Clear other DPT options and their related fields
      if (type === 'dptComplete') {
        updates.dptIncomplete = false;
        updates.dptNone = false;
        updates.dptDoses = '';
      } else if (type === 'dptIncomplete') {
        updates.dptComplete = false;
        updates.dptNone = false;
        updates.dptYear = '';
      } else if (type === 'dptNone') {
        updates.dptComplete = false;
        updates.dptIncomplete = false;
        updates.dptYear = '';
        updates.dptDoses = '';
      }
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Single choice helper for current anti-rabies options
  const toggleCurrentAntiRabies = (idx, checked) => {
    const updates = {};
    if (checked) {
      // Clear all other current options
      for (let i = 0; i < 3; i++) {
        if (i !== idx) updates[`cur_${i}`] = false;
      }
      updates[`cur_${idx}`] = true;
    } else {
      updates[`cur_${idx}`] = false;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const validate = () => {
    const nextErrors = {};
    // Only validate essential fields - make form less strict
    const req = (key, label) => { if (!String(form[key] || '').trim()) nextErrors[key] = `${label} is required.`; };
    [
      ['registrationNumber','Registration Number'],
      ['firstName','First Name'],
      ['lastName','Last Name'],
      ['barangay','Barangay'],
    ].forEach(([k,l])=>req(k,l));
    
    // Exposure required exactly one
    const exposureCount = (form.bite ? 1 : 0) + (form.nonBite ? 1 : 0);
    if (exposureCount !== 1) nextErrors.exposure = 'Please select type of exposure';

    // Site of bite: required only when BITE is selected
    const hasSite = siteKeys.some((_, i) => !!form[`site_${i}`]);
    if (form.bite && !hasSite) nextErrors.site = 'Please select at least one site of bite';

    // Simple radio button validations
    const oneTrue = (keys) => keys.some(k => !!form[k]);
    if (!oneTrue(['woundWashYes','woundWashNo'])) nextErrors.washingWound = 'Please indicate wound washing';
    if (!oneTrue(['cat1','cat2','cat3'])) nextErrors.category = 'Please select a category';
    if (!oneTrue(['spDog','spCat']) && !String(form.spOthers || '').trim()) nextErrors.species = 'Please select species or specify others';
    if (!oneTrue(['owner_0','owner_1','owner_2'])) nextErrors.ownership = 'Please select ownership';
    if (!oneTrue(['cs_0','cs_1','cs_2','cs_3'])) nextErrors.clinicalStatus = 'Please select clinical status';

    setErrors(nextErrors);
    focusFirstError(nextErrors, ['registrationNumber', 'firstName', 'lastName', 'barangay', 'exposure', 'site', 'washingWound', 'category', 'species', 'ownership', 'clinicalStatus']);
    return Object.keys(nextErrors).length === 0;
  };

  // Validate only fields relevant to the current step (partial validation)
  const validateStep = (s) => {
    const nextErrors = {};
    const req = (key, label) => { if (!String(form[key] || '').trim()) nextErrors[key] = `${label} is required.`; };
    if (s === 0) {
      [['registrationNumber','Registration Number'], ['dateRegistered','Date Registered'], ['centerName','Center Name']].forEach(([k,l])=>req(k,l));
    } else if (s === 1) {
      [['firstName','First Name'], ['lastName','Last Name'], ['birthdate','Birthdate'], ['age','Age']].forEach(([k,l])=>req(k,l));
    } else if (s === 2) {
      [['barangay','Barangay']].forEach(([k,l])=>req(k,l));
    } else if (s === 3) {
      // History of bite: exposure, site, date/time
      const exposureCount = (form.bite ? 1 : 0) + (form.nonBite ? 1 : 0);
      if (exposureCount !== 1) nextErrors.exposure = 'Please select type of exposure';
      const hasSite = siteKeys.some((_, i) => !!form[`site_${i}`]);
      if (form.bite && !hasSite) nextErrors.site = 'Please select at least one site of bite';
      [['dateOfInquiry','Date of Injury'], ['timeOfInjury','Time of Injury']].forEach(([k,l])=> { if (!String(form[k] || '').trim()) nextErrors[k] = `${l} is required.`; });
    }
    setErrors(nextErrors);
    focusFirstError(
      nextErrors,
      s === 0
        ? ['registrationNumber', 'dateRegistered', 'centerName']
        : s === 1
          ? ['firstName', 'middleName', 'lastName', 'weight', 'birthdate', 'birthplace', 'age', 'nationality', 'religion', 'occupation', 'contactNo']
          : s === 2
            ? ['barangay', 'houseNo', 'street', 'subdivision', 'city', 'province', 'zipCode']
            : ['exposure', 'site', 'dateOfInquiry', 'timeOfInjury']
    );
    return Object.keys(nextErrors).length === 0;
  };

  // Non-destructive check whether a step is complete (no side-effects)
  const isStepComplete = (s) => {
    const req = (key) => !!String(form[key] || '').trim();
    if (s === 0) {
      return req('registrationNumber') && req('dateRegistered') && req('centerName');
    }
    if (s === 1) {
      return req('firstName') && req('lastName') && req('birthdate') && req('age');
    }
    if (s === 2) {
      return req('barangay');
    }
    if (s === 3) {
      const exposureCount = (form.bite ? 1 : 0) + (form.nonBite ? 1 : 0);
      const hasSite = siteKeys.some((_, i) => !!form[`site_${i}`]);
      const siteOk = form.bite ? hasSite : true;
      return exposureCount === 1 && siteOk && req('dateOfInquiry') && req('timeOfInjury');
    }
    // Step 4: animal profile / immunization / management essentials
    if (s === 4) {
      const speciesOk = form.spDog || form.spCat || String(form.spOthers || '').trim();
      const ownershipOk = form.owner_0 || form.owner_1 || form.owner_2;
      const clinicalOk = ['cs_0','cs_1','cs_2','cs_3'].some(k => !!form[k]);
      const categoryOk = form.cat1 || form.cat2 || form.cat3;
      const washOk = form.woundWashYes || form.woundWashNo;
      return speciesOk && ownershipOk && clinicalOk && categoryOk && washOk;
    }
    return false;
  };

  // Auto-calc schedule dates from D0
  const setScheduleFromD0 = (d0Str) => {
    if (!d0Str) return;
    try {
      const base = new Date(d0Str);
      const addDays = (n) => new Date(base.getTime() + n * 86400000).toISOString().slice(0,10);
      setForm(prev => ({
        ...prev,
        sched_0: d0Str,
        sched_1: addDays(3),
        sched_2: addDays(7),
        sched_3: addDays(14),
        sched_4: addDays(28),
      }));
    } catch {}
  };

  const toDateOnly = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    } catch { return ''; }
  };

  const toLongDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const selectedSites = siteKeys.filter((_, i) => !!form[`site_${i}`]);
      const typeOfExposure = form.bite ? ['BITE'] : ['NON-BITE'];
      const natureOptions = ['Abrasion','Avulsion','Burn','Concussion','Contusion','Open wound/laceration','Trauma'];
      const natureOfInjury = [
        ...(form.multiInjuries ? ['Multiple Injuries'] : []),
        ...natureOptions.filter((_, i) => !!form[`inj_${i}`]).map(v => v.replace('Open wound/laceration', 'Open Wound')),
      ];
      const placeOptions = ['Home','School','Road','Neighbor'];
      const placeOfOccurrence = placeOptions.filter((_, i) => !!form[`place_${i}`]);

      const species = [
        ...(form.spDog ? ['Dog'] : []),
        ...(form.spCat ? ['Cat'] : []),
        ...(form.spOthers ? ['Others'] : []),
      ];
      const ownership = [
        ...(form.owner_0 ? ['Pet'] : []),
        ...(form.owner_1 ? ['Neighbor'] : []),
        ...(form.owner_2 ? ['Stray'] : []),
      ];
      const clinical = ['Healthy','Sick','Died','Killed'].filter((_, i) => !!form[`cs_${i}`]);
      const brainExam = ['Brain Exam Done','No Brain Exam','Unknown'].filter((_, i) => !!form[`brain_${i}`]);
      const washingWound = [
        ...(form.woundWashYes ? ['Yes'] : []),
        ...(form.woundWashNo ? ['No'] : []),
      ];
      const category = [
        ...(form.cat1 ? ['Category 1'] : []),
        ...(form.cat2 ? ['Category 2'] : []),
        ...(form.cat3 ? ['Category 3'] : []),
      ];

      const scheduleDates = [0,1,2,3,4]
        .map(i => toDateOnly(form[`sched_${i}`]))
        .filter(Boolean);
      const currentTypes = [
        ...(form.curActive ? ['Active'] : []),
        ...(form.cur_0 ? ['Post-exposure'] : []),
        ...(form.cur_1 ? ['Pre-exposure'] : []),
        ...(form.cur_2 ? ['Previously Immunized'] : []),
      ];
      const patientDpt = [
        ...(form.dptComplete ? ['Complete'] : []),
        ...(form.dptIncomplete ? ['Incomplete'] : []),
        ...(form.dptNone ? ['None'] : []),
      ];
      const currentSchedule = [
        ...(form.structured ? ['Structured'] : []),
        ...(form.unstructured ? ['Unstructured'] : []),
      ];
      const hasSkinTest = !!(form.immSkinTimeTested || form.immSkinTimeRead || form.immSkinResult || form.immSkinDateGiven);
      const hasHrig = !!(form.immTigDose || form.immTigDateGiven);

      const payload = {
        // registration/meta
        registrationNumber: form.registrationNumber || '',
        philhealthNo: form.philhealthNo || '',
        dateRegistered: toDateOnly(form.dateRegistered),
        arrivalDate: toDateOnly(form.dateOfInquiry),
        arrivalTime: form.timeOfInjury || '',
        center: form.centerName || '',

        // patient linkage
        patientId: selectedPatient?.patientId || selectedPatient?._id || '',

        // personal
        firstName: form.firstName || '',
        middleName: form.middleName || '',
        lastName: form.lastName || '',
        weight: form.weight || '',
        civilStatus: form.civilStatus || '',
        sex: form.sex || '',
        birthdate: toDateOnly(form.birthdate),
        birthplace: form.birthplace || '',
        age: form.age || '',
        nationality: form.nationality || '',
        religion: form.religion || '',
        occupation: form.occupation || '',
        contactNo: form.contactNo || '',

        // address
        houseNo: form.houseNo || '',
        street: form.street || '',
        barangay: form.barangay || '',
        subdivision: form.subdivision || '',
        city: form.city || form.municipality || '',
        province: form.province || '',
        zipCode: form.zipCode || '',

        // history of bite
        typeOfExposure,
        siteOfBite: selectedSites,
        dateOfInquiry: toLongDate(form.dateOfInquiry),
        timeOfInjury: form.timeOfInjury || '',
        natureOfInjury,
        burnDegree: 1,
        burnSite: form.burnSite || '',
        othersInjuryDetails: form.injOthers || '',
        externalCause: [
          ...(form.externalCauseBiteSting ? ['Bite/Sting'] : []),
          ...(form.externalCauseChemical ? ['Chemical Substance'] : []),
        ],
        biteStingDetails: form.causeBiteStingDetail || '',
        chemicalSubstanceDetails: form.causeChemicalDetail || '',
        placeOfOccurrence,
        placeOthersDetails: form.placeOthers || '',
        disposition: [
          ...(form.treatedHome ? ['Treated & Sent Home'] : []),
          ...(form.transferred ? ['Transferred to another facility/hospital'] : []),
        ],
        transferredTo: form.transferredTo || '',
        circumstanceOfBite: [
          ...(form.provoked ? ['Provoked'] : []),
          ...(form.unprovoked ? ['Unprovoked'] : []),
        ],

        // schedule
        scheduleDates,

        // animal profile
        animalProfile: {
          species,
          othersSpecify: form.spOthers || form.spOthersSpecify || '',
          clinicalStatus: clinical.length ? clinical : ['Healthy'],
          brainExam,
          vaccinationStatus: form.animalImmunized ? ['Immunized'] : ['Not Immunized'],
          vaccinationDate: form.animalImmunizedYear || '',
          ownership: ownership.length ? ownership : ['Pet'],
        },

        // management
        management: {
          washingWound,
          category: category.length ? category : ['Category 2'],
          diagnosis: form.diagnosis || '',
          allergyHistory: form.allergy || '',
          maintenanceMedications: form.maintenance || '',
          managementDetails: form.management || '',
        },

        patientImmunization: {
          active: !!form.immActive,
          toxoid: !!form.immToxoid,
          tt1: form.immTT1 || '',
          tt2: form.immTT2 || '',
          tt3: form.immTT3 || '',
          passive: !!form.immPassive,
          skinTest: !!form.immSkinTest,
          skinTestTime: form.immSkinTimeTested || '',
          skinTestReadTime: form.immSkinTimeRead || '',
          skinTestResult: form.immSkinResult || '',
          skinTestDose: form.immSkinDose || '',
          skinTestDate: toDateOnly(form.immSkinDateGiven),
          tig: !!form.immTig,
          tigDose: form.immTigDose || '',
          tigDate: toDateOnly(form.immTigDateGiven),
        },

        currentImmunization: {
          erig: { dateTaken: '', medicineUsed: '', branchNo: '' },
          type: currentTypes.length ? currentTypes : ['Active'],
          vaccine: form.vacVaxirab ? ['PCEC'] : ['PVRV'],
          route: form.routeIM ? ['IM'] : ['ID'],
          passive: hasHrig,
          skinTest: hasSkinTest,
          skinTestTime: form.skinTimeTested || '',
          skinTestReadTime: form.skinTimeRead || '',
          skinTestResult: form.skinResult || '',
          skinTestDate: toDateOnly(form.skinDateGiven),
          hrig: hasHrig,
          hrigDose: form.hrigDose || '',
          hrigDate: toDateOnly(form.hrigDate),
          localInfiltration: !!form.localInfiltration,
          schedule: currentSchedule,
          doseMedicines: [],
        },

        status: 'in_progress',
        // explicit day fields like in sample
        d0Date: scheduleDates[0] || null,
        d3Date: scheduleDates[1] || null,
        d7Date: scheduleDates[2] || null,
        d14Date: scheduleDates[3] || null,
        d28Date: scheduleDates[4] || null,
        d0Status: scheduleDates[0] ? 'scheduled' : undefined,
        d3Status: scheduleDates[1] ? 'scheduled' : undefined,
        d7Status: scheduleDates[2] ? 'scheduled' : undefined,
        d14Status: scheduleDates[3] ? 'scheduled' : undefined,
        d28Status: scheduleDates[4] ? 'scheduled' : undefined,
      };

      const res = await apiFetch('/api/bitecases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to save bite case');

      // Create vaccinationdates record so it shows up in scheduler
      try {
        const created = data?.data || data; // support {success,data}
        console.log('🔍 Creating vaccinationdates record for bite case:', created?._id);
        
        // Get the schedule dates from the form data
        const scheduleDates = [
          form.sched_0, // D0
          form.sched_1, // D3
          form.sched_2, // D7
          form.sched_3, // D14
          form.sched_4  // D28
        ];
        
        const vdBody = {
          biteCaseId: created?._id,
          patientId: payload.patientId,
          registrationNumber: payload.registrationNumber,
          d0Date: toDateOnly(scheduleDates[0]) || null,
          d3Date: toDateOnly(scheduleDates[1]) || null,
          d7Date: toDateOnly(scheduleDates[2]) || null,
          d14Date: toDateOnly(scheduleDates[3]) || null,
          d28Date: toDateOnly(scheduleDates[4]) || null,
          d0Status: scheduleDates[0] ? 'scheduled' : undefined,
          d3Status: scheduleDates[1] ? 'scheduled' : undefined,
          d7Status: scheduleDates[2] ? 'scheduled' : undefined,
          d14Status: scheduleDates[3] ? 'scheduled' : undefined,
          d28Status: scheduleDates[4] ? 'scheduled' : undefined,
          treatmentStatus: 'in_progress',
          exposureCategory: Array.isArray(payload.management?.category) ? payload.management.category[0] : 'Category 2',
          lastTreatmentDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('🔍 Vaccinationdates payload:', vdBody);
        
        const vdResponse = await apiFetch('/api/vaccinationdates', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(vdBody) 
        });
        
        if (vdResponse.ok) {
          const vdResult = await vdResponse.json();
          console.log('🔍 Successfully created vaccinationdates record:', vdResult);
        } else {
          const vdError = await vdResponse.json().catch(() => ({}));
          console.error('🔍 Failed to create vaccinationdates record:', vdError);
          throw new Error(vdError.message || 'Failed to create vaccination schedule');
        }
      } catch (vdErr) {
        console.error('🔍 Failed to create vaccinationdates record:', vdErr);
        // Don't throw here - bite case was created successfully, just vaccinationdates failed
        // Show a warning but don't block the form submission
        showToast(`Bite case created successfully, but vaccination schedule creation failed: ${vdErr.message}`, 'warning');
      }

      if (onSaved) onSaved(data);
      showToast('Bite case created successfully!', 'success');
      try { localStorage.removeItem('newBiteCaseDraft'); } catch {}
      if (onClose) onClose();
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to create bite case'}`, 'error');
      setError('submit', String(err.message || err));
    } finally {
      setSaving(false);
    }
  };
  const handleClose = () => {
    try { localStorage.removeItem('newBiteCaseDraft'); } catch {}
    if (onClose) return onClose();
    if (onCancel) return onCancel();
  };

  const content = (
    <BiteCaseFormContext.Provider value={{ form, errors, handleChange, rememberFieldActivity }}>
    <div>
      <div className="bitecase-panel">
        <div className="bitecase-header">
          <div className="bitecase-title">Create New Bite Case</div>
          <button type="button" aria-label="Close" className="bitecase-close" onClick={handleClose}>✕</button>
        </div>
        <div className="bitecase-progress-shell">
          <div className="bitecase-progress-meta">
            <div>
              <div className="bitecase-progress-label">Step {step + 1} of {totalSteps}</div>
              <div className="bitecase-progress-title">{stepLabels[step]}</div>
            </div>
            <div className="bitecase-progress-percent">{Math.round(progressPercent)}%</div>
          </div>
          <div className="bitecase-progress-track" aria-hidden="true">
            <div className="bitecase-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="bitecase-progress-note">{stepDescriptions[step]}</div>
          <div className="bitecase-stepper">
            {stepLabels.map((lbl, i) => (
              <div key={lbl} className={`bitecase-step ${i === step ? 'is-active' : i < step ? 'is-complete' : ''}`}>
                <div className="bitecase-step-badge">{i + 1}</div>
                <div className="bitecase-step-label">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bitecase-separator" />
        <div className="bitecase-body">
          <form onSubmit={async (e)=>{
            e.preventDefault();
            if (!isLastStep()) {
              const ok = validateStep(step);
              if (!ok) return;
              nextStep();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            // Final step: full validation then submit
            const ok = validate();
            if (!ok) {
              return;
            }
            await handleSubmit(e);
          }} className="bitecase-form space-y-6">
            {hasActiveSchedules && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#fef2f2',
                border: '2px solid #f87171',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                color: '#991b1b',
                fontWeight: '600',
              }}>
                <i className="fa fa-triangle-exclamation" style={{ fontSize: '1.2rem', color: '#dc2626' }} />
                <span>
                  Cannot create a new case: This patient has active scheduled vaccination dates. 
                  A new case can only be created if all scheduled dates are completed or missed.
                </span>
              </div>
            )}
            {/* Step 0: Registration */}
            {step === 0 && (
              <section className="section">
                <div className="section-title">Registration</div>
                <div className="form-grid grid-2">
                  <Input name="registrationNumber" label="Registration Number *" />
                  <Input name="philhealthNo" label="Philhealth No." />
                  <Input name="dateRegistered" type="date" label="Date Registered *" />
                  <Input name="centerName" label="Center Name *" />
                </div>
              </section>
            )}

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <section className="section">
                <div className="section-title">Personal Information</div>

                {/* Auto-fill banner */}
                {prefillDone && selectedPatient && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '18px',
                    fontSize: '0.85rem',
                    color: '#1e40af',
                    fontWeight: '500',
                  }}>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: '1rem', color: '#2563eb' }} />
                    Fields have been auto-filled from{' '}
                    <strong>
                      {[selectedPatient.firstName, selectedPatient.middleName, selectedPatient.lastName]
                        .filter(Boolean).join(' ')}
                    </strong>'s profile. You can still edit any field below.
                  </div>
                )}

                <div className="form-grid grid-3">
                  <Input name="firstName" label="First Name *" />
                  <Input name="middleName" label="Middle Name" />
                  <Input name="lastName" label="Last Name *" />
                  <Input name="weight" label="Weight" />
                  <Input name="civilStatus" label="Civil Status" />
                  <Input name="sex" label="Sex" />
                  <Input name="birthdate" type="date" label="Birthdate *" />
                  <Input name="birthplace" label="Birthplace" />
                  <Input name="age" label="Age *" />
                  <Input name="nationality" label="Nationality" />
                  <Input name="religion" label="Religion" />
                  <Input name="occupation" label="Occupation" />
                  <Input name="contactNo" label="Contact No." />
                  <Input name="philhealthNo" label="Philhealth No." />
                </div>
              </section>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <section className="section">
                <div className="section-title">Address</div>
                <div className="form-grid grid-2">
                  <Input name="houseNo" label="House No." />
                  <Input name="street" label="Street" />
                  <Input name="barangay" label="Barangay" />
                  <Input name="subdivision" label="Subdivision" />
                  <Input name="city" label="City" />
                  <Input name="province" label="Province" />
                  <Input name="zipCode" label="Zip Code" />
                </div>
              </section>
            )}

            {/* History of Bite */}
            {step === 3 && (
            <>
            <section className="section">
              <div className="section-title">History of Bite</div>
              <div className="form-label">Type of Exposure</div>
              <div className="checkbox-row">
                <Check name="nonBite" label="NON-BITE" onChange={() => toggleExposure('nonBite')} />
                <Check name="bite" label="BITE" onChange={() => toggleExposure('bite')} />
              </div>
              {errors.exposure && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.exposure}</div>}

              {form.bite && (
                <>
                  <div className="form-label" style={{marginTop: '10px'}}>Site of Bite</div>
                  <div className="checkbox-row" style={{ flexWrap: 'wrap' }}>
                    {siteKeys.map((lbl,i)=> (
                      <Check key={i} name={`site_${i}`} label={lbl} onChange={() => toggleSite(i)} />
                    ))}
                  </div>
                  {errors.site && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.site}</div>}
                </>
              )}

              <div className="form-grid grid-2" style={{marginTop: '10px'}}>
                <Input name="dateOfInquiry" type="date" label="Date of Injury *" />
                <Input name="timeOfInjury" type="time" label="Time of Injury *" />
              </div>
            </section>

            {/* Nature of Injury */}
            <section className="section">
              <div className="section-title">Nature of Injury/ies</div>
              <div className="form-label">Multiple Injuries</div>
              <div className="checkbox-row">
                <Check name="multiInjuriesYes" label="Yes" onChange={() => toggleRadio('multipleInjuries', 'yes')} />
                <Check name="multiInjuriesNo" label="No" onChange={() => toggleRadio('multipleInjuries', 'no')} />
              </div>
              {errors.multipleInjuries && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.multipleInjuries}</div>}
              
              <div className="form-grid grid-2" style={{ opacity: form.multiInjuriesYes ? 1 : 0.5, pointerEvents: form.multiInjuriesYes ? 'auto' : 'none' }}>
                {['Abrasion','Avulsion','Burn','Concussion','Contusion','Open wound/laceration','Trauma'].map((lbl,i)=> (
                  <Check key={i} name={`inj_${i}`} label={lbl} />
                ))}
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <Check name="injOthersCheckbox" label="Others" onChange={(e) => toggleInjuryOthers(e.target.checked)} />
                <div style={{ marginTop: '8px' }}>
                  <TextArea name="injOthers" label="" disabled={!form.injOthersCheckbox} />
                </div>
              </div>
            </section>

            {/* External Causes & Place of Occurrence */}
            <section className="section">
              <div className="section-title">External Causes / Place of Occurrence</div>
              <div className="form-label">External causes</div>
              <div className="checkbox-row">
                <Check name="externalCauseBiteSting" label="Bite / Sting" onChange={(e) => toggleExternalCause('causeBiteSting', e.target.checked)} />
                <Check name="externalCauseChemical" label="Chemical Substance" onChange={(e) => toggleExternalCause('causeChemical', e.target.checked)} />
              </div>
              {form.externalCauseBiteSting && <Input name="causeBiteStingDetail" label="Specify animal / insect" />}
              {form.externalCauseChemical && <Input name="causeChemicalDetail" label="Applied substance" />}
              <div className="form-label" style={{marginTop: '10px'}}>Place of Occurrence</div>
              <div className="checkbox-row" style={{ flexWrap: 'wrap' }}>
                {['Home','School','Road','Neighbor'].map((lbl,i)=> (
                  <Check key={i} name={`place_${i}`} label={lbl} onChange={(e) => togglePlace(i, e.target.checked)} />
                ))}
              </div>
              <Input name="placeOthers" label="Others / Details" />
            </section>

            {/* Disposition & Circumstance */}
            <section className="section">
              <div className="section-title">Disposition & Circumstance</div>
              <div className="checkbox-row" style={{ flexWrap: 'wrap' }}>
                <Check name="treatedHome" label="Treated & Sent Home" onChange={(e) => toggleDisposition('treatedHome', e.target.checked)} />
                <Check name="transferred" label="Transferred to another facility/hospital (specify)" onChange={(e) => toggleDisposition('transferred', e.target.checked)} />
              </div>
              {form.transferred && (
                <div className="w-full" style={{marginTop: '10px'}}>
                  <label className="form-label">Select Center/Hospital:</label>
                  <select
                    value={form.transferredTo || ''}
                    onChange={(e) => handleChange('transferredTo', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select a center...</option>
                    {centers.map((center, index) => (
                      <option key={index} value={center.centerName || center.name || center}>
                        {center.centerName || center.name || center}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="checkbox-row" style={{marginTop: '10px'}}>
                <Check name="provoked" label="Provoked" onChange={(e) => toggleProvoked('provoked', e.target.checked)} />
                <Check name="unprovoked" label="Unprovoked" onChange={(e) => toggleProvoked('unprovoked', e.target.checked)} />
              </div>
            </section>
            </>
            )}

            {step === 4 && (
            <>
            {/* Animal Profile */}
            <section className="section">
              <div className="section-title">Animal Profile</div>
              <div className="form-label">Species</div>
              <div className="checkbox-row">
                <Check name="spDog" label="Dog" onChange={() => toggleRadio('species', 'dog')} />
                <Check name="spCat" label="Cat" onChange={() => toggleRadio('species', 'cat')} />
              </div>
              <Input name="spOthers" label="Others (specify)" />
              {errors.species && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.species}</div>}
              <div className="form-label" style={{marginTop: '10px'}}>Clinical Status</div>
              <div className="checkbox-row">
                {['Healthy','Sick','Died','Killed'].map((lbl,i)=> (<Check key={i} name={`cs_${i}`} label={lbl} onChange={() => toggleRadio('clinicalStatus', i)} />))}
              </div>
              {errors.clinicalStatus && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.clinicalStatus}</div>}
              <div className="form-label" style={{marginTop: '10px'}}>Brain Exam</div>
              <div className="checkbox-row">
                {['Brain Exam Done','No Brain Exam','Unknown'].map((lbl,i)=> (<Check key={i} name={`brain_${i}`} label={lbl} onChange={() => toggleRadio('brainExam', i)} />))}
              </div>
              <div className="form-label" style={{marginTop: '10px'}}>Anti-Rabies Vaccination Status of Animal</div>
              <Check name="animalImmunized" label="Immunized, when:" onChange={(e) => toggleAnimalImmunization('animalImmunized', e.target.checked)} />
              <Input name="animalImmunizedYear" label="Year" disabled={!form.animalImmunized} />
              <Check name="animalNone" label="None" onChange={(e) => toggleAnimalImmunization('animalNone', e.target.checked)} />
              <div className="form-label" style={{marginTop: '10px'}}>Ownership Status</div>
              <div className="checkbox-row">
                {['Pet','Neighbor','Stray'].map((lbl,i)=> (<Check key={i} name={`owner_${i}`} label={lbl} onChange={() => toggleRadio('ownership', ['pet', 'neighbor', 'stray'][i])} />))}
            </div>
            {errors.ownership && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.ownership}</div>}
            </section>

            {/* Patient Immunization */}
            <section className="section">
              <div className="section-title">Patient Immunization</div>
              
              {/* Active Section */}
              <div style={{ marginBottom: '20px' }}>
                <Check 
                  name="immActive" 
                  label="Active" 
                  onChange={(e) => handleActiveChange(e.target.checked)} 
                />
                <div style={{ 
                  paddingLeft: '24px', 
                  marginTop: '10px',
                  opacity: form.immActive ? 1 : 0.5,
                  pointerEvents: form.immActive ? 'auto' : 'none'
                }}>
                  <Check 
                    name="immToxoid" 
                    label="Toxoid" 
                    onChange={(e) => handleToxoidChange(e.target.checked)}
                  />
                  <div style={{ 
                    paddingLeft: '24px', 
                    marginTop: '10px',
                    opacity: (form.immActive && form.immToxoid) ? 1 : 0.5,
                    pointerEvents: (form.immActive && form.immToxoid) ? 'auto' : 'none'
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#4b5563', marginBottom: '8px' }}>Date:</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '60px', fontSize: '0.85rem', color: '#4b5563' }}>TT1</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immTT1" type="date" label="" />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '60px', fontSize: '0.85rem', color: '#4b5563' }}>TT2</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immTT2" type="date" label="" />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '60px', fontSize: '0.85rem', color: '#4b5563' }}>TT3</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immTT3" type="date" label="" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passive Section */}
              <div>
                <Check 
                  name="immPassive" 
                  label="Passive" 
                  onChange={(e) => handlePassiveChange(e.target.checked)} 
                />
                
                <div style={{ 
                  paddingLeft: '24px', 
                  marginTop: '10px',
                  opacity: form.immPassive ? 1 : 0.5,
                  pointerEvents: form.immPassive ? 'auto' : 'none'
                }}>
                  
                  {/* Skin Test Section */}
                  <div style={{ marginBottom: '15px' }}>
                    <Check 
                      name="immSkinTest" 
                      label="SKIN TEST" 
                      onChange={(e) => handleSkinTestChange(e.target.checked)}
                    />
                    <div style={{ 
                      paddingLeft: '24px', 
                      marginTop: '10px',
                      opacity: (form.immPassive && form.immSkinTest) ? 1 : 0.5,
                      pointerEvents: (form.immPassive && form.immSkinTest) ? 'auto' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxWidth: '400px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '120px', fontSize: '0.85rem', color: '#4b5563' }}>Time Tested</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immSkinTimeTested" type="time" label="" />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '120px', fontSize: '0.85rem', color: '#4b5563' }}>Time Read</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immSkinTimeRead" type="time" label="" />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '120px', fontSize: '0.85rem', color: '#4b5563' }}>Result</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immSkinResult" label="" />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '120px', fontSize: '0.85rem', color: '#4b5563' }}>Dose</span>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <Input name="immSkinDose" label="" />
                          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '0.85rem', pointerEvents: 'none' }}>"U"</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '120px', fontSize: '0.85rem', color: '#4b5563' }}>Date Given</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immSkinDateGiven" type="date" label="" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIG Section */}
                  <div>
                    <Check 
                      name="immTig" 
                      label="TIG" 
                      onChange={(e) => handleTigChange(e.target.checked)}
                    />
                    <div style={{ 
                      paddingLeft: '24px', 
                      marginTop: '10px',
                      opacity: (form.immPassive && form.immTig) ? 1 : 0.5,
                      pointerEvents: (form.immPassive && form.immTig) ? 'auto' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxWidth: '400px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '120px', fontSize: '0.85rem', color: '#4b5563' }}>Dose</span>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <Input name="immTigDose" label="" />
                          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '0.85rem', pointerEvents: 'none' }}>"U"</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '120px', fontSize: '0.85rem', color: '#4b5563' }}>Date Given</span>
                        <div style={{ flex: 1 }}>
                          <Input name="immTigDateGiven" type="date" label="" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* Current Anti-Rabies Immunization */}
            <section className="section">
              <div className="section-title">Current Anti-Rabies Immunization</div>
              <Check name="curActive" label="Active" />
              <div className="checkbox-row">
                {['Post-exposure','Pre-exposure','Previously Immunized'].map((lbl,i)=> (<Check key={i} name={`cur_${i}`} label={lbl} onChange={(e) => toggleCurrentAntiRabies(i, e.target.checked)} />))}
              </div>
              <div className="form-label" style={{marginTop: '10px'}}>Vaccine Name</div>
              <div className="checkbox-row">
                <Check name="vacSpeeda" label="SPEEDA (PVRV)" onChange={(e) => toggleVaccine('vacSpeeda', e.target.checked)} />
                <Check name="vacVaxirab" label="VAXIRAB (PCEC)" onChange={(e) => toggleVaccine('vacVaxirab', e.target.checked)} />
                </div>
              <div className="form-label" style={{marginTop: '10px'}}>Route of Administration</div>
              <div className="checkbox-row">
                <Check name="routeID" label="Intradermal (ID)" onChange={(e) => toggleRoute('routeID', e.target.checked)} />
                <Check name="routeIM" label="Intramuscular (IM)" onChange={(e) => toggleRoute('routeIM', e.target.checked)} />
              </div>
              <div className="form-label" style={{marginTop: '10px'}}>Schedule Dates of Immunization</div>
              {['D0','D3','D7','D14','D28'].map((d, i)=> (
                <div key={d} className="flex items-center gap-8 mb-2">
                  <span className="w-10" style={{color:'#374151'}}>{d}</span>
                  {i === 0 ? (
                    <Input name={`sched_${i}`} type="date" label="" onChange={(e)=> setScheduleFromD0(e.target.value)} />
                  ) : (
                    <Input name={`sched_${i}`} type="date" label="" />
                  )}
                </div>
              ))}
            </section>



            {/* Management */}
            <section className="section">
              <div className="section-title">Management</div>
              <div className="form-label">Washing of wound</div>
              <div className="checkbox-row">
                <Check name="woundWashYes" label="Yes" onChange={() => toggleRadio('woundWash', 'yes')} />
                <Check name="woundWashNo" label="No" onChange={() => toggleRadio('woundWash', 'no')} />
              </div>
              {errors.washingWound && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.washingWound}</div>}
              <Input name="diagnosis" label="Diagnosis" />
              <div className="checkbox-row" style={{marginTop: '10px'}}>
                <Check name="cat1" label="Category 1" onChange={() => toggleRadio('category', 'cat1')} />
                <Check name="cat2" label="Category 2" onChange={() => toggleRadio('category', 'cat2')} />
                <Check name="cat3" label="Category 3" onChange={() => toggleRadio('category', 'cat3')} />
            </div>
              {errors.category && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.category}</div>}
              <Input name="allergy" label="Any History of Allergy" />
              <Input name="maintenance" label="Maintenance Medications" />
              <TextArea name="management" label="Management:" rows={4} />
            </section>
            </>
            )}

            <div className="actions">
              <div className="actions-left">
                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                  <i className="fa fa-times" /> Cancel
                </button>
                {step > 0 && (
                  <button type="button" className="btn btn-outline" onClick={prevStep}>
                    <i className="fa fa-arrow-left" /> Back
                  </button>
                )}
              </div>
              <div className="actions-right">
                {!isLastStep() ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => nextStep()}
                    disabled={!isStepComplete(step) || hasActiveSchedules}
                  >
                    Next <i className="fa fa-arrow-right" />
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary" disabled={saving || hasActiveSchedules}>
                    {saving ? (<><i className="fa fa-spinner fa-spin"></i> Saving...</>) : (<><i className="fa fa-save"></i> Save Case</>)}
                  </button>
                )}
              </div>
            </div>
        </form>
          </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`bitecase-toast ${toast.type || 'success'}`}>
          {toast.message}
        </div>
      )}
    </div>
    </BiteCaseFormContext.Provider>
  );

  return content;
};

export default NewBiteCaseForm;
