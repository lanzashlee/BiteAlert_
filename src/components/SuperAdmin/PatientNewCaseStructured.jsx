import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../config/api';

// Compact, structured new-case form that mirrors the mobile Dart layout.
export default function PatientNewCaseStructured({ selectedPatient, onSaved, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Core identifiers / defaults
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [dateRegistered, setDateRegistered] = useState('');
  const [center, setCenter] = useState('');

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
  const [typeBite, setTypeBite] = useState(false);
  const [dateOfInquiry, setDateOfInquiry] = useState('');
  const [timeOfInjury, setTimeOfInjury] = useState('');
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

  // Animal profile
  const [animal, setAnimal] = useState({ dog:false, cat:false, other:false, otherText:'', healthy:false, sick:false, died:false, killed:false, brainExam:false, noBrainExam:false, unknown:false, immunized:false, notImmunized:false, immunizedYear:'' , pet:false, neighbor:false, stray:false});

  // Patient immunization (DPT / TT)
  const [dpt, setDpt] = useState({ complete:false, incomplete:false, none:false, year:'', doses:'' });
  const [tt, setTt] = useState({ active:false, passive:false, tt1:'', tt2:'', tt3:'' });

  // Current anti-rabies immunization
  const [current, setCurrent] = useState({ active:true, post:true, pre:false, prevImm:false, pvrv:false, pcec:false, id:false, im:false, passive:false, skinTest:false, skinTime:'', skinRead:'', skinResult:'', skinDose:'', skinDate:'', hrig:false, hrigDose:'', hrigDate:'', localInfiltration:false, structured:false, unstructured:false });

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

  const genReg = () => {
    const yy = String(new Date().getFullYear()).slice(2);
    const rnd = Math.floor(Math.random()*10000).toString().padStart(4,'0');
    const tail = String(Date.now()).slice(-2);
    return `${yy}-${rnd}${tail}`;
  };

  useEffect(() => {
    const p = selectedPatient || {};
    setRegistrationNumber(genReg());
    const today = new Date();
    setDateRegistered(today.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }));
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

    // initialize schedule D0..D28
    const base = new Date();
    const f = (d)=> d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
    setSchedule({ d0:f(base), d3:f(new Date(base.getTime()+3*86400000)), d7:f(new Date(base.getTime()+7*86400000)), d14:f(new Date(base.getTime()+14*86400000)), d28:f(new Date(base.getTime()+28*86400000))});
  }, [selectedPatient]);

  const validate = () => {
    if (!firstName || !lastName || !sex) return 'Basic information is incomplete';
    if (!barangay || !city || !province) return 'Address is incomplete';
    if (!current.pvrv && !current.pcec) return 'Select vaccine name (SPEEDA or VAXIRAB)';
    if (!current.id && !current.im) return 'Select route (ID or IM)';
    return '';
  };

  const onSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        patientId: selectedPatient?._id || selectedPatient?.patientId,
        registrationNumber,
        philhealthNo: '',
        dateRegistered: toIsoUtcNoon(dateRegistered),
        arrivalDate: null,
        arrivalTime: null,
        firstName, middleName: middleName||null, lastName,
        civilStatus: civilStatus||null,
        birthdate: toIsoUtcNoon(birthdate),
        birthplace: birthPlace||null,
        nationality: nationality||null,
        religion: religion||null,
        occupation: occupation||null,
        contactNo: phone||null,
        houseNo, street, barangay, subdivision, city, province, zipCode,
        age, weight, sex, center,
        typeOfProphylaxis: current.post ? 'Post-exposure' : (current.pre ? 'Pre-exposure' : 'Active'),
        exposureDate: toIsoUtcNoon(dateRegistered),
        exposurePlace: '', exposureType: '', exposureSource: '',
        exposureCategory: 'I',
        rig: false,
        genericName: current.pcec ? 'PCEC' : (current.pvrv ? 'PVRV' : ''),
        brandName: current.pcec ? 'VAXIRAB' : (current.pvrv ? 'SPEEDA' : ''),
        route: current.id ? 'ID' : (current.im ? 'IM' : ''),
        lastArn: null,
        completed: '', tt: '',
        scheduleDates: [schedule.d0, schedule.d3, schedule.d7, schedule.d14, schedule.d28].map(toIsoUtcNoon).filter(Boolean),
        animalStatus: '', remarks: '', status: 'in_progress', branchNo: center,
        dateOfInquiry: dateOfInquiry||null, timeOfInjury: timeOfInjury||null,
        typeNonBite, typeBite,
        headBite: site.head, faceBite: site.face, neckBite: site.neck, chestBite: site.chest, backBite: site.back, abdomenBite: site.abdomen, upperExtremitiesBite: site.upper, lowerExtremitiesBite: site.lower, othersBite: site.others, othersBiteSpecify: site.othersText||null,
        multipleInjuries: injury.multiple, abrasion: injury.abrasion, avulsion: injury.avulsion, burn: injury.burn, burnDegree: injury.burnDegree, burnSite: injury.burnSite||null, concussion: injury.concussion, contusion: injury.contusion, openWound: injury.openWound, trauma: injury.trauma, othersInjury: injury.others, othersInjuryDetails: injury.othersText||null,
        biteSting, biteStingDetails: biteStingDetails||null, chemicalSubstance, chemicalSubstanceDetails: chemicalDetails||null,
        placeHome: place.home, placeSchool: place.school, placeRoad: place.road, placeNeighbor: place.neighbor, placeOthers: place.others, placeOthersDetails: place.othersText||null,
        dispositionTreated: treated, dispositionTransferred: transferred, transferredTo: transferred ? transferredTo : null,
        animalDog: animal.dog, animalCat: animal.cat, animalOthers: animal.other, animalOthersSpecify: animal.otherText||null,
        animalHealthy: animal.healthy, animalSick: animal.sick, animalDied: animal.died, animalKilled: animal.killed,
        animalBrainExamDone: animal.brainExam, animalNoBrainExam: animal.noBrainExam, animalUnknown: animal.unknown,
        animalImmunized: animal.immunized, animalNotImmunized: animal.notImmunized, animalVaccinationDate: animal.immunized ? (animal.immunizedYear||'') : null,
        animalPet: animal.pet, animalNeighbor: animal.neighbor, animalStray: animal.stray,
        diagnosis: null,
        category1: false, category2: false, category3: false,
        allergyHistory: null, maintenanceMedications: null, managementDetails: null,
        dptComplete: dpt.complete, dptIncomplete: dpt.incomplete, dptNone: dpt.none, dptYearGiven: dpt.year||null, dptDosesGiven: dpt.doses||null,
        ttActive: tt.active, ttPassive: tt.passive, tt1Date: tt.tt1||null, tt2Date: tt.tt2||null, tt3Date: tt.tt3||null,
        currentActive: current.active, currentPostExposure: current.post, currentPreExposure: current.pre, currentPreviouslyImmunized: current.prevImm,
        currentPvrv: current.pvrv, currentPcec: current.pcec, currentId: current.id, currentIm: current.im,
        currentPassive: current.passive, currentSkinTest: current.skinTest, currentSkinTestTime: current.skinTime||null, currentSkinTestReadTime: current.skinRead||null, currentSkinTestResult: current.skinResult||null, currentSkinTestDate: current.skinDate||null,
        currentHrig: current.hrig, hrigDose: current.hrigDose||null, hrigDate: current.hrigDate||null,
        currentLocalInfiltration: current.localInfiltration, currentStructured: current.structured, currentUnstructured: current.unstructured,
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

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {error ? <div style={{ color:'#b91c1c', background:'#fee2e2', border:'1px solid #fecaca', padding:12, borderRadius:8 }}>{error}</div> : null}

      {/* Basic info */}
      <h3 style={{ color:'#7D0C0C' }}>Basic Information</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
        <input placeholder="Registration Number" value={registrationNumber} readOnly />
        <input placeholder="Date Registered" value={dateRegistered} readOnly />
        <input placeholder="Center" value={center} readOnly />
        <input placeholder="First Name" value={firstName} onChange={e=>setFirstName(e.target.value)} />
        <input placeholder="Middle Name" value={middleName} onChange={e=>setMiddleName(e.target.value)} />
        <input placeholder="Last Name" value={lastName} onChange={e=>setLastName(e.target.value)} />
        <input placeholder="Birthdate (Month Day, Year)" value={birthdate} onChange={e=>setBirthdate(e.target.value)} />
        <input placeholder="Sex" value={sex} onChange={e=>setSex(e.target.value)} />
        <input placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} />
        <input placeholder="Weight" value={weight} onChange={e=>setWeight(e.target.value)} />
        <input placeholder="Birthplace" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} />
        <input placeholder="Civil Status" value={civilStatus} onChange={e=>setCivilStatus(e.target.value)} />
        <input placeholder="Nationality" value={nationality} onChange={e=>setNationality(e.target.value)} />
        <input placeholder="Religion" value={religion} onChange={e=>setReligion(e.target.value)} />
        <input placeholder="Contact No." value={phone} onChange={e=>setPhone(e.target.value)} />
      </div>

      {/* Address */}
      <h3 style={{ color:'#7D0C0C' }}>Address</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
        <input placeholder="House No." value={houseNo} onChange={e=>setHouseNo(e.target.value)} />
        <input placeholder="Street" value={street} onChange={e=>setStreet(e.target.value)} />
        <input placeholder="Barangay" value={barangay} onChange={e=>setBarangay(e.target.value)} />
        <input placeholder="Subdivision" value={subdivision} onChange={e=>setSubdivision(e.target.value)} />
        <input placeholder="City" value={city} onChange={e=>setCity(e.target.value)} />
        <input placeholder="Province" value={province} onChange={e=>setProvince(e.target.value)} />
        <input placeholder="Zip Code" value={zipCode} onChange={e=>setZipCode(e.target.value)} />
      </div>

      {/* History of Bite */}
      <h3 style={{ color:'#7D0C0C' }}>History of Bite</h3>
      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={typeNonBite} onChange={e=>{setTypeNonBite(e.target.checked); if (e.target.checked) setTypeBite(false);}} /> NON-BITE</label>
        <label><input type="checkbox" checked={typeBite} onChange={e=>{setTypeBite(e.target.checked); if (e.target.checked) setTypeNonBite(false);}} /> BITE</label>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
        <input placeholder="Date of Inquiry" value={dateOfInquiry} onChange={e=>setDateOfInquiry(e.target.value)} />
        <input placeholder="Time of Injury (AM/PM)" value={timeOfInjury} onChange={e=>setTimeOfInjury(e.target.value)} />
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {['head','face','neck','chest','back','abdomen','upper','lower'].map(k => (
          <label key={k}><input type="checkbox" checked={site[k]} onChange={e=>setSite(s=>({ ...s, [k]: e.target.checked }))} /> {k === 'upper' ? 'Upper Extremities' : k === 'lower' ? 'Lower Extremities' : k.charAt(0).toUpperCase()+k.slice(1)}</label>
        ))}
        <label><input type="checkbox" checked={site.others} onChange={e=>setSite(s=>({ ...s, others: e.target.checked }))} /> Others</label>
        <input placeholder="Others (specify)" value={site.othersText} onChange={e=>setSite(s=>({ ...s, othersText: e.target.value }))} />
      </div>

      {/* Nature of Injury */}
      <h3 style={{ color:'#7D0C0C' }}>Nature of Injury</h3>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {['multiple','abrasion','avulsion','burn','concussion','contusion','openWound','trauma'].map(k => (
          <label key={k}><input type="checkbox" checked={injury[k]} onChange={e=>setInjury(s=>({ ...s, [k]: e.target.checked }))} /> {k === 'openWound' ? 'Open Wound' : k.charAt(0).toUpperCase()+k.slice(1)}</label>
        ))}
      </div>
      {injury.burn ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
          <input placeholder="Burn Degree (1-4)" value={injury.burnDegree} onChange={e=>setInjury(s=>({ ...s, burnDegree: Number(e.target.value||1) }))} />
          <input placeholder="Burn Site" value={injury.burnSite} onChange={e=>setInjury(s=>({ ...s, burnSite: e.target.value }))} />
        </div>
      ) : null}

      {/* External Cause / Place / Disposition */}
      <h3 style={{ color:'#7D0C0C' }}>External Cause</h3>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={biteSting} onChange={e=>setBiteSting(e.target.checked)} /> Bite/Sting</label>
        {biteSting ? <input placeholder="Specify animal/insect" value={biteStingDetails} onChange={e=>setBiteStingDetails(e.target.value)} /> : null}
        <label><input type="checkbox" checked={chemicalSubstance} onChange={e=>setChemicalSubstance(e.target.checked)} /> Chemical Substance</label>
        {chemicalSubstance ? <input placeholder="Specify chemical substance" value={chemicalDetails} onChange={e=>setChemicalDetails(e.target.value)} /> : null}
      </div>

      <h3 style={{ color:'#7D0C0C' }}>Place of Occurrence</h3>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {['home','school','road','neighbor'].map(k => (
          <label key={k}><input type="checkbox" checked={place[k]} onChange={e=>setPlace(s=>({ ...s, [k]: e.target.checked }))} /> {k.charAt(0).toUpperCase()+k.slice(1)}</label>
        ))}
        <label><input type="checkbox" checked={place.others} onChange={e=>setPlace(s=>({ ...s, others: e.target.checked }))} /> Others</label>
        <input placeholder="Others (specify)" value={place.othersText} onChange={e=>setPlace(s=>({ ...s, othersText: e.target.value }))} />
      </div>

      <h3 style={{ color:'#7D0C0C' }}>Disposition</h3>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={treated} onChange={e=>{setTreated(e.target.checked); if (e.target.checked) setTransferred(false);}} /> Treated & Sent Home</label>
        <label><input type="checkbox" checked={transferred} onChange={e=>{setTransferred(e.target.checked); if (e.target.checked) setTreated(false);}} /> Transferred</label>
        {transferred ? <input placeholder="Facility/Hospital" value={transferredTo} onChange={e=>setTransferredTo(e.target.value)} /> : null}
      </div>

      {/* Animal Profile */}
      <h3 style={{ color:'#7D0C0C' }}>Animal Profile</h3>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {['dog','cat','other'].map(k => (<label key={k}><input type="checkbox" checked={animal[k]} onChange={e=>setAnimal(s=>({ ...s, [k]: e.target.checked }))} /> {k==='other'?'Others':k.charAt(0).toUpperCase()+k.slice(1)}</label>))}
        {animal.other ? <input placeholder="Others (specify)" value={animal.otherText} onChange={e=>setAnimal(s=>({ ...s, otherText: e.target.value }))} /> : null}
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {['healthy','sick','died','killed'].map(k => (<label key={k}><input type="checkbox" checked={animal[k]} onChange={e=>setAnimal(s=>({ ...s, [k]: e.target.checked }))} /> {k.charAt(0).toUpperCase()+k.slice(1)}</label>))}
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {['brainExam','noBrainExam','unknown'].map(k => (<label key={k}><input type="checkbox" checked={animal[k]} onChange={e=>setAnimal(s=>({ ...s, [k]: e.target.checked }))} /> {k==='brainExam'?'Brain Exam Done':k==='noBrainExam'?'No Brain Exam':'Unknown'}</label>))}
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={animal.immunized} onChange={e=>setAnimal(s=>({ ...s, immunized: e.target.checked, notImmunized: e.target.checked?false:s.notImmunized }))} /> Immunized</label>
        {animal.immunized ? <input placeholder="Year" value={animal.immunizedYear} onChange={e=>setAnimal(s=>({ ...s, immunizedYear: e.target.value }))} /> : null}
        <label><input type="checkbox" checked={animal.notImmunized} onChange={e=>setAnimal(s=>({ ...s, notImmunized: e.target.checked, immunized: e.target.checked?false:s.immunized }))} /> None</label>
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {['pet','neighbor','stray'].map(k => (<label key={k}><input type="checkbox" checked={animal[k]} onChange={e=>setAnimal(s=>({ ...s, [k]: e.target.checked }))} /> {k.charAt(0).toUpperCase()+k.slice(1)}</label>))}
      </div>

      {/* Patient Immunization */}
      <h3 style={{ color:'#7D0C0C' }}>Patient Immunization</h3>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={dpt.complete} onChange={e=>setDpt(s=>({ ...s, complete:e.target.checked, incomplete:e.target.checked?false:s.incomplete, none:e.target.checked?false:s.none }))} /> DPT Complete</label>
        {dpt.complete ? <input placeholder="Year Given (last dose)" value={dpt.year} onChange={e=>setDpt(s=>({ ...s, year:e.target.value }))} /> : null}
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={dpt.incomplete} onChange={e=>setDpt(s=>({ ...s, incomplete:e.target.checked, complete:e.target.checked?false:s.complete, none:e.target.checked?false:s.none }))} /> DPT Incomplete</label>
        {dpt.incomplete ? <input placeholder="No. of doses given" value={dpt.doses} onChange={e=>setDpt(s=>({ ...s, doses:e.target.value }))} /> : null}
      </div>
      <label><input type="checkbox" checked={dpt.none} onChange={e=>setDpt(s=>({ ...s, none:e.target.checked, complete:false, incomplete:false }))} /> DPT None</label>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:8 }}>
        <label><input type="checkbox" checked={tt.active} onChange={e=>setTt(s=>({ ...s, active:e.target.checked }))} /> TT Active</label>
        <label><input type="checkbox" checked={tt.passive} onChange={e=>setTt(s=>({ ...s, passive:e.target.checked }))} /> TT Passive</label>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
        <input placeholder="TT1 Date" value={tt.tt1} onChange={e=>setTt(s=>({ ...s, tt1:e.target.value }))} />
        <input placeholder="TT2 Date" value={tt.tt2} onChange={e=>setTt(s=>({ ...s, tt2:e.target.value }))} />
        <input placeholder="TT3 Date" value={tt.tt3} onChange={e=>setTt(s=>({ ...s, tt3:e.target.value }))} />
      </div>

      {/* Current Anti-Rabies */}
      <h3 style={{ color:'#7D0C0C' }}>Current Anti‑Rabies Immunization</h3>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={current.active} onChange={e=>setCurrent(s=>({ ...s, active:e.target.checked }))} /> Active</label>
        <label><input type="checkbox" checked={current.post} onChange={e=>setCurrent(s=>({ ...s, post:e.target.checked, pre:e.target.checked?false:s.pre, prevImm:e.target.checked?false:s.prevImm }))} /> Post Exposure</label>
        <label><input type="checkbox" checked={current.pre} onChange={e=>setCurrent(s=>({ ...s, pre:e.target.checked, post:e.target.checked?false:s.post, prevImm:e.target.checked?false:s.prevImm }))} /> Pre‑Exposure</label>
        <label><input type="checkbox" checked={current.prevImm} onChange={e=>setCurrent(s=>({ ...s, prevImm:e.target.checked, post:false, pre:false }))} /> Previously Immunized</label>
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={current.pvrv} onChange={e=>setCurrent(s=>({ ...s, pvrv:e.target.checked, pcec:e.target.checked?false:s.pcec }))} /> SPEEDA (PVRV)</label>
        <label><input type="checkbox" checked={current.pcec} onChange={e=>setCurrent(s=>({ ...s, pcec:e.target.checked, pvrv:e.target.checked?false:s.pvrv }))} /> VAXIRAB (PCEC)</label>
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <label><input type="checkbox" checked={current.id} onChange={e=>setCurrent(s=>({ ...s, id:e.target.checked, im:e.target.checked?false:s.im }))} /> ID</label>
        <label><input type="checkbox" checked={current.im} onChange={e=>setCurrent(s=>({ ...s, im:e.target.checked, id:e.target.checked?false:s.id }))} /> IM</label>
      </div>

      {/* Schedule */}
      <h3 style={{ color:'#7D0C0C' }}>Schedule Dates of Immunization</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
        <input placeholder="D0" value={schedule.d0} onChange={e=>setSchedule(s=>({ ...s, d0:e.target.value }))} />
        <input placeholder="D3" value={schedule.d3} onChange={e=>setSchedule(s=>({ ...s, d3:e.target.value }))} />
        <input placeholder="D7" value={schedule.d7} onChange={e=>setSchedule(s=>({ ...s, d7:e.target.value }))} />
        <input placeholder="D14" value={schedule.d14} onChange={e=>setSchedule(s=>({ ...s, d14:e.target.value }))} />
        <input placeholder="D28" value={schedule.d28} onChange={e=>setSchedule(s=>({ ...s, d28:e.target.value }))} />
      </div>

      {/* Save/Cancel */}
      <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:12 }}>
        <button onClick={onCancel} style={{ padding:'10px 16px', background:'#6b7280', color:'#fff', border:'none', borderRadius:8 }}>Cancel</button>
        <button disabled={saving} onClick={onSave} style={{ padding:'10px 16px', background:'#7D0C0C', color:'#fff', border:'none', borderRadius:8 }}>{saving?'Saving...':'Save'}</button>
      </div>
    </div>
  );
}


