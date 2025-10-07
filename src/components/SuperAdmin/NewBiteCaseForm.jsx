import React, { useState } from 'react';
import './NewBiteCaseForm.css';


const NewBiteCaseForm = ({ onClose }) => {
  const [form, setForm] = useState({});

  const handleChange = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const handleSubmit = (e) => { e.preventDefault(); };

  const Input = ({ name, label, type = 'text', placeholder='' }) => (
    <div className="w-full">
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={form[name] || ''}
        onChange={(e)=>handleChange(name, e.target.value)}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );

  const TextArea = ({ name, label, rows=3 }) => (
    <div className="w-full">
      <label className="form-label">{label}</label>
      <textarea
        rows={rows}
        value={form[name] || ''}
        onChange={(e)=>handleChange(name, e.target.value)}
        className="form-textarea"
      />
    </div>
  );

  const Check = ({ name, label }) => (
    <label className="checkbox-item">
      <input type="checkbox" checked={!!form[name]} onChange={(e)=>handleChange(name, e.target.checked)} />
      {label}
    </label>
  );

  return (
    <div>
      <div className="bitecase-overlay" onClick={() => onClose && onClose()} />
      <div className="bitecase-panel">
        <div className="bitecase-header">
          <div className="bitecase-title">Create New Bite Case</div>
          <button type="button" aria-label="Close" className="bitecase-close" onClick={() => onClose && onClose()}>✕</button>
        </div>
        <div className="bitecase-separator" />
        <div className="bitecase-body">
          <form onSubmit={handleSubmit} className="space-y-6" style={{maxWidth: '1200px', margin: '0 auto'}}>
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
                <Check name="nonBite" label="NON-BITE" />
                <Check name="bite" label="BITE" />
            </div>
              <div className="form-label">Site of Bite</div>
              <div className="checkbox-row">
                {['Head','Chest','Upper Extremities','Face','Back','Lower Extremities','Neck','Abdomen'].map((lbl,i)=> (
                  <Check key={i} name={`site_${i}`} label={lbl} />
          ))}
        </div>
              <Input name="siteOthers" label="Others (specify)" />
              <div className="form-grid grid-2" style={{marginTop: '10px'}}>
                <Input name="dateOfInquiry" type="date" label="Date of Inquiry *" />
                <Input name="timeOfInjury" label="Time of Injury (am/pm) *" />
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
                <div key={d} className="flex items-center gap-8 mb-2"><span className="w-10" style={{color:'#374151'}}>{d}</span><Input name={`sched_${i}`} type="date" label="" /></div>
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

            <div className="actions">
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
          </div>
      </div>
    </div>
  );
};

export default NewBiteCaseForm;
