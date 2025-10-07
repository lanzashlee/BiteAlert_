import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import './NewBiteCaseForm.css';
import { apiFetch } from '../../config/api';


const NewBiteCaseForm = ({ onClose, selectedPatient, onSaved }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  const handleChange = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const setError = (name, message) => setErrors(prev => ({ ...prev, [name]: message }));
  const clearError = (name) => setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });

  // Single-select for exposure: "bite" or "nonBite"
  const toggleExposure = (key) => {
    const next = key === 'bite' ? { bite: true, nonBite: false } : { bite: false, nonBite: true };
    setForm(prev => ({ ...prev, ...next }));
    clearError('exposure');
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
    // Basic required fields
    const req = (key, label) => { if (!String(form[key] || '').trim()) nextErrors[key] = `${label} is required.`; };
    [
      ['registrationNumber','Registration Number'],
      ['dateRegistered','Date Registered'],
      ['centerName','Center Name'],
      ['firstName','First Name'],
      ['lastName','Last Name'],
      ['sex','Sex'],
      ['birthdate','Birthdate'],
      ['birthplace','Birthplace'],
      ['age','Age'],
      ['weight','Weight'],
      ['nationality','Nationality'],
      ['religion','Religion'],
      ['occupation','Occupation'],
      ['contactNo','Contact No.'],
      ['barangay','Barangay'],
      ['city','City'],
      ['province','Province'],
    ].forEach(([k,l])=>req(k,l));
    // Exposure required exactly one
    const exposureCount = (form.bite ? 1 : 0) + (form.nonBite ? 1 : 0);
    if (exposureCount !== 1) nextErrors.exposure = 'Select exactly one exposure type.';

    // Site of bite: at least one
    const hasSite = siteKeys.some((_, i) => !!form[`site_${i}`]);
    if (!hasSite) nextErrors.site = 'Select at least one site of bite.';

    // Date of inquiry required
    if (!form.dateOfInquiry) nextErrors.dateOfInquiry = 'Date of injury is required.';

    // Time of injury required (HH:MM)
    if (!form.timeOfInjury) nextErrors.timeOfInjury = 'Time of injury is required.';

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
        arrivalDate: toLongDate(form.dateOfInquiry),
        arrivalTime: form.timeOfInjury || '',
        center: form.centerName || '',

        // patient linkage
        patientId: selectedPatient?._id || selectedPatient?.patientId,

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
        const vdBody = {
          biteCaseId: created?._id,
          patientId: payload.patientId,
          registrationNumber: payload.registrationNumber,
          d0Date: payload.d0Date || (payload.scheduleDates?.[0] || null),
          d3Date: payload.d3Date || (payload.scheduleDates?.[1] || null),
          d7Date: payload.d7Date || (payload.scheduleDates?.[2] || null),
          d14Date: payload.d14Date || (payload.scheduleDates?.[3] || null),
          d28Date: payload.d28Date || (payload.scheduleDates?.[4] || null),
          d0Status: payload.d0Status || (payload.scheduleDates?.[0] ? 'scheduled' : undefined),
          d3Status: payload.d3Status || (payload.scheduleDates?.[1] ? 'scheduled' : undefined),
          d7Status: payload.d7Status || (payload.scheduleDates?.[2] ? 'scheduled' : undefined),
          d14Status: payload.d14Status || (payload.scheduleDates?.[3] ? 'scheduled' : undefined),
          d28Status: payload.d28Status || (payload.scheduleDates?.[4] ? 'scheduled' : undefined),
          treatmentStatus: 'in_progress',
          exposureCategory: (Array.isArray(category) && category.includes('Category 3')) ? 'Category 3' : (category?.[0] || 'Category 2'),
          lastTreatmentDate: null,
        };
        await apiFetch('/api/vaccinationdates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vdBody) });
      } catch (vdErr) {
        console.warn('Failed to create vaccinationdates record:', vdErr);
      }

      if (onSaved) onSaved(data);
      if (onClose) onClose();
    } catch (err) {
      setError('submit', String(err.message || err));
    }
  };

  const Input = ({ name, label, type = 'text', placeholder='', onChange }) => (
    <div className="w-full">
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={form[name] ?? ''}
        id={name}
        onChange={(e)=> {
          if (errors[name]) clearError(name);
          const next = e.target.value;
          if (onChange) onChange(e);
          else setForm(prev => (prev[name] === next ? prev : { ...prev, [name]: next }));
        }}
        placeholder={placeholder}
        className="form-input"
        aria-invalid={!!errors[name]}
      />
      {errors[name] && <div style={{ color:'#b91c1c', fontSize:'0.8rem', marginTop:4 }}>{errors[name]}</div>}
    </div>
  );

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

  const content = (
    <div>
      <div className="bitecase-panel">
        <div className="bitecase-header">
          <div className="bitecase-title">Create New Bite Case</div>
          <button type="button" aria-label="Close" className="bitecase-close" onClick={() => onClose && onClose()}>✕</button>
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
            {Object.keys(errors).length > 0 && (
              <div className="error-message" role="alert">Please correct the highlighted fields.</div>
            )}
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
              <Input name="transferredTo" label="" />
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
                <Check name="spDog" label="Dog" />
                <Check name="spCat" label="Cat" />
              </div>
              <Input name="spOthers" label="Others (specify)" />
              <div className="form-label" style={{marginTop: '10px'}}>Clinical Status</div>
              <div className="checkbox-row">
                {['Healthy','Sick','Died','Killed','No Brain Exam Done','Unknown'].map((lbl,i)=> (<Check key={i} name={`cs_${i}`} label={lbl} />))}
              </div>
              <div className="form-label" style={{marginTop: '10px'}}>Anti-Rabies Vaccination Status of Animal</div>
              <Check name="animalImmunized" label="Immunized, when:" />
              <Input name="animalImmunizedYear" label="Year" />
              <Check name="animalNone" label="None" />
              <div className="form-label" style={{marginTop: '10px'}}>Ownership Status</div>
              <div className="checkbox-row">
                {['Pet','Neighbor','Stray'].map((lbl,i)=> (<Check key={i} name={`owner_${i}`} label={lbl} />))}
            </div>
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
                <Check name="woundWashYes" label="Washing of wound: Yes" />
                <Check name="woundWashNo" label="No" />
              </div>
              <Input name="diagnosis" label="Diagnosis" />
              <div className="checkbox-row" style={{marginTop: '10px'}}>
                <Check name="cat1" label="Category 1" />
                <Check name="cat2" label="Category 2" />
                <Check name="cat3" label="Category 3" />
              </div>
              <Input name="allergy" label="Any History of Allergy" />
              <Input name="maintenance" label="Maintenance Medications" />
              <TextArea name="management" label="Management:" rows={4} />
            </section>

            <div className="actions" style={{justifyContent:'space-between'}}>
              <button type="button" className="btn btn-secondary" onClick={()=> onClose && onClose()}>Back</button>
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
