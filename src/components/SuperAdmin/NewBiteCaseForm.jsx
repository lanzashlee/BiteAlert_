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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-6">
          <h1 className="text-2xl font-bold">New Bite Case Form</h1>
          <p className="text-sm text-blue-100">Step {step} of {steps.length}</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-b">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center relative">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  step >= s.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.id}
              </div>
              <div className="absolute top-1/2 left-8 right-[-50%] -translate-y-1/2 h-1 bg-gray-200 z-0">
                {step > s.id && (
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 w-full transition-all"></div>
                )}
              </div>
              <p
                className={`ml-3 text-sm font-medium ${
                  step >= s.id ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Patient Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleChange}
                    className={`mt-1 w-full border rounded-lg p-2.5 text-sm ${
                      errors.patientName
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
                    }`}
                  />
                  {errors.patientName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.patientName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className={`mt-1 w-full border rounded-lg p-2.5 text-sm ${
                      errors.age
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
                    }`}
                  />
                  {errors.age && (
                    <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className={`mt-1 w-full border rounded-lg p-2.5 text-sm ${
                    errors.contactNumber
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-300"
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
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Bite Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bite Location on Body
                  </label>
                  <input
                    type="text"
                    name="biteLocation"
                    value={form.biteLocation}
                    onChange={handleChange}
                    className={`mt-1 w-full border rounded-lg p-2.5 text-sm ${
                      errors.biteLocation
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
                    }`}
                  />
                  {errors.biteLocation && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.biteLocation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Animal Type
                  </label>
                  <input
                    type="text"
                    name="animalType"
                    value={form.animalType}
                    onChange={handleChange}
                    className={`mt-1 w-full border rounded-lg p-2.5 text-sm ${
                      errors.animalType
                        ? "border-red-500 focus:ring-red-300"
                        : "border-gray-300 focus:ring-blue-300"
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
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Additional Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={`mt-1 w-full border rounded-lg p-2.5 text-sm h-24 ${
                    errors.description
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-300"
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
                className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
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
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
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
