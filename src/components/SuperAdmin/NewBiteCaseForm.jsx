import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import './NewBiteCaseForm.css';


const NewBiteCaseForm = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    patientName: "",
    age: "",
    contactNumber: "",
    address: "",
    biteLocation: "",
    animalType: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, label: "Patient Info" },
    { id: 2, label: "Bite Details" },
    { id: 3, label: "Additional Info" },
  ];

  const validate = () => {
    let newErrors = {};
    Object.keys(form).forEach((key) => {
      if (!form[key]) newErrors[key] = "This field is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const nextStep = () => {
    if (validate()) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      alert("✅ Form submitted successfully!");
      console.log(form);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-red-500 to-fuchsia-600 text-white text-center py-7">
          <h1 className="text-3xl font-extrabold tracking-tight">New Bite Case Form</h1>
          <p className="text-[13px] text-white/80 mt-1">Step {step} of {steps.length}</p>
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-5 text-slate-800">
                Patient Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleChange}
                    placeholder="Juan Dela Cruz"
                    className={`mt-1 w-full border rounded-xl p-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-4 transition ${
                      errors.patientName
                        ? "border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:ring-blue-100"
                    }`}
                  />
                  {errors.patientName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.patientName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="25"
                    className={`mt-1 w-full border rounded-xl p-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-4 transition ${
                      errors.age
                        ? "border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:ring-blue-100"
                    }`}
                  />
                  {errors.age && (
                    <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="09XXXXXXXXX"
                  className={`mt-1 w-full border rounded-xl p-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-4 transition ${
                    errors.contactNumber
                      ? "border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:ring-blue-100"
                  }`}
                />
                {errors.contactNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contactNumber}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-5 text-slate-800">
                Bite Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Bite Location on Body
                  </label>
                  <input
                    type="text"
                    name="biteLocation"
                    value={form.biteLocation}
                    onChange={handleChange}
                    placeholder="Right forearm"
                    className={`mt-1 w-full border rounded-xl p-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-4 transition ${
                      errors.biteLocation
                        ? "border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:ring-blue-100"
                    }`}
                  />
                  {errors.biteLocation && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.biteLocation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Animal Type
                  </label>
                  <input
                    type="text"
                    name="animalType"
                    value={form.animalType}
                    onChange={handleChange}
                    placeholder="Dog / Cat / Others"
                    className={`mt-1 w-full border rounded-xl p-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-4 transition ${
                      errors.animalType
                        ? "border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:ring-blue-100"
                    }`}
                  />
                  {errors.animalType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.animalType}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-5 text-slate-800">
                Additional Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief description of the incident"
                  className={`mt-1 w-full border rounded-xl p-3 text-sm h-28 bg-white shadow-sm focus:outline-none focus:ring-4 transition ${
                    errors.description
                      ? "border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:ring-blue-100"
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition"
              >
                Previous
              </button>
            ) : (
              <div></div>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-fuchsia-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg shadow hover:bg-emerald-700 transition"
              >
                Submit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBiteCaseForm;
