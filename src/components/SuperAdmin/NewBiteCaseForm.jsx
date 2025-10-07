import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import './NewBiteCaseForm.css';

// -------------------- Reusable Components --------------------
const CheckboxGroup = ({ options, selected, onChange, label }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {options.map(opt => (
        <label key={opt} className="flex items-center p-2 bg-white border rounded cursor-pointer hover:border-blue-400">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={e => onChange(opt, e.target.checked)}
            className="mr-2"
          />
          {opt}
        </label>
      ))}
    </div>
  </div>
);

const InputField = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="input-field"
  />
);

const SelectField = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={e => onChange(e.target.value)} className="input-field">
    <option value="">{placeholder}</option>
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

// -------------------- Form Sections --------------------

// Patient Information
const PatientInfo = ({ formData, onChange }) => (
  <div className="form-section section-blue">
    <h3 className="section-title">Patient Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <InputField value={formData.firstName} onChange={val => onChange('firstName', val)} placeholder="First Name *" />
      <InputField value={formData.middleName} onChange={val => onChange('middleName', val)} placeholder="Middle Name" />
      <InputField value={formData.lastName} onChange={val => onChange('lastName', val)} placeholder="Last Name *" />
      <InputField type="date" value={formData.birthdate} onChange={val => onChange('birthdate', val)} />
      <SelectField value={formData.sex} onChange={val => onChange('sex', val)} options={['Male', 'Female']} placeholder="Select Sex *" />
      <InputField value={formData.age} onChange={val => onChange('age', val)} placeholder="Age" />
      <InputField value={formData.contactNo} onChange={val => onChange('contactNo', val)} placeholder="Contact Number" />
    </div>
  </div>
);

// Address Information
const AddressInfo = ({ formData, onChange }) => (
  <div className="form-section section-green">
    <h3 className="section-title">Address Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <InputField value={formData.houseNo} onChange={val => onChange('houseNo', val)} placeholder="House No." />
      <InputField value={formData.street} onChange={val => onChange('street', val)} placeholder="Street" />
      <InputField value={formData.barangay} onChange={val => onChange('barangay', val)} placeholder="Barangay *" />
      <InputField value={formData.city} onChange={val => onChange('city', val)} placeholder="City *" />
      <InputField value={formData.province} onChange={val => onChange('province', val)} placeholder="Province *" />
      <InputField value={formData.zipCode} onChange={val => onChange('zipCode', val)} placeholder="Zip Code" />
    </div>
  </div>
);

// Bite Information
const BiteInfo = ({ formData, onArrayChange }) => (
  <div className="form-section section-red">
    <h3 className="section-title">Bite Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField type="date" value={formData.dateOfInquiry} onChange={val => onArrayChange('dateOfInquiry', val, true)} />
      <SelectField value={formData.timeOfInjury} onChange={val => onArrayChange('timeOfInjury', val, true)} options={['AM', 'PM']} placeholder="Select Time of Injury" />
    </div>
    <CheckboxGroup label="Type of Exposure" options={['BITE', 'NON-BITE']} selected={formData.typeOfExposure} onChange={(val, checked) => onArrayChange('typeOfExposure', val, checked)} />
    <CheckboxGroup label="Site of Bite *" options={['Head','Face','Neck','Chest','Back','Abdomen','Upper Extremities','Lower Extremities']} selected={formData.siteOfBite} onChange={(val, checked) => onArrayChange('siteOfBite', val, checked)} />
    <CheckboxGroup label="Nature of Injury *" options={['Multiple Injuries','Abrasion','Avulsion','Burn','Concussion','Contusion','Open Wound','Trauma']} selected={formData.natureOfInjury} onChange={(val, checked) => onArrayChange('natureOfInjury', val, checked)} />
  </div>
);

// Animal Profile
const AnimalProfile = ({ animalProfile, onChange }) => (
  <div className="form-section section-yellow">
    <h3 className="section-title">Animal Profile</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField value={animalProfile.species} onChange={val => onChange('species', val)} options={['Dog','Cat','Other']} placeholder="Animal Species *" />
      <SelectField value={animalProfile.vaccinationStatus} onChange={val => onChange('vaccinationStatus', val)} options={['Vaccinated','Not Vaccinated','Unknown']} placeholder="Vaccination Status *" />
      <SelectField value={animalProfile.owner} onChange={val => onChange('owner', val)} options={['Known','Unknown']} placeholder="Owner *" />
    </div>
  </div>
);

