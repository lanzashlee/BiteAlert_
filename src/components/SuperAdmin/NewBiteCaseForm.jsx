import React, { useState } from 'react';
import './NewBiteCaseForm.css';


const NewBiteCaseForm = ({ onClose }) => {
  const [form, setForm] = useState({});

  const handleChange = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const handleSubmit = (e) => { e.preventDefault(); };

  const Input = ({ name, label, type = 'text', placeholder='' }) => (
    <div className="w-full">
      <label className="text-sm font-semibold text-red-700 block mb-1">{label}</label>
      <input
        type={type}
        value={form[name] || ''}
        onChange={(e)=>handleChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 rounded-lg border border-red-700/80 bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-300 px-3"
      />
    </div>
  );

  const TextArea = ({ name, label, rows=3 }) => (
    <div className="w-full">
      <label className="text-sm font-semibold text-red-700 block mb-1">{label}</label>
      <textarea
        rows={rows}
        value={form[name] || ''}
        onChange={(e)=>handleChange(name, e.target.value)}
        className="w-full rounded-lg border border-red-700/80 bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-300 px-3 py-2"
      />
    </div>
  );

  const Check = ({ name, label }) => (
    <label className="inline-flex items-center gap-2 mr-6 mb-2 text-[15px] text-slate-700">
      <input type="checkbox" checked={!!form[name]} onChange={(e)=>handleChange(name, e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={() => onClose && onClose()} />
      {/* Panel */}
      <div className="relative w-[96vw] h-[92vh] max-w-6xl bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-red-600 text-white px-5 py-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Create New Bite Case</h1>
          </div>
          <button type="button" aria-label="Close" className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center" onClick={() => onClose && onClose()}>✕</button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between px-8 py-5 bg-slate-50/70 border-b">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-3 group">
              <div className={`relative flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${step >= s.id ? 'bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white ring-2 ring-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>
                {s.id}
              </div>
              <div className={`text-sm font-medium ${step >= s.id ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Registration */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Registration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="registrationNumber" label="Registration Number *" />
                <Input name="philhealthNo" label="Philhealth No." />
                <Input name="dateRegistered" type="date" label="Date Registered *" />
                <Input name="centerName" label="Center Name *" />
              </div>
            </section>

            {/* Personal Information */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">History of Bite</h2>
              <div className="mb-2 text-red-700 font-semibold">Type of Exposure:</div>
              <div className="flex flex-wrap mb-3">
                <Check name="nonBite" label="NON-BITE" />
                <Check name="bite" label="BITE" />
              </div>
              <div className="mb-2 text-red-700 font-semibold">Site of Bite:</div>
              <div className="flex flex-wrap mb-4">
                {['Head','Chest','Upper Extremities','Face','Back','Lower Extremities','Neck','Abdomen'].map((lbl,i)=> (
                  <Check key={i} name={`site_${i}`} label={lbl} />
                ))}
              </div>
              <Input name="siteOthers" label="Others (specify)" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input name="dateOfInquiry" type="date" label="Date of Inquiry *" />
                <Input name="timeOfInjury" label="Time of Injury (am/pm) *" />
              </div>
            </section>

            {/* Nature of Injury */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Nature of Injury/ies</h2>
              <div className="mb-2"><Check name="multiInjuries" label="Multiple Injuries?" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {['Abrasion','Avulsion','Burn','Concussion','Contusion','Open wound/laceration','Trauma'].map((lbl,i)=> (
                  <Check key={i} name={`inj_${i}`} label={lbl} />
                ))}
              </div>
              <TextArea name="injOthers" label="Others" />
            </section>

            {/* External Causes & Place of Occurrence */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">External Causes / Place of Occurrence</h2>
              <div className="mb-2 font-semibold text-red-700">External causes</div>
              <Check name="causeBiteSting" label="Bite/ Sting (specify animal/insect)" />
              <Input name="causeBiteStingDetail" label="" />
              <Check name="causeChemical" label="Chemical Substance (applied to bite site)" />
              <Input name="causeChemicalDetail" label="" />
              <div className="mt-4 mb-2 font-semibold text-red-700">Place of Occurrence</div>
              <div className="flex flex-wrap">
                {['Home','School','Road','Neighbor'].map((lbl,i)=> (<Check key={i} name={`place_${i}`} label={lbl} />))}
              </div>
              <Input name="placeOthers" label="Others" />
            </section>

            {/* Disposition & Circumstance */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Disposition & Circumstance</h2>
              <Check name="treatedHome" label="Treated & Sent Home" />
              <Check name="transferred" label="Transferred to another facility/hospital (specify)" />
              <Input name="transferredTo" label="" />
              <div className="mt-4 flex flex-wrap">
                <Check name="provoked" label="Provoked" />
                <Check name="unprovoked" label="Unprovoked" />
              </div>
            </section>

            {/* Animal Profile */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Animal Profile</h2>
              <div className="mb-2 font-semibold text-red-700">Species</div>
              <div className="flex flex-wrap">
                <Check name="spDog" label="Dog" />
                <Check name="spCat" label="Cat" />
              </div>
              <Input name="spOthers" label="Others (specify)" />
              <div className="mt-3 mb-2 font-semibold text-red-700">Clinical Status</div>
              <div className="flex flex-wrap">
                {['Healthy','Sick','Died','Killed','No Brain Exam Done','Unknown'].map((lbl,i)=> (<Check key={i} name={`cs_${i}`} label={lbl} />))}
              </div>
              <div className="mt-3 mb-2 font-semibold text-red-700">Anti-Rabies Vaccination Status of Animal</div>
              <Check name="animalImmunized" label="Immunized, when:" />
              <Input name="animalImmunizedYear" label="Year" />
              <Check name="animalNone" label="None" />
              <div className="mt-3 mb-2 font-semibold text-red-700">Ownership Status</div>
              <div className="flex flex-wrap">
                {['Pet','Neighbor','Stray'].map((lbl,i)=> (<Check key={i} name={`owner_${i}`} label={lbl} />))}
              </div>
            </section>

            {/* Patient Immunization */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Patient Immunization</h2>
              <div className="mb-1 font-semibold text-red-700">DPT Immunization</div>
              <Check name="dptComplete" label="Complete" />
              <Input name="dptYear" label="Year Given (last dose)" />
              <Check name="dptIncomplete" label="Incomplete" />
              <Input name="dptDoses" label="No. of Dose given" />
              <Check name="dptNone" label="None" />
              <div className="mt-3 mb-1 font-semibold text-red-700">Previous</div>
              <Input name="prevDoseNo" label="No. of doses given" />
              <Input name="prevYearLastDose" label="Year last dose given" />
            </section>

            {/* Current Anti-Rabies Immunization */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Current Anti-Rabies Immunization</h2>
              <Check name="curActive" label="Active" />
              <div className="flex flex-wrap">
                {['Post Exposure','Pre-Exposure Prophylaxis','Previously Immunized(PEP)'].map((lbl,i)=> (<Check key={i} name={`cur_${i}`} label={lbl} />))}
              </div>
              <div className="mt-2 mb-2 font-semibold text-red-700">Vaccine Name</div>
              <div className="flex flex-wrap">
                <Check name="vacSpeeda" label="SPEEDA (PVRV)" />
                <Check name="vacVaxirab" label="VAXIRAB (PCEC)" />
              </div>
              <div className="mt-2 mb-2 font-semibold text-red-700">Route of Administration</div>
              <div className="flex flex-wrap">
                <Check name="routeID" label="Intradermal (ID)" />
                <Check name="routeIM" label="Intramuscular (IM)" />
              </div>
              <div className="mt-3 mb-1 font-semibold text-red-700">Schedule Dates of Immunization</div>
              {['D0','D3','D7','D14','D28'].map((d, i)=> (
                <div key={d} className="flex items-center gap-3 mb-2"><span className="w-10 text-slate-700">{d}</span><Input name={`sched_${i}`} type="date" label="" /></div>
              ))}
            </section>

            {/* Passive / HRIG / TIG */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Passive</h2>
              <div className="mb-1 font-semibold text-red-700">SKIN TEST</div>
              <Input name="skinTimeTested" label="Time Tested" />
              <Input name="skinTimeRead" label="Time Read" />
              <Input name="skinResult" label="Result" />
              <Input name="skinDateGiven" type="date" label="Date Given" />
              <div className="mt-4 mb-1 font-semibold text-red-700">HRIG</div>
              <Input name="hrigDose" label="Dose" />
              <Input name="hrigDate" type="date" label="Date Given" />
              <div className="flex flex-wrap mt-2">
                <Check name="localInfiltration" label="Local Infiltration done" />
                <Check name="structured" label="Structured" />
                <Check name="unstructured" label="Unstructured" />
              </div>
            </section>

            {/* Management */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Management</h2>
              <div className="flex flex-wrap">
                <Check name="woundWashYes" label="Washing of wound: Yes" />
                <Check name="woundWashNo" label="No" />
              </div>
              <Input name="diagnosis" label="Diagnosis" />
              <div className="mt-2 flex flex-wrap">
                <Check name="cat1" label="Category 1" />
                <Check name="cat2" label="Category 2" />
                <Check name="cat3" label="Category 3" />
              </div>
              <Input name="allergy" label="Any History of Allergy" />
              <Input name="maintenance" label="Maintenance Medications" />
              <TextArea name="management" label="Management:" rows={4} />
            </section>

            <div className="pt-4 pb-6 flex justify-center">
              <button type="submit" className="px-6 py-2 rounded-full bg-red-700 text-white font-semibold shadow">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewBiteCaseForm;
