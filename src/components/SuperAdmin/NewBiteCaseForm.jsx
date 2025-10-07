import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import './NewBiteCaseForm.css';
import { apiFetch } from '../../config/api';
// notifications removed per request


// Reusable input component (defined outside to avoid re-creation and focus loss)
function FormInput({ name, label, type = 'text', placeholder = '', value = '', error, onChange }) {
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
      />
      {error && (
        <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

const NewBiteCaseForm = ({ onClose, onCancel, selectedPatient, onSaved }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [centers, setCenters] = useState([]);

  // Prefill from selected patient (only when patient identity changes)
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!selectedPatient || prefilledRef.current) return;
    prefilledRef.current = true;
    setForm(prev => ({
      ...prev,
      firstName: selectedPatient.firstName || '',
      middleName: selectedPatient.middleName || '',
      lastName: selectedPatient.lastName || '',
      weight: selectedPatient.weight || '',
      civilStatus: selectedPatient.civilStatus || '',
      sex: selectedPatient.sex || '',
      birthdate: selectedPatient.birthdate ? new Date(selectedPatient.birthdate).toISOString().slice(0,10) : '',
      birthplace: selectedPatient.birthplace || '',
      age: selectedPatient.birthdate ? String(new Date().getFullYear() - new Date(selectedPatient.birthdate).getFullYear()) : (selectedPatient.age || ''),
      nationality: selectedPatient.nationality || '',
      religion: selectedPatient.religion || '',
      occupation: selectedPatient.occupation || '',
      contactNo: selectedPatient.phone || selectedPatient.contactNo || '',
      // Address
      houseNo: selectedPatient.houseNo || '',
      street: selectedPatient.street || '',
      barangay: selectedPatient.barangay || selectedPatient.addressBarangay || '',
      subdivision: selectedPatient.subdivision || '',
      city: selectedPatient.city || '',
      province: selectedPatient.province || '',
      zipCode: selectedPatient.zipCode || '',
      centerName: selectedPatient.barangay ? `${selectedPatient.barangay} Center` : (prev.centerName || ''),
    }));
  }, [selectedPatient?._id]);

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

  // Adapter so existing usages continue to work while FormInput lives outside
  const Input = (props) => (
    <FormInput
      {...props}
      value={form[props.name] ?? ''}
      error={errors[props.name]}
      onChange={(e) => {
        const next = e.target.value;
        if (typeof props.onChange === 'function') props.onChange(e);
        handleChange(props.name, next);
      }}
    />
  );

  const setError = (name, message) => setErrors(prev => ({ ...prev, [name]: message }));
  const clearError = (name) => setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });

  // Single-select for exposure: "bite" or "nonBite"
  const toggleExposure = (key) => {
    const next = key === 'bite' ? { bite: true, nonBite: false } : { bite: false, nonBite: true };
    setForm(prev => ({ ...prev, ...next }));
    clearError('exposure');
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
      ['cs_0', 'cs_1', 'cs_2', 'cs_3', 'cs_4', 'cs_5'].forEach(key => {
        updates[key] = false;
      });
      updates[`cs_${value}`] = true;
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

    // Site of bite: at least one
    const hasSite = siteKeys.some((_, i) => !!form[`site_${i}`]);
    if (!hasSite) nextErrors.site = 'Please select at least one site of bite';

    // Simple radio button validations
    const oneTrue = (keys) => keys.some(k => !!form[k]);
    if (!oneTrue(['woundWashYes','woundWashNo'])) nextErrors.washingWound = 'Please indicate wound washing';
    if (!oneTrue(['cat1','cat2','cat3'])) nextErrors.category = 'Please select a category';
    if (!oneTrue(['spDog','spCat']) && !String(form.spOthers || '').trim()) nextErrors.species = 'Please select species or specify others';
    if (!oneTrue(['owner_0','owner_1','owner_2'])) nextErrors.ownership = 'Please select ownership';
    if (!oneTrue(['cs_0','cs_1','cs_2','cs_3','cs_4','cs_5'])) nextErrors.clinicalStatus = 'Please select clinical status';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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

  const toIsoUtcNoon = (dateString) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
    } catch { return null; }
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
      const clinical = ['Healthy','Sick','Died','Killed','No Brain Exam Done','Unknown']
        .filter((_, i) => !!form[`cs_${i}`]);
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
        .map(i => toIsoUtcNoon(form[`sched_${i}`]))
        .filter(Boolean);

      const payload = {
        // registration/meta
        registrationNumber: form.registrationNumber || '',
        philhealthNo: form.philhealthNo || '',
        dateRegistered: toIsoUtcNoon(form.dateRegistered),
        arrivalDate: toDateOnly(form.dateOfInquiry) || toLongDate(form.dateOfInquiry),
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
        birthdate: form.birthdate ? new Date(form.birthdate).toISOString() : null,
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
        city: form.city || '',
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
          ...(form.causeBiteSting ? ['Bite/Sting'] : []),
          ...(form.causeChemical ? ['Chemical Substance'] : []),
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
          othersSpecify: form.spOthers ? (form.spOthersSpecify || '') : null,
          clinicalStatus: clinical.length ? clinical : ['Healthy'],
          brainExam: [],
          vaccinationStatus: form.animalImmunized ? ['Immunized'] : ['Not Immunized'],
          vaccinationDate: form.animalImmunizedYear || null,
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

        patientImmunization: {},

        currentImmunization: {
          erig: { dateTaken: '', medicineUsed: '', branchNo: '' },
          type: ['Active'],
          vaccine: form.vacVaxirab ? ['PCEC'] : ['PVRV'],
          route: form.routeIM ? ['IM'] : ['ID'],
          passive: false,
          skinTest: false,
          skinTestTime: null,
          skinTestReadTime: null,
          skinTestResult: null,
          skinTestDate: null,
          hrig: false,
          hrigDose: null,
          hrigDate: '',
          localInfiltration: !!form.localInfiltration,
          schedule: [],
          doseMedicines: [],
        },

        status: 'completed',
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
        alert(`Bite case created successfully, but vaccination schedule creation failed: ${vdErr.message}`);
      }

      if (onSaved) onSaved(data);
      if (onClose) onClose();
    } catch (err) {
      setError('submit', String(err.message || err));
    }
  };


  const TextArea = ({ name, label, rows=3 }) => (
    <div className="w-full">
      <label className="form-label">{label}</label>
      <textarea
        id={name}
        rows={rows}
        value={form[name] ?? ''}
        onChange={(e)=>{ if (errors[name]) clearError(name); const next = e.target.value; setForm(prev => (prev[name] === next ? prev : { ...prev, [name]: next })); }}
        className="form-textarea"
        aria-invalid={!!errors[name]}
      />
      {errors[name] && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors[name]}</div>}
    </div>
  );

  const Check = ({ name, label, onChange }) => (
    <label className="checkbox-item">
      <input type="checkbox" checked={!!form[name]} onChange={onChange ? onChange : ((e)=>handleChange(name, e.target.checked))} />
      {label}
    </label>
  );

  const handleClose = () => {
    if (onClose) return onClose();
    if (onCancel) return onCancel();
  };

  const content = (
    <div>
      <div className="bitecase-panel">
        <div className="bitecase-header">
          <div className="bitecase-title">Create New Bite Case</div>
          <button type="button" aria-label="Close" className="bitecase-close" onClick={handleClose}>✕</button>
        </div>
        <div className="bitecase-separator" />
        <div className="bitecase-body">
          <form onSubmit={async (e)=>{
            const ok = validate();
            if (!ok) {
              e.preventDefault();
              const firstKey = Object.keys(errors).concat(Object.keys(form))[0];
              try { document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
              return;
            }
            await handleSubmit(e);
          }} className="space-y-6" style={{maxWidth: '1200px', margin: '0 auto'}}>
            {/* Removed blocking banner to allow free typing */}
            {/* Registration */}
            <section className="section">
              <div className="section-title">Registration</div>
              <div className="form-grid grid-2">
                <Input name="registrationNumber" label="Registration Number *" />
                <Input name="philhealthNo" label="Philhealth No." />
                <Input name="dateRegistered" type="date" label="Date Registered *" />
                <Input name="centerName" label="Center Name *" />
        </div>
            </section>

            {/* Personal Information */}
            <section className="section">
              <div className="section-title">Personal Information</div>
              <div className="form-grid grid-3">
                <Input name="firstName" label="First Name" />
                <Input name="middleName" label="Middle Name" />
                <Input name="lastName" label="Last Name" />
                <Input name="weight" label="Weight *" />
                <Input name="civilStatus" label="Civil Status" />
                <Input name="sex" label="Sex" />
                <Input name="birthdate" type="date" label="Birthdate *" />
                <Input name="birthplace" label="Birthplace *" />
                <Input name="age" label="Age *" />
                <Input name="nationality" label="Nationality *" />
                <Input name="religion" label="Religion *" />
                <Input name="occupation" label="Occupation *" />
                <Input name="contactNo" label="Contact No. *" />
              </div>
            </section>

            {/* Address */}
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

            {/* History of Bite */}
            <section className="section">
              <div className="section-title">History of Bite</div>
              <div className="form-label">Type of Exposure</div>
              <div className="checkbox-row">
                <Check name="nonBite" label="NON-BITE" onChange={() => toggleExposure('nonBite')} />
                <Check name="bite" label="BITE" onChange={() => toggleExposure('bite')} />
            </div>
              {errors.exposure && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.exposure}</div>}

              <div className="form-label">Site of Bite</div>
              <div className="checkbox-row">
                {siteKeys.map((lbl,i)=> (
                  <Check key={i} name={`site_${i}`} label={lbl} onChange={() => toggleSite(i)} />
          ))}
        </div>
              {errors.site && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.site}</div>}

              <div className="form-grid grid-2" style={{marginTop: '10px'}}>
                <Input name="dateOfInquiry" type="date" label="Date of Injury *" />
                <Input name="timeOfInjury" type="time" label="Time of Injury *" />
              </div>
            </section>

            {/* Nature of Injury */}
            <section className="section">
              <div className="section-title">Nature of Injury/ies</div>
              <div className="mb-2"><Check name="multiInjuries" label="Multiple Injuries?" /></div>
              <div className="form-grid grid-2">
                {['Abrasion','Avulsion','Burn','Concussion','Contusion','Open wound/laceration','Trauma'].map((lbl,i)=> (
                  <Check key={i} name={`inj_${i}`} label={lbl} />
                ))}
                </div>
              <TextArea name="injOthers" label="Others" />
            </section>

            {/* External Causes & Place of Occurrence */}
            <section className="section">
              <div className="section-title">External Causes / Place of Occurrence</div>
              <div className="form-label">External causes</div>
              <Check name="causeBiteSting" label="Bite/ Sting (specify animal/insect)" />
              <Input name="causeBiteStingDetail" label="" />
              <Check name="causeChemical" label="Chemical Substance (applied to bite site)" />
              <Input name="causeChemicalDetail" label="" />
              <div className="form-label" style={{marginTop: '10px'}}>Place of Occurrence</div>
              <div className="checkbox-row">
                {['Home','School','Road','Neighbor'].map((lbl,i)=> (<Check key={i} name={`place_${i}`} label={lbl} />))}
                </div>
              <Input name="placeOthers" label="Others" />
            </section>

            {/* Disposition & Circumstance */}
            <section className="section">
              <div className="section-title">Disposition & Circumstance</div>
              <Check name="treatedHome" label="Treated & Sent Home" />
              <Check name="transferred" label="Transferred to another facility/hospital (specify)" />
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
              {!form.transferred && (
                <Input name="transferredTo" label="" />
              )}
              <div className="checkbox-row" style={{marginTop: '10px'}}>
                <Check name="provoked" label="Provoked" />
                <Check name="unprovoked" label="Unprovoked" />
              </div>
            </section>

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
                {['Healthy','Sick','Died','Killed','No Brain Exam Done','Unknown'].map((lbl,i)=> (<Check key={i} name={`cs_${i}`} label={lbl} onChange={() => toggleRadio('clinicalStatus', i)} />))}
              </div>
              {errors.clinicalStatus && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.clinicalStatus}</div>}
              <div className="form-label" style={{marginTop: '10px'}}>Anti-Rabies Vaccination Status of Animal</div>
              <Check name="animalImmunized" label="Immunized, when:" />
              <Input name="animalImmunizedYear" label="Year" />
              <Check name="animalNone" label="None" />
              <div className="form-label" style={{marginTop: '10px'}}>Ownership Status</div>
              <div className="checkbox-row">
                {['Pet','Neighbor','Stray'].map((lbl,i)=> (<Check key={i} name={`owner_${i}`} label={lbl} onChange={() => toggleRadio('ownership', ['pet', 'neighbor', 'stray'][i])} />))}
            </div>
            {errors.ownership && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors.ownership}</div>}
            </section>

            {/* Patient Immunization */}
            <section className="section">
              <div className="section-title">Patient Immunization</div>
              <div className="form-label">DPT Immunization</div>
              <Check name="dptComplete" label="Complete" />
              <Input name="dptYear" label="Year Given (last dose)" />
              <Check name="dptIncomplete" label="Incomplete" />
              <Input name="dptDoses" label="No. of Dose given" />
              <Check name="dptNone" label="None" />
              <div className="form-label" style={{marginTop: '10px'}}>Previous</div>
              <Input name="prevDoseNo" label="No. of doses given" />
              <Input name="prevYearLastDose" label="Year last dose given" />
            </section>

            {/* Current Anti-Rabies Immunization */}
            <section className="section">
              <div className="section-title">Current Anti-Rabies Immunization</div>
              <Check name="curActive" label="Active" />
              <div className="checkbox-row">
                {['Post Exposure','Pre-Exposure Prophylaxis','Previously Immunized(PEP)'].map((lbl,i)=> (<Check key={i} name={`cur_${i}`} label={lbl} />))}
              </div>
              <div className="form-label" style={{marginTop: '10px'}}>Vaccine Name</div>
              <div className="checkbox-row">
                <Check name="vacSpeeda" label="SPEEDA (PVRV)" />
                <Check name="vacVaxirab" label="VAXIRAB (PCEC)" />
                </div>
              <div className="form-label" style={{marginTop: '10px'}}>Route of Administration</div>
              <div className="checkbox-row">
                <Check name="routeID" label="Intradermal (ID)" />
                <Check name="routeIM" label="Intramuscular (IM)" />
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

            {/* Passive / HRIG / TIG */}
            <section className="section">
              <div className="section-title">Passive</div>
              <div className="form-label">SKIN TEST</div>
              <Input name="skinTimeTested" label="Time Tested" />
              <Input name="skinTimeRead" label="Time Read" />
              <Input name="skinResult" label="Result" />
              <Input name="skinDateGiven" type="date" label="Date Given" />
              <div className="form-label" style={{marginTop: '10px'}}>HRIG</div>
              <Input name="hrigDose" label="Dose" />
              <Input name="hrigDate" type="date" label="Date Given" />
              <div className="checkbox-row" style={{marginTop: '8px'}}>
                <Check name="localInfiltration" label="Local Infiltration done" />
                <Check name="structured" label="Structured" />
                <Check name="unstructured" label="Unstructured" />
                </div>
            </section>

            {/* Management */}
            <section className="section">
              <div className="section-title">Management</div>
              <div className="checkbox-row">
                <Check name="woundWashYes" label="Washing of wound: Yes" onChange={() => toggleRadio('woundWash', 'yes')} />
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

            <div className="actions" style={{justifyContent:'space-between'}}>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
          </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default NewBiteCaseForm;