// Management & Treatment
const ManagementForm = ({ management, onChangeArray }) => (
  <div className="form-section section-purple">
    <h3 className="section-title">Management & Treatment</h3>
    <CheckboxGroup label="Diagnosis" options={['Rabies','Tetanus','Other']} selected={management.diagnosis} onChange={(val, checked) => onChangeArray('diagnosis', val, checked)} />
    <CheckboxGroup label="Treatment Given" options={['Anti-rabies Vaccine','Tetanus Toxoid','Wound Care','Others']} selected={management.treatment} onChange={(val, checked) => onChangeArray('treatment', val, checked)} />
    <InputField value={management.notes} onChange={val => onChangeArray('notes', val, true)} placeholder="Additional Notes" />
  </div>
);

// Vaccination
const VaccinationForm = ({ vaccination, onChangeArray }) => (
  <div className="form-section section-teal">
    <h3 className="section-title">Vaccination</h3>
    <CheckboxGroup label="Vaccine Type" options={['ARV','TT','Other']} selected={vaccination.vaccineType} onChange={(val, checked) => onChangeArray('vaccineType', val, checked)} />
    <InputField type="date" value={vaccination.dateGiven} onChange={val => onChangeArray('dateGiven', val, true)} placeholder="Date Given" />
    <InputField value={vaccination.notes} onChange={val => onChangeArray('notes', val, true)} placeholder="Notes" />
  </div>
);

// -------------------- Main Form Component --------------------
const NewBiteCaseForm = ({ selectedPatient, onSaved, onCancel }) => {
  const [formData, setFormData] = useState({
    // Patient Info
    firstName: '', middleName: '', lastName: '', birthdate: '', sex: '', age: '', contactNo: '',
    // Address Info
    houseNo: '', street: '', barangay: '', city: '', province: '', zipCode: '',
    // Bite Info
    dateOfInquiry: new Date().toISOString().split('T')[0], timeOfInjury: 'AM',
    typeOfExposure: ['BITE'], siteOfBite: [], natureOfInjury: [],
    // Animal Profile
    animalProfile: { species:'', vaccinationStatus:'', owner:'' },
    // Management
    management: { diagnosis:[], treatment:[], notes:'' },
    // Vaccination
    vaccination: { vaccineType:[], dateGiven:'', notes:'' }
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load patient info
  useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({
        ...prev,
        firstName: selectedPatient.firstName || '',
        lastName: selectedPatient.lastName || '',
        middleName: selectedPatient.middleName || '',
        birthdate: selectedPatient.birthdate || '',
        sex: selectedPatient.sex || '',
        age: selectedPatient.age || '',
        contactNo: selectedPatient.phone || '',
        houseNo: selectedPatient.houseNo || '',
        street: selectedPatient.street || '',
        barangay: selectedPatient.barangay || '',
        city: selectedPatient.city || '',
        province: selectedPatient.province || '',
        zipCode: selectedPatient.zipCode || ''
      }));
    }
  }, [selectedPatient]);

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleNestedChange = (section, field, value) => setFormData(prev => ({
    ...prev,
    [section]: { ...prev[section], [field]: value }
  }));

  const handleArrayChange = (sectionOrField, value, checked) => {
    if (typeof formData[sectionOrField] === 'undefined') return;
    const target = formData[sectionOrField];
    if (Array.isArray(target)) {
      setFormData(prev => ({
        ...prev,
        [sectionOrField]: checked ? [...prev[sectionOrField], value] : prev[sectionOrField].filter(i => i !== value)
      }));
    } else { // Single value
      setFormData(prev => ({ ...prev, [sectionOrField]: value }));
    }
  };

  const handleSave = async () => {
    // Example validation
    if (!formData.firstName || !formData.lastName || !formData.sex) {
      setError('Please fill required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/bitecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (onSaved) onSaved(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-bite-case-form">
      {error && <div className="error-message">{error}</div>}

      <PatientInfo formData={formData} onChange={handleInputChange} />
      <AddressInfo formData={formData} onChange={handleInputChange} />
      <BiteInfo formData={formData} onArrayChange={handleArrayChange} />
      <AnimalProfile animalProfile={formData.animalProfile} onChange={(f, v) => handleNestedChange('animalProfile', f, v)} />
      <ManagementForm management={formData.management} onChangeArray={(f,v,c) => handleNestedChange('management', f, c ? [...formData.management[f], v] : formData.management[f].filter(i=>i!==v))} />
      <VaccinationForm vaccination={formData.vaccination} onChangeArray={(f,v,c) => handleNestedChange('vaccination', f, c ? [...formData.vaccination[f], v] : formData.vaccination[f].filter(i=>i!==v))} />

      <div className="flex justify-end mt-4 space-x-4">
        <button onClick={onCancel} className="btn-cancel">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-save">
          {saving ? 'Saving...' : 'Save Case'}
        </button>
      </div>
    </div>
  );
};

export default NewBiteCaseForm;
