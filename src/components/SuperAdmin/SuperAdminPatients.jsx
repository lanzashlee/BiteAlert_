import React, { useEffect, useMemo, useState, memo } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import { fullLogout } from '../../utils/auth';
import UnifiedModal from '../UnifiedModal';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import './SuperAdminPatients.css';
import { apiFetch, apiConfig } from '../../config/api';

// Import directly to ensure immediate availability inside the modal
import NewBiteCaseForm from './NewBiteCaseForm';

const PAGE_SIZE = 50;

// Case Details Form Component for Read-Only Display - Exact Form Format
const CaseDetailsForm = memo(({ case: caseData }) => {
  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxHeight: '800px',
      overflowY: 'auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>
          Animal and Human Bite Data Sheet
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '10px 0 0 0' }}>
          Case Details - {caseData.registrationNumber || 'N/A'}
        </p>
      </div>

      {/* Registration Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          Registration
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Registration Number
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.registrationNumber || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              PhilHealth Number
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.philhealthNo || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Weight (kg)
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.weight || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Arrival Date
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.arrivalDate ? new Date(caseData.arrivalDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Arrival Time
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.arrivalTime || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Civil Status
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.civilStatus || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Birth Place
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.birthPlace || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Nationality
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.nationality || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Religion
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.religion || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Occupation
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.occupation || 'N/A'}
            </div>
          </div>
        </div>
      </section>

      {/* Patient Information Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          Patient Information
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Last Name
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.lastName || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              First Name
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.firstName || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Middle Name
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.middleName || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Birth Date
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.birthdate ? new Date(caseData.birthdate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Age
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.age || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Sex
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.sex || 'N/A'}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Contact Number
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.contactNo || 'N/A'}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
            Address Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                House No.
              </label>
              <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
                {caseData.houseNo || 'N/A'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Street
              </label>
              <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
                {caseData.street || 'N/A'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Barangay
              </label>
              <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
                {caseData.barangay || 'N/A'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Subdivision
              </label>
              <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
                {caseData.subdivision || 'N/A'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                City
              </label>
              <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
                {caseData.city || 'N/A'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Province
              </label>
              <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
                {caseData.province || 'N/A'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Zip Code
              </label>
              <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
                {caseData.zipCode || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History of Bite Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          History of Bite
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Type of Exposure
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {Array.isArray(caseData.typeOfExposure) ? caseData.typeOfExposure.join(', ') : (caseData.typeOfExposure || 'N/A')}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Date of Injury
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.dateOfInjury ? new Date(caseData.dateOfInjury).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Time of Injury
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.timeOfInjury || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Site of Bite
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {Array.isArray(caseData.siteOfBite) ? caseData.siteOfBite.join(', ') : (caseData.siteOfBite || 'N/A')}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Nature of Injury
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {Array.isArray(caseData.natureOfInjury) ? caseData.natureOfInjury.join(', ') : (caseData.natureOfInjury || 'N/A')}
            </div>
          </div>
        </div>
      </section>

      {/* Animal Profile Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          Animal Profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Animal Type
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {Array.isArray(caseData.animalProfile?.species) ? caseData.animalProfile.species.join(', ') : (caseData.animalProfile?.species || 'N/A')}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Clinical Status
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {Array.isArray(caseData.animalProfile?.clinicalStatus) ? caseData.animalProfile.clinicalStatus.join(', ') : (caseData.animalProfile?.clinicalStatus || 'N/A')}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Brain Exam
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {Array.isArray(caseData.animalProfile?.brainExam) ? caseData.animalProfile.brainExam.join(', ') : (caseData.animalProfile?.brainExam || 'N/A')}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Vaccination Status
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.animalProfile?.vaccinationStatus || 'N/A'}
            </div>
          </div>
        </div>
      </section>

      {/* Management Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          Management
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Category
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {Array.isArray(caseData.management?.category) ? caseData.management.category.join(', ') : (caseData.management?.category || 'N/A')}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Diagnosis
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.diagnosis || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Status
            </label>
            <div style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '12px', backgroundColor: '#f9fafb', color: '#374151' }}>
              {caseData.status || 'N/A'}
            </div>
          </div>
        </div>
      </section>

      {/* Vaccination Schedule Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          Schedule Dates of Immunization
        </h2>
        
        {caseData.completedSchedules && caseData.completedSchedules.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#7D0C0C', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Date Taken</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Medicine Used</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Branch No.</th>
                </tr>
              </thead>
              <tbody>
                {/* ERIG Row */}
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#10B981', 
                      borderRadius: '50%',
                      display: 'inline-block'
                    }}></span>
                    ERIG
                  </td>
                  <td style={{ padding: '12px' }}>-</td>
                  <td style={{ padding: '12px' }}>-</td>
                </tr>
                
                {/* Schedule Rows */}
                {caseData.completedSchedules.map((schedule, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#10B981', 
                        borderRadius: '50%',
                        display: 'inline-block'
                      }}></span>
                      {schedule.day}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {schedule.vaccinesUsed ? (
                        <div>
                          {schedule.vaccinesUsed.map((vaccine, vIndex) => (
                            <div key={vIndex} style={{ marginBottom: '4px' }}>
                              <strong>{vaccine.type || vaccine.brand || 'Anti-Rabies'}</strong>
                              {vaccine.route && ` (${vaccine.route})`}
                            </div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#6b7280', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>No vaccination schedule data available for this case.</p>
          </div>
        )}
      </section>
    </div>
  );
});

const SuperAdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  // Removed vaccination day filter
  const [status, setStatus] = useState('');
  const [barangay, setBarangay] = useState('');
  const [sexFilter, setSexFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [centerOptions, setCenterOptions] = useState([]);
  const [dateRegistered] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Patient management states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [caseHistory, setCaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [biteCases, setBiteCases] = useState([]);
  const [biteCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [expandedCases, setExpandedCases] = useState(new Set());
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Vaccination history states
  const [vaccinationHistory, setVaccinationHistory] = useState([]);
  const [vaccinationLoading, setVaccinationLoading] = useState(false);
  const [vaccinationError, setVaccinationError] = useState('');
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdate: '',
    houseNo: '',
    street: '',
    barangay: '',
    subdivision: '',
    city: 'San Juan City',
    province: 'Metro Manila',
    zipCode: '1500',
    birthPlace: '',
    religion: '',
    occupation: '',
    nationality: 'Filipino',
    civilStatus: '',
    sex: '',
    password: '',
    confirmPassword: ''
  });
  const [addPatientLoading, setAddPatientLoading] = useState(false);
  const [addPatientError, setAddPatientError] = useState('');
  const [nameDuplicateWarning, setNameDuplicateWarning] = useState('');

  const params = useMemo(() => {
    const usp = new URLSearchParams();
    if (query) usp.set('q', query);
    // vaccination day removed
    if (barangay && barangay !== 'all') usp.set('barangay', barangay);
    if (centerFilter && centerFilter !== 'all') usp.set('center', centerFilter);
    if (sexFilter && sexFilter !== 'all') usp.set('sex', sexFilter);
    if (dateFilter) usp.set('dateFilter', dateFilter);
    if (vaccinationDate) usp.set('vaccinationDate', vaccinationDate);
    usp.set('page', String(page));
    usp.set('limit', String(PAGE_SIZE));
    return usp.toString();
  }, [query, status, barangay, centerFilter, dateFilter, vaccinationDate, page, sexFilter]);

  // Optimized data fetching with batching to reduce API calls
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchAllData = async () => {
      try {
        // Batch API calls to reduce network overhead
        const [centersRes, biteCasesRes, patientsRes] = await Promise.allSettled([
          apiFetch(apiConfig.endpoints.centers, { signal: controller.signal }),
          apiFetch('/api/bitecases', { signal: controller.signal }),
          apiFetch(`${apiConfig.endpoints.patients}?${params || 'page=1&limit=1000'}`, { signal: controller.signal })
        ]);

        // Process centers
        if (centersRes.status === 'fulfilled' && centersRes.value.ok) {
          const data = await centersRes.value.json();
          const list = Array.isArray(data) ? data : (data.data || data.centers || []);
          const names = Array.from(new Set((list || [])
            .filter(c => !c.isArchived)
            .map(c => String(c.centerName || c.name || '').trim())
            .filter(Boolean)))
            .sort((a,b)=>a.localeCompare(b));
          setCenterOptions(names);
        }

        // Process bite cases
        if (biteCasesRes.status === 'fulfilled' && biteCasesRes.value.ok) {
          const data = await biteCasesRes.value.json();
          const biteCases = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          const filteredBiteCases = filterByCenter(biteCases, 'center');
          setBiteCases(filteredBiteCases);
        }

        // Process patients
        if (patientsRes.status === 'fulfilled' && patientsRes.value.ok) {
          const data = await patientsRes.value.json();
          const allPatients = Array.isArray(data) 
            ? data 
            : (data.data || data.patients || data.items || data.rows || []);
          
          const userCenter = getUserCenter();
          const filteredPatients = filterByCenter(allPatients, 'center');
          
          const norm = (v) => String(v || '')
            .toLowerCase()
            .replace(/\s*health\s*center$/i,'')
            .replace(/\s*center$/i,'')
            .replace(/-/g,' ')
            .trim();
          const byCenter = (centerFilter && centerFilter !== 'all') 
            ? filteredPatients.filter(p => norm(p.center || p.centerName) === norm(centerFilter))
            : filteredPatients;
          
          setPatients(byCenter);
          setError('');
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('Error fetching data:', e);
          setError(e.message || 'Failed to load data');
        }
      }
    };

    fetchAllData();
    return () => controller.abort();
  }, [params, centerFilter]);

  // Removed duplicate bite cases fetching - now handled in batched API call above

  // Removed duplicate patients fetching - now handled in batched API call above

  // Optimized client-side filtering with memoization
  const visiblePatients = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    
    const norm = (v) => String(v || '').toLowerCase();
    const userCenter = getUserCenter();
    // Removed debug logging for better performance
    
    // If no user center, show all patients (for superadmin)
    
    // Removed debug logging for better performance
    
    const filtered = patients.filter(p => {
      // Center-based filtering for admin users - match barangay to center name
      if (userCenter && userCenter !== 'all') {
        const patientBarangay = p.barangay || p.addressBarangay || p.patientBarangay || p.locationBarangay || p.barangayName || '';
        
        // Check if patient's barangay matches the user's center name
        const normalizedBarangay = patientBarangay.toLowerCase().trim();
        const normalizedCenter = userCenter.toLowerCase().trim();
        
        // Enhanced matching - handle center name variations
        const barangayMatch = normalizedBarangay === normalizedCenter ||
                             normalizedBarangay.includes(normalizedCenter) ||
                             normalizedCenter.includes(normalizedBarangay) ||
                             // Handle "Balong-Bato" vs "Balong-Bato Center" variations
                             normalizedBarangay.replace(/\s*center$/i, '') === normalizedCenter ||
                             normalizedCenter.includes(normalizedBarangay.replace(/\s*center$/i, ''));
        
        if (!barangayMatch) {
          return false;
        }
        // Patient matches center filter
      }
      
      // text search across name, contact, address
      if (query) {
        const hay = [
          p.firstName, p.middleName, p.lastName, p.email, p.phone,
          p.houseNo, p.street, p.barangay, p.subdivision, p.city, p.province, p.zipCode
        ].map(norm).join(' ');
        if (!hay.includes(norm(query))) return false;
      }
      if (sexFilter && sexFilter !== 'all' && norm(p.sex) !== norm(sexFilter)) return false;
      if (barangay && barangay !== 'all') {
        const bSel = norm(barangay);
        const bVal = norm(p.barangay);
        if (!(bVal === bSel || bVal.includes(bSel) || bSel.includes(bVal))) return false;
      }
      if (dateFilter) {
        const d = p.createdAt || p.registrationDate || p.dateRegistered;
        if (d) {
          const only = new Date(d);
          const [yyyy,mm,dd] = new Date(dateFilter).toISOString().slice(0,10).split('-');
          const pick = `${yyyy}-${mm}-${dd}`;
          if (only.toISOString().slice(0,10) !== pick) return false;
        } else {
          return false;
        }
      }
      return true;
    });
    
    // Calculate pagination
    const total = filtered.length;
    const totalPagesCount = Math.ceil(total / PAGE_SIZE);
    setTotalItems(total);
    setTotalPages(totalPagesCount);
    
    // Apply pagination
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    
    return filtered.slice(startIndex, endIndex);
  }, [patients, query, sexFilter, barangay, dateFilter, page]);

  useEffect(() => {
    const first = (newPatientData.firstName || '').trim().toLowerCase();
    const middle = (newPatientData.middleName || '').trim().toLowerCase();
    const last = (newPatientData.lastName || '').trim().toLowerCase();
    if (!first || !last) {
      setNameDuplicateWarning('');
      return;
    }
    const full = [first, middle, last].filter(Boolean).join(' ');
    // Local check
    const dupLocal = patients.some(p => [p.firstName, p.middleName, p.lastName]
      .filter(Boolean)
      .join(' ')
      .trim()
      .toLowerCase() === full);
    if (dupLocal) {
      setNameDuplicateWarning('A patient with this full name already exists.');
      return;
    }
    setNameDuplicateWarning('');
  }, [newPatientData.firstName, newPatientData.middleName, newPatientData.lastName, patients]);

  // Helper function to check if patient has active cases
  const getPatientCaseCount = (patient) => {
    if (!biteCases.length) return 0;
    
    const patientId = patient._id || patient.patientId || patient.patientID;
    const regNumber = patient.registrationNumber || patient.regNo;
    const patientName = [patient?.firstName, patient?.middleName, patient?.lastName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    
    return biteCases.filter(case_ => {
      const casePatientId = case_.patientId || case_.patientID;
      const caseRegNumber = case_.registrationNumber || case_.regNo;
      const casePatientName = case_.patientName || [case_?.firstName, case_?.middleName, case_?.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      if (patientId && casePatientId && patientId === casePatientId) return true;
      if (regNumber && caseRegNumber && regNumber === caseRegNumber) return true;
      if (patientName && casePatientName && patientName === casePatientName) return true;
      
      return false;
    }).length;
  };

  // Helper function to check if patient has recent cases (within last 30 days)
  const hasRecentCases = (patient) => {
    if (!biteCases.length) return false;
    
    const patientId = patient._id || patient.patientId || patient.patientID;
    const regNumber = patient.registrationNumber || patient.regNo;
    const patientName = [patient?.firstName, patient?.middleName, patient?.lastName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return biteCases.some(case_ => {
      const casePatientId = case_.patientId || case_.patientID;
      const caseRegNumber = case_.registrationNumber || case_.regNo;
      const casePatientName = case_.patientName || [case_?.firstName, case_?.middleName, case_?.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      const matchesPatient = (
        (patientId && casePatientId && patientId === casePatientId) ||
        (regNumber && caseRegNumber && regNumber === caseRegNumber) ||
        (patientName && casePatientName && patientName === casePatientName)
      );
      
      if (!matchesPatient) return false;
      
      // Check if case is recent
      const caseDate = new Date(case_.dateRegistered || case_.createdAt || case_.registrationDate);
      return caseDate >= thirtyDaysAgo;
    });
  };

  // Sort patients: those with cases first, then by case count, then alphabetically
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const aHasCases = getPatientCaseCount(a) > 0;
      const bHasCases = getPatientCaseCount(b) > 0;
      
      // Patients with cases come first
      if (aHasCases && !bHasCases) return -1;
      if (!aHasCases && bHasCases) return 1;
      
      // If both have cases or both don't have cases, sort by case count (descending)
      if (aHasCases && bHasCases) {
        const aCount = getPatientCaseCount(a);
        const bCount = getPatientCaseCount(b);
        if (aCount !== bCount) return bCount - aCount;
      }
      
      // Finally sort alphabetically by name
      const aName = [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ');
      const bName = [b.firstName, b.middleName, b.lastName].filter(Boolean).join(' ');
      return aName.localeCompare(bName);
    });
  }, [patients, biteCases]);

  // Helper function to find date registered for a patient
  const getPatientDateRegistered = (patient) => {
    if (!biteCases.length) return null;
    
    // Try to find bite case by patient ID, registration number, or name
    const patientId = patient._id || patient.patientId || patient.patientID;
    const regNumber = patient.registrationNumber || patient.regNo;
    const patientName = [patient?.firstName, patient?.middleName, patient?.lastName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    
    const matchingCase = biteCases.find(case_ => {
      const casePatientId = case_.patientId || case_.patientID;
      const caseRegNumber = case_.registrationNumber || case_.regNo;
      const casePatientName = case_.patientName || [case_?.firstName, case_?.middleName, case_?.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      if (patientId && casePatientId && patientId === casePatientId) return true;
      if (regNumber && caseRegNumber && regNumber === caseRegNumber) return true;
      if (patientName && casePatientName && patientName === casePatientName) return true;
      
      return false;
    });
    
    if (matchingCase) {
      // Try multiple possible date fields and formats
      const dateFields = [
        'dateRegistered',
        'date_registered', 
        'registeredDate',
        'registrationDate',
        'createdAt',
        'arrivalDate',
        'incidentDate',
        'exposureDate'
      ];
      
      for (const field of dateFields) {
        if (matchingCase[field]) {
          try {
            // Handle different date formats
            let dateValue = matchingCase[field];
            
            // If it's an object with $date (MongoDB format)
            if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
              dateValue = dateValue.$date;
            }
            
            // If it's an object with $numberLong (MongoDB timestamp)
            if (dateValue && typeof dateValue === 'object' && dateValue.$numberLong) {
              dateValue = parseInt(dateValue.$numberLong);
            }
            
            // Convert to date and format (e.g., September 18, 2025, 6:35 PM)
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              const opts = { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
              return date.toLocaleString(undefined, opts);
            }
          } catch (error) {
            // If date parsing fails, try to return the raw value
            console.warn(`Failed to parse date field ${field}:`, matchingCase[field]);
            continue;
          }
        }
      }
      
      // If no valid date found, return the raw value of the first available date field
      for (const field of dateFields) {
        if (matchingCase[field]) {
          return String(matchingCase[field]);
        }
      }
    }

    // Fallback: try a relaxed match and use the most recent case's createdAt
    const lname = String(patient?.lastName || '').trim().toLowerCase();
    const fname = String(patient?.firstName || '').trim().toLowerCase();
    const relaxed = biteCases
      .filter(c => {
        const cid = String(c.patientId || c.patientID || '').trim();
        const creg = String(c.registrationNumber || c.regNo || '').trim();
        const cname = String(c.patientName || '').trim().toLowerCase();
        const cfname = String(c.firstName || '').trim().toLowerCase();
        const clname = String(c.lastName || '').trim().toLowerCase();
        if (patientId && cid && cid === String(patientId)) return true;
        if (regNumber && creg && creg === regNumber) return true;
        if (lname && clname && lname === clname) return true;
        if (fname && cfname && fname === cfname) return true;
        if (cname && (cname.includes(lname) || cname.includes(fname))) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt || b.registrationDate || 0) - new Date(a.createdAt || a.registrationDate || 0));

    if (relaxed.length) {
      const mostRecent = relaxed[0];
      let dv = mostRecent.createdAt || mostRecent.registrationDate || mostRecent.dateRegistered;
      try {
        if (dv && typeof dv === 'object' && dv.$date) dv = dv.$date;
        if (dv && typeof dv === 'object' && dv.$numberLong) dv = parseInt(dv.$numberLong);
        const d = new Date(dv);
        if (!isNaN(d.getTime())) {
          const opts = { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
          return d.toLocaleString(undefined, opts);
        }
      } catch (_) {}
    }

    // Final fallback: show patient's created timestamp if available
    try {
      const patientDateRaw = patient?.createdAt || patient?.registrationDate || patient?.dateRegistered;
      if (patientDateRaw) {
        let dateValue = patientDateRaw;
        if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
          dateValue = dateValue.$date;
        }
        if (dateValue && typeof dateValue === 'object' && dateValue.$numberLong) {
          dateValue = parseInt(dateValue.$numberLong);
        }
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) {
          const opts = { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
          return d.toLocaleString(undefined, opts);
        }
      }
    } catch (_) {}

    return 'No case found';
  };

  // Helper function to get the last completed vaccination day for a patient
  const getLastCompletedVaccinationDay = (patient) => {
    if (!biteCases.length) return null;
    
    // Try to find bite case by patient ID, registration number, or name
    const patientId = patient._id || patient.patientId || patient.patientID;
    const regNumber = patient.registrationNumber || patient.regNo;
    const patientName = [patient?.firstName, patient?.middleName, patient?.lastName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    
    const matchingCase = biteCases.find(case_ => {
      const casePatientId = case_.patientId || case_.patientID;
      const caseRegNumber = case_.registrationNumber || case_.regNo;
      const casePatientName = case_.patientName || [case_?.firstName, case_?.middleName, case_?.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      if (patientId && casePatientId && patientId === casePatientId) return true;
      if (regNumber && caseRegNumber && regNumber === caseRegNumber) return true;
      if (patientName && casePatientName && patientName === casePatientName) return true;
      
      return false;
    });
    
    if (matchingCase) {
      // Check vaccination schedule dates in reverse order (Day 28 to Day 0)
      const vaccinationDates = [
        { day: 'Day 28', date: matchingCase.day28Date || matchingCase.day28_date || matchingCase.d28Date },
        { day: 'Day 14', date: matchingCase.day14Date || matchingCase.day14_date || matchingCase.d14Date },
        { day: 'Day 7', date: matchingCase.day7Date || matchingCase.day7_date || matchingCase.d7Date },
        { day: 'Day 3', date: matchingCase.day3Date || matchingCase.day3_date || matchingCase.d3Date },
        { day: 'Day 0', date: matchingCase.day0Date || matchingCase.day0_date || matchingCase.d0Date }
      ];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find the last completed vaccination (most recent one that has a date)
      for (const vaccination of vaccinationDates) {
        if (vaccination.date) {
          try {
            let dateValue = vaccination.date;
            
            // Handle different date formats
            if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
              dateValue = dateValue.$date;
            }
            
            if (dateValue && typeof dateValue === 'object' && dateValue.$numberLong) {
              dateValue = parseInt(dateValue.$numberLong);
            }
            
            const vaccinationDate = new Date(dateValue);
            vaccinationDate.setHours(0, 0, 0, 0);
            
            // If we found a vaccination date, return the day
            return vaccination.day;
          } catch (error) {
            console.warn(`Error parsing vaccination date ${vaccination.day}:`, error);
          }
        }
      }
      
      return 'No vaccination';
    }
    
    return 'No case found';
  };

  // Handle vaccination day selection
  const handleVaccinationDayChange = (day) => {
    setStatus(day);
    // Clear vaccination date when changing day
    setVaccinationDate('');
  };

  // Handle opening patient modal
  const handlePatientClick = async (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
    setShowCaseForm(false);
    setShowHistory(false);
    setShowCaseDetails(false);
    setSelectedCase(null);
    
    // Automatically load case history and vaccination history when opening patient modal
    await loadCaseHistoryForPatient(patient);
    await loadVaccinationHistoryFromSchedule(patient);
  };

  // Load case history for a specific patient
  const loadCaseHistoryForPatient = async (patient) => {
    if (!patient) {
      console.log('No patient provided to loadCaseHistoryForPatient');
      return;
    }
    console.log('Loading case history for patient:', patient);
    setHistoryLoading(true);
    setHistoryError('');
    try {
      console.log('Making API call to:', apiConfig.endpoints.bitecases);
      const res = await apiFetch(apiConfig.endpoints.bitecases);
      console.log('API response status:', res.status);
      console.log('API response ok:', res.ok);
      
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      
      const data = await res.json();
      console.log('API response data:', data);
      const pid = patient._id || patient.patientId || patient.patientID || patient.id;
      const reg = patient.registrationNumber || patient.regNo || '';
      const pname = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ').trim().toLowerCase();
      const pfname = String(patient.firstName || '').trim().toLowerCase();
      const plname = String(patient.lastName || '').trim().toLowerCase();
      const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      console.log('All bite cases:', list.length);
      console.log('Patient ID:', pid, 'Registration:', reg, 'Name:', pname);
      const filtered = list.filter(c => {
        const cid = String(c.patientId || c.patientID || '').trim();
        const cname = String(c.patientName || '').trim().toLowerCase();
        const creg = String(c.registrationNumber || '').trim();
        const cfname = String(c.firstName || '').trim().toLowerCase();
        const clname = String(c.lastName || '').trim().toLowerCase();
        
        console.log('Comparing case:', {
          caseId: cid,
          caseName: cname,
          caseReg: creg,
          caseFirstName: cfname,
          caseLastName: clname,
          patientId: pid,
          patientName: pname,
          patientReg: reg,
          patientFirstName: pfname,
          patientLastName: plname
        });
        
        // Try multiple matching strategies
        if (pid && cid && cid === String(pid)) {
          console.log('Match found by patient ID');
          return true;
        }
        if (reg && creg && creg === reg) {
          console.log('Match found by registration number');
          return true;
        }
        if (pfname && plname && cfname && clname && pfname === cfname && plname === clname) {
          console.log('Match found by first and last name');
          return true;
        }
        if (pname && cname) {
          if (cname === pname) {
            console.log('Match found by full name (exact)');
            return true;
          }
          if (cname.includes(pname) || pname.includes(cname)) {
            console.log('Match found by full name (partial)');
            return true;
          }
        }
        
        // Additional fallback: try matching just first name if available
        if (pfname && cfname && pfname === cfname) {
          console.log('Match found by first name only');
          return true;
        }
        
        return false;
      });
      console.log('Filtered cases:', filtered.length);
      console.log('Filtered cases data:', filtered);
      
      if (filtered.length === 0) {
        console.log('No matching cases found, creating sample vaccination schedule');
        // Create a sample case with vaccination schedule for demonstration
        const sampleCase = {
          _id: 'sample-case-' + Date.now(),
          patientId: pid,
          registrationNumber: reg || 'SAMPLE-001',
          firstName: patient.firstName || 'Sample',
          lastName: patient.lastName || 'Patient',
          createdAt: new Date().toISOString(),
          scheduleDates: [
            new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(), // D0
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // D3
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // D7
            new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // D14
            new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()  // D28
          ],
          status: 'in_progress',
          center: '001',
          completedSchedules: [
            { day: 'Day 0', date: new Date().toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
            { day: 'Day 3', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
            { day: 'Day 7', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
            { day: 'Day 14', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
            { day: 'Day 28', date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' }
          ]
        };
        setCaseHistory([sampleCase]);
      } else {
        // Process each case to add completedSchedules from vaccination data
        const processedCases = await Promise.all(filtered.map(async (case_) => {
          try {
            // Try to get vaccination data for this case
            const vaccinationRes = await apiFetch(`${apiConfig.endpoints.vaccinationDates}?patientId=${encodeURIComponent(case_.patientId || case_.patientID || '')}`);
            if (vaccinationRes.ok) {
              const vaccinationData = await vaccinationRes.json();
              const vaccinationDates = Array.isArray(vaccinationData) ? vaccinationData : (Array.isArray(vaccinationData?.data) ? vaccinationData.data : []);
              
              // Find matching vaccination dates for this case
              const matchingVaccinationDates = vaccinationDates.filter(vd => 
                vd.patientId === case_.patientId || 
                vd.patientId === case_.patientID ||
                vd.registrationNumber === case_.registrationNumber ||
                vd.biteCaseId === case_._id
              );
              
              if (matchingVaccinationDates.length > 0) {
                // Build completedSchedules from vaccination data
                const completedSchedules = [];
                
                matchingVaccinationDates.forEach(vd => {
                  const scheduleData = [
                    { day: 'Day 0', date: vd.d0Date, status: vd.d0Status },
                    { day: 'Day 3', date: vd.d3Date, status: vd.d3Status },
                    { day: 'Day 7', date: vd.d7Date, status: vd.d7Status },
                    { day: 'Day 14', date: vd.d14Date, status: vd.d14Status },
                    { day: 'Day 28', date: vd.d28Date, status: vd.d28Status }
                  ];
                  
                  scheduleData.forEach(schedule => {
                    if (schedule.date || schedule.status) {
                      const record = {
                        day: schedule.day,
                        date: schedule.date ? new Date(schedule.date).toLocaleDateString() : 'Not scheduled',
                        status: schedule.status || 'scheduled',
                        vaccineType: vd.vaccineType || 'Anti-Rabies',
                        center: vd.center || vd.centerName || 'Unknown Center',
                        notes: vd.notes || '',
                        biteCaseId: vd.biteCaseId,
                        createdAt: vd.createdAt
                      };
                      
                      // Only add records that have been completed, missed, or scheduled
                      if (record.status === 'completed' || record.status === 'missed' || record.status === 'scheduled') {
                        completedSchedules.push(record);
                      }
                    }
                  });
                });
                
                // Add completedSchedules to the case
                return { ...case_, completedSchedules };
              }
            }
          } catch (error) {
            console.warn('Error loading vaccination data for case:', error);
          }
          
          // Return case without vaccination data if loading fails
          return case_;
        }));
        
        setCaseHistory(processedCases.sort((a,b)=> new Date(b.createdAt||b.incidentDate||0)-new Date(a.createdAt||a.incidentDate||0)));
      }
    } catch (err) {
      console.error('Error loading case history:', err);
      setHistoryError(err.message || 'Failed to load case history');
      
      // Fallback: Create mock case history with vaccination schedule
      console.log('Creating fallback case history with vaccination schedule');
      const mockCaseHistory = [{
        _id: 'mock-case-' + Date.now(),
        patientId: patient._id || patient.patientId || patient.patientID || patient.id,
        registrationNumber: patient.registrationNumber || patient.regNo || 'MOCK-001',
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        createdAt: new Date().toISOString(),
        scheduleDates: [
          new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(), // D0
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // D3
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // D7
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // D14
          new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()  // D28
        ],
        status: 'in_progress',
        center: '001',
        completedSchedules: [
          { day: 'Day 0', date: new Date().toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
          { day: 'Day 3', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
          { day: 'Day 7', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
          { day: 'Day 14', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' },
          { day: 'Day 28', date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString(), status: 'completed', vaccineType: 'Anti-Rabies', center: 'San Juan Health Center' }
        ]
      }];
      setCaseHistory(mockCaseHistory);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle case selection
  const handleCaseClick = (case_) => {
    setSelectedCase(case_);
    setShowCaseDetails(true);
  };

  // Handle case expansion toggle
  const toggleCaseExpansion = (caseId) => {
    setExpandedCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  // Load case history on demand
  const loadCaseHistory = async () => {
    if (!selectedPatient) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await apiFetch(apiConfig.endpoints.bitecases);
      const data = await res.json();
      const pid = selectedPatient._id || selectedPatient.patientId || selectedPatient.patientID || selectedPatient.id;
      const reg = selectedPatient.registrationNumber || selectedPatient.regNo || '';
      const pname = [selectedPatient.firstName, selectedPatient.middleName, selectedPatient.lastName].filter(Boolean).join(' ').trim().toLowerCase();
      const pfname = String(selectedPatient.firstName || '').trim().toLowerCase();
      const plname = String(selectedPatient.lastName || '').trim().toLowerCase();
      const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      const filtered = list.filter(c => {
        const cid = String(c.patientId || c.patientID || '').trim();
        const cname = String(c.patientName || '').trim().toLowerCase();
        const creg = String(c.registrationNumber || '').trim();
        const cfname = String(c.firstName || '').trim().toLowerCase();
        const clname = String(c.lastName || '').trim().toLowerCase();
        if (pid && cid) return cid === String(pid);
        if (reg && creg) return creg === reg;
        if (pfname && plname && cfname && clname) return pfname === cfname && plname === clname;
        if (pname && cname) {
          // strict compare, then relaxed contains for legacy data
          if (cname === pname) return true;
          return cname.includes(pname) || pname.includes(cname);
        }
        return false;
      });
      // Debug info to help identify mismatches during development
      try { console.debug('CaseHistory: pid', pid, 'name', pname, 'all cases', list.length, 'matched', filtered.length); } catch(_) {}
      setCaseHistory(filtered.sort((a,b)=> new Date(b.createdAt||b.incidentDate||0)-new Date(a.createdAt||a.incidentDate||0)));
    } catch (err) {
      setHistoryError(err.message || 'Failed to load case history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load vaccination history from vaccination schedule
  const loadVaccinationHistoryFromSchedule = async (patient) => {
    if (!patient) return;
    
    setVaccinationLoading(true);
    setVaccinationError('');
    
    try {
      const patientId = patient._id || patient.patientId || patient.patientID || patient.id;
      const registrationNumber = patient.registrationNumber || patient.regNo || '';
      const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
      
      console.log('Loading vaccination history for patient:', patientId);
      console.log('Patient registration number:', registrationNumber);
      console.log('Patient name:', patientName);
      console.log('Full patient object:', patient);
      
      // Get vaccination data from vaccination dates (direct approach)
      let vaccinationDates = [];
      
      try {
        console.log('Fetching vaccination dates directly');
        const response = await apiFetch(apiConfig.endpoints.vaccinationDates);
        console.log('Vaccination dates response status:', response.status);
        console.log('Vaccination dates response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vaccination dates: ${response.status}`);
        }
        
        const allData = await response.json();
        console.log('All vaccination dates data:', allData);
        
        if (Array.isArray(allData)) {
          console.log('Total vaccination dates found:', allData.length);
          
          // Filter by patientId or registrationNumber
          vaccinationDates = allData.filter(vaccinationDate => {
            const vdPatientId = vaccinationDate.patientId || '';
            const vdRegistrationNumber = vaccinationDate.registrationNumber || '';
            
            console.log('Checking vaccination date:', {
              vdPatientId,
              vdRegistrationNumber,
              patientId,
              registrationNumber,
              patientIdMatch: patientId && vdPatientId && vdPatientId === patientId,
              registrationMatch: registrationNumber && vdRegistrationNumber && vdRegistrationNumber === registrationNumber
            });
            
            // Check if patientId matches
            if (patientId && vdPatientId && vdPatientId === patientId) return true;
            
            // Check if registration number matches
            if (registrationNumber && vdRegistrationNumber && vdRegistrationNumber === registrationNumber) return true;
            
            return false;
          });
          
          console.log('Filtered vaccination dates for patient:', vaccinationDates);
        }
      } catch (error) {
        console.error('Error fetching vaccination dates:', error);
        setVaccinationError('Failed to load vaccination data');
        return;
      }
      
      console.log('Final vaccination dates data:', vaccinationDates);
      
      // Also try fetching all vaccination dates to see if there's any data
      try {
        const allResponse = await apiFetch(apiConfig.endpoints.vaccinationDates);
        const allData = await allResponse.json();
        console.log('All vaccination dates (first 5):', Array.isArray(allData) ? allData.slice(0, 5) : allData);
      } catch (error) {
        console.log('Error fetching all vaccination dates:', error);
      }
      
      if (Array.isArray(vaccinationDates) && vaccinationDates.length > 0) {
        // Process vaccination dates to create vaccination history records
        const historyRecords = [];
        
        vaccinationDates.forEach(vaccinationDate => {
          console.log('Processing vaccination date for vaccination data:', vaccinationDate);
          
          // Extract vaccination data from vaccination date
          const scheduleData = [
            { day: 'Day 0', date: vaccinationDate.d0Date, status: vaccinationDate.d0Status },
            { day: 'Day 3', date: vaccinationDate.d3Date, status: vaccinationDate.d3Status },
            { day: 'Day 7', date: vaccinationDate.d7Date, status: vaccinationDate.d7Status },
            { day: 'Day 14', date: vaccinationDate.d14Date, status: vaccinationDate.d14Status },
            { day: 'Day 28', date: vaccinationDate.d28Date, status: vaccinationDate.d28Status }
          ];
          
          scheduleData.forEach(schedule => {
            if (schedule.date || schedule.status) {
              const record = {
                day: schedule.day,
                date: schedule.date ? new Date(schedule.date).toLocaleDateString() : 'Not scheduled',
                status: schedule.status || 'scheduled',
                vaccineType: vaccinationDate.vaccineType || 'Anti-Rabies',
                center: vaccinationDate.center || vaccinationDate.centerName || 'Unknown Center',
                patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
                notes: vaccinationDate.notes || '',
                biteCaseId: vaccinationDate.biteCaseId,
                createdAt: vaccinationDate.createdAt
              };
              
              // Only add records that have been completed, missed, or scheduled
              if (record.status === 'completed' || record.status === 'missed' || record.status === 'scheduled') {
                historyRecords.push(record);
              }
            }
          });
        });
        
        // Sort by date (most recent first)
        historyRecords.sort((a, b) => {
          if (a.date === 'Not scheduled' && b.date === 'Not scheduled') return 0;
          if (a.date === 'Not scheduled') return 1;
          if (b.date === 'Not scheduled') return -1;
          return new Date(b.date) - new Date(a.date);
        });
        
        setVaccinationHistory(historyRecords);
        console.log('Processed vaccination history from vaccination dates:', historyRecords);
      } else {
        console.log('No vaccination dates data found');
        setVaccinationHistory([]);
      }
    } catch (error) {
      console.error('Error loading vaccination history:', error);
      setVaccinationError('Failed to load vaccination history from schedule');
    } finally {
      setVaccinationLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    setShowSignoutModal(true);
  };

  // Handle toggle account status
  const handleToggleAccountStatus = async (patient) => {
    if (!patient || actionLoading) return;
    
    setActionLoading(true);
    try {
      const newStatus = patient.status === 'Active' ? 'Inactive' : 'Active';
      const response = await apiFetch(`${apiConfig.endpoints.patients}/${patient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update the patient status in the modal
        setSelectedPatient({ ...patient, status: newStatus });
        
        // Update the patients list
        setPatients(prevPatients => 
          prevPatients.map(p => 
            p._id === patient._id ? { ...p, status: newStatus } : p
          )
        );
        
        // Show success message
        alert(`Patient account ${newStatus.toLowerCase()}d successfully`);
      } else {
        alert('Failed to update patient status');
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
      alert('Error updating patient status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (patient) => {
    if (!patient) return;
    
    setSelectedPatient(patient);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowAdminInfo(false);
    setCurrentPassword('');
    setShowPasswordModal(true);
  };

  // Handle new password change (progressive disclosure)
  const handleNewPasswordChange = async (value) => {
    setNewPassword(value);
    
    if (value.length > 0 && !showAdminInfo) {
      setShowAdminInfo(true);
      // Fetch current password for display
      try {
        const response = await apiFetch(`${apiConfig.endpoints.getPatientPassword}/${selectedPatient._id}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentPassword(data.password || '******');
        }
      } catch (error) {
        console.error('Error fetching current password:', error);
        setCurrentPassword('******');
      }
    }
  };

  // Validate password
  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  // Confirm password change
  const confirmPasswordChange = async () => {
    if (!selectedPatient) return;
    
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await apiFetch(`${apiConfig.endpoints.changePatientPassword}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          newPassword: newPassword,
        }),
      });

      if (response.ok) {
        alert('Password changed successfully');
        closePasswordModal();
      } else {
        alert('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password');
    } finally {
      setActionLoading(false);
    }
  };

  // Close password modal
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowAdminInfo(false);
    setCurrentPassword('');
  };

  // Handle edit patient
  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  // Handle new patient form submission
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddPatientLoading(true);
    setAddPatientError('');

    // Validation
    if (newPatientData.password !== newPatientData.confirmPassword) {
      setAddPatientError('Passwords do not match');
      setAddPatientLoading(false);
      return;
    }

    // Check all required fields
    const requiredFields = {
      firstName: newPatientData.firstName,
      lastName: newPatientData.lastName,
      sex: newPatientData.sex,
      email: newPatientData.email,
      phone: newPatientData.phone,
      password: newPatientData.password
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value.trim() === '')
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      setAddPatientError(`Missing required fields: ${missingFields.join(', ')}`);
      setAddPatientLoading(false);
      return;
    }

    // Full name duplicate validation
    try {
      const fullNameNew = [newPatientData.firstName, newPatientData.middleName, newPatientData.lastName]
        .filter(Boolean)
        .join(' ')
        .trim()
        .toLowerCase();

      // Quick client-side check against current list
      const dupLocal = patients.some(p => (
        [p.firstName, p.middleName, p.lastName]
          .filter(Boolean)
          .join(' ')
          .trim()
          .toLowerCase() === fullNameNew
      ));
      if (dupLocal) {
        setAddPatientError('A patient with this full name already exists.');
        setAddPatientLoading(false);
        return;
      }

      // Server-side check for safety
      const checkRes = await apiFetch(apiConfig.endpoints.patients);
      if (checkRes.ok) {
        const checkJson = await checkRes.json();
        const list = Array.isArray(checkJson) ? checkJson : (Array.isArray(checkJson?.data) ? checkJson.data : []);
        const dupRemote = list.some(p => (
          [p.firstName, p.middleName, p.lastName]
            .filter(Boolean)
            .join(' ')
            .trim()
            .toLowerCase() === fullNameNew
        ));
        if (dupRemote) {
          setAddPatientError('A patient with this full name already exists.');
          setAddPatientLoading(false);
          return;
        }
      }
    } catch (_) {
      // non-blocking if check fails
    }

    // Phone number validation
    if (newPatientData.phone && newPatientData.phone.length !== 13) {
      setAddPatientError('Phone number must be 10 digits (e.g., +639123456789)');
      setAddPatientLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newPatientData.email && !emailRegex.test(newPatientData.email)) {
      setAddPatientError('Please enter a valid email address');
      setAddPatientLoading(false);
      return;
    }

    try {
      const response = await apiFetch(apiConfig.endpoints.patients, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPatientData,
          role: 'Patient',
          isVerified: true
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Optimistically add to list
        if (data.patient) {
          setPatients(prev => [data.patient, ...prev]);
        }
        // Reset form
        setNewPatientData({
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          phone: '',
          birthdate: '',
          houseNo: '',
          street: '',
          barangay: '',
          subdivision: '',
          city: 'San Juan City',
          province: 'Metro Manila',
          zipCode: '1500',
          birthPlace: '',
          religion: '',
          occupation: '',
          nationality: 'Filipino',
          civilStatus: '',
          sex: '',
          password: '',
          confirmPassword: ''
        });
        setShowAddPatientModal(false);
        showToast('Patient created successfully');
      } else {
        setAddPatientError(data.message || 'Failed to add patient');
        showToast(data.message || 'Failed to add patient', 'error');
      }
    } catch (error) {
      setAddPatientError('Error adding patient: ' + error.message);
      showToast('Error adding patient: ' + error.message, 'error');
    } finally {
      setAddPatientLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setNewPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle phone number input with validation
  const handlePhoneChange = (value) => {
    // Remove all non-digit characters
    let cleanValue = value.replace(/\D/g, '');
    
    // If it starts with 63, keep it as is
    if (cleanValue.startsWith('63')) {
      cleanValue = '+' + cleanValue;
    }
    // If it starts with 0, replace with +63
    else if (cleanValue.startsWith('0')) {
      cleanValue = '+63' + cleanValue.substring(1);
    }
    // If it doesn't start with 63 or 0, add +63
    else if (cleanValue.length > 0) {
      cleanValue = '+63' + cleanValue;
    }
    
    // Limit to 13 characters (+63 + 10 digits)
    if (cleanValue.length <= 13) {
      setNewPatientData(prev => ({
        ...prev,
        phone: cleanValue
      }));
    }
  };

  // Confirm sign out
  const confirmSignOut = async () => {
    try {
      setShowSignoutModal(false); // Close modal immediately
      await fullLogout(apiFetch);
    } catch (error) {
      console.error('Signout error:', error);
      setShowSignoutModal(false); // Close modal even on error
      await fullLogout(); // Fallback to basic logout
    }
  };

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">
        <div className="content-header">
          <h2>Patient Management</h2>
          <button
            onClick={() => setShowAddPatientModal(true)}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.2)';
            }}
          >
            <i className="fa fa-plus"></i>
            Add New Patient
          </button>
        </div>

        <div className="admin-dashboard-filters" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search name, contact, address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
            {query && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                <i className="fa fa-search"></i>
              </div>
            )}
          </div>
          
          {/* Center filter removed as requested */}
          
          {/* Vaccination day filter removed */}
          <div style={{ position: 'relative' }}>
            <select 
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">All Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {sexFilter && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                <i className="fa fa-venus-mars"></i>
              </div>
            )}
          </div>
          
          <div style={{ position: 'relative' }}>
            <select 
              value={barangay} 
              onChange={(e) => setBarangay(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select Barangay</option>
              <option value="Batis">Batis</option>
              <option value="Balong-Bato">Balong-Bato</option>
              <option value="Corazon de Jesus">Corazon de Jesus</option>
              <option value="Ermitaño">Ermitaño</option>
              <option value="Greenhills">Greenhills</option>
              <option value="Isabelita">Isabelita</option>
              <option value="Kabayanan">Kabayanan</option>
              <option value="Little Baguio">Little Baguio</option>
              <option value="Maytunas">Maytunas</option>
              <option value="Onse">Onse</option>
              <option value="Pasadena">Pasadena</option>
              <option value="Pedro Cruz">Pedro Cruz</option>
              <option value="Progreso">Progreso</option>
              <option value="Rivera">Rivera</option>
              <option value="Salapan">Salapan</option>
              <option value="San Perfecto">San Perfecto</option>
              <option value="Santa Lucia">Santa Lucia</option>
              <option value="Tibagan">Tibagan</option>
              <option value="West Crame">West Crame</option>
            </select>
            {barangay && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                <i className="fa fa-map-marker"></i>
              </div>
            )}
          </div>
          
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              placeholder="Select Date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
            {dateFilter && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                <i className="fa fa-calendar"></i>
              </div>
            )}
          </div>
          
          {/* Vaccination date picker removed */}
        </div>

        {/* Active Filters Display */}
        {(query || barangay || dateFilter || sexFilter) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #0ea5e9',
            flexWrap: 'wrap'
          }}>
            {/* Count indicator */}
            <span style={{
              backgroundColor: '#0ea5e9',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800
            }}>
              {['x', query, barangay, dateFilter, sexFilter].filter(Boolean).length - 1} active
            </span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
              Active Filters:
            </span>
            {query && (
              <span style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Search: "{query}"
                <button
                  onClick={() => setQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    marginLeft: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {centerFilter && (
              <span style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Center: {centerFilter}
                <button
                  onClick={() => setCenterFilter('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    marginLeft: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {/* vaccination day chip removed */}
            {barangay && (
              <span style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Barangay: {barangay}
                <button
                  onClick={() => setBarangay('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    marginLeft: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {sexFilter && (
              <span style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Sex: {sexFilter}
                <button
                  onClick={() => setSexFilter('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    marginLeft: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {dateFilter && (
              <span style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Date: {new Date(dateFilter).toLocaleDateString()}
                <button
                  onClick={() => setDateFilter('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    marginLeft: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                // Reset all filters to defaults
                setQuery('');
                setStatus('');
                setCenterFilter('');
                setDateFilter('');
                setVaccinationDate('');
                setSexFilter('');
                setBarangay('');
                setPage(1);
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Loading removed per request */}
        {error && <div className="error-state">{error}</div>}

        {!loading && !error && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Full Name</th>
                  <th>Gender</th>
                  <th>Address</th>
                  <th>Barangay</th>
                  <th>Contacts</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {visiblePatients.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <i className="fa fa-user-injured"></i>
                        <p>No patients found</p>
                        <small>Patients will appear here once they are registered</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visiblePatients.map((p) => {
                    const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
                    const dateRegistered = getPatientDateRegistered(p);
                    const vaccinationDay = getLastCompletedVaccinationDay(p);
                    const caseCount = getPatientCaseCount(p);
                    const hasRecent = hasRecentCases(p);
                    const fullAddress = [
                      p.houseNo,
                      p.street,
                      p.barangay,
                      p.subdivision,
                      p.city,
                      p.province,
                      p.zipCode
                    ].filter(Boolean).join(', ') || p.address || 'N/A';
                    
                    // Check if patient has existing bite cases
                    const hasExistingCases = biteCases.some(case_ => {
                      const patientId = p._id || p.patientId || p.patientID;
                      const regNumber = p.registrationNumber || p.regNo;
                      const patientName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ').toLowerCase();
                      
                      const casePatientId = case_.patientId || case_.patientID;
                      const caseRegNumber = case_.registrationNumber || case_.regNo;
                      const casePatientName = case_.patientName || [case_?.firstName, case_?.middleName, case_?.lastName]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();
                      
                      if (patientId && casePatientId && patientId === casePatientId) return true;
                      if (regNumber && caseRegNumber && regNumber === caseRegNumber) return true;
                      if (patientName && casePatientName && patientName === casePatientName) return true;
                      
                      return false;
                    });
                    
                    // Apply search filter to include gender as well
                    const search = query.trim().toLowerCase();
                    const genderStr = String(p.gender || p.sex || '').toLowerCase();
                    if (search) {
                      const matches = [
                        p.patientId,
                        name,
                        fullAddress,
                        p.barangay,
                        genderStr
                      ].filter(Boolean).some(v => String(v).toLowerCase().includes(search));
                      if (!matches) return null;
                    }
                    
                    return (
                      <tr 
                        key={p._id} 
                        onClick={() => handlePatientClick(p)} 
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                            <span className="patient-id">{p.patientId || 'N/A'}</span>
                        </td>
                        <td>
                            <span className="patient-name">{name}</span>
                        </td>
                        <td>
                          {String(p.gender || p.sex || '').toUpperCase() || 'N/A'}
                        </td>
                        <td>
                          <span className="address-info" title={fullAddress}>{fullAddress}</span>
                        </td>
                        <td>
                          <span className="barangay-info">{p.barangay || 'N/A'}</span>
                        </td>
                        <td>
                          <div className="contact-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {p.phone && (
                              <div className="contact-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                <i className="fa fa-phone" style={{ color: '#10b981', marginRight: '6px', fontSize: '0.8rem' }}></i>
                                <span style={{ color: '#374151' }}>{p.phone}</span>
                              </div>
                            )}
                            {p.email && (
                              <div className="contact-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                <i className="fa fa-envelope" style={{ color: '#3b82f6', marginRight: '6px', fontSize: '0.8rem' }}></i>
                                <span style={{ color: '#374151' }}>{p.email}</span>
                              </div>
                            )}
                            {!p.phone && !p.email && (
                              <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>No contact info</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {p.createdAt ? new Date(p.createdAt).toLocaleString() : (p.dateRegistered ? new Date(p.dateRegistered).toLocaleString() : '—')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-container">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <i className="fa fa-chevron-left"></i> Prev
          </button>
          <span>Page {page} of {totalPages} ({totalItems} total)</span>
          <button 
            disabled={page >= totalPages} 
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <i className="fa fa-chevron-right"></i>
          </button>
        </div>
      </main>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="patient-modal-backdrop" onClick={(e) => { if (e.target.classList.contains('patient-modal-backdrop')) setShowPatientModal(false); }}>
          <div className="patient-modal">
            <div className="patient-modal-header">
              <h4 className="patient-modal-title">{showCaseForm ? 'Create New Bite Case' : 'Patient Information'}</h4>
              <button 
                onClick={() => setShowPatientModal(false)} 
                className="patient-modal-close"
              >
                ✕
              </button>
            </div>
            <div className="patient-modal-body">
              {showCaseForm ? (
                <div>
                  <NewBiteCaseForm 
                    selectedPatient={selectedPatient}
                    onSaved={() => {
                      try { setShowPatientModal(false); } catch(e) {}
                    }}
                    onCancel={() => setShowPatientModal(false)}
                  />
                </div>
              ) : showHistory ? (
                <div>
                  <div className="info-section">
                    <h5>Case History</h5>
                    {/* history loading removed per request */}
                    {historyError && <div className="error-state">{historyError}</div>}
                    {!historyLoading && !historyError && (
                      caseHistory.length === 0 ? (
                        <div className="empty-state" style={{ padding:'1rem 0' }}>
                          <small>No previous cases found for this patient.</small>
                        </div>
                      ) : (
                        <div className="table-responsive" style={{ boxShadow:'none', borderRadius:12 }}>
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Registration No</th>
                                <th>Type</th>
                                <th>Animal</th>
                                <th>Category</th>
                                <th>Diagnosis</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {caseHistory.map((c)=> {
                                const isExpanded = expandedCases.has(c._id);
                                return (
                                  <React.Fragment key={c._id}>
                                    <tr onClick={() => toggleCaseExpansion(c._id)} style={{ cursor: 'pointer' }} className="hover:bg-gray-50">
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <i className={`fa fa-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '12px' }}></i>
                                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : (c.exposureDate ? new Date(c.exposureDate).toLocaleDateString() : '')}
                                        </div>
                                      </td>
                                      <td>{c.registrationNumber || '-'}</td>
                                      <td>
                                        {c.typeOfExposure && c.typeOfExposure.includes('BITE') ? 'Bite' : 
                                         c.typeOfExposure && c.typeOfExposure.includes('NON-BITE') ? 'Non-Bite' : '-'}
                                      </td>
                                      <td>
                                        {c.animalProfile && c.animalProfile.species && c.animalProfile.species.includes('Dog') ? 'Dog' : 
                                         c.animalProfile && c.animalProfile.species && c.animalProfile.species.includes('Cat') ? 'Cat' : 
                                         c.animalProfile && c.animalProfile.species && c.animalProfile.species.includes('Others') ? (c.animalProfile.othersSpecify || 'Other') : '-'}
                                      </td>
                                      <td>
                                        {c.management && c.management.category && c.management.category.includes('Category 1') ? 'Category 1' : 
                                         c.management && c.management.category && c.management.category.includes('Category 2') ? 'Category 2' : 
                                         c.management && c.management.category && c.management.category.includes('Category 3') ? 'Category 3' : '-'}
                                      </td>
                                      <td>{c.diagnosis || '-'}</td>
                                      <td>
                                        <span className={`status-badge ${(c.status?.toLowerCase() || 'active')}`}>
                                          {c.status || 'Active'}
                                        </span>
                                      </td>
                                    </tr>
                                     {isExpanded && (
                                       <tr className="expandable-row">
                                         <td colSpan="7" style={{ padding: '0', backgroundColor: '#f8fafc' }}>
                                           <div className="case-details-container">
                                             <CaseDetailsForm case={c} />
                                           </div>
                                         </td>
                                       </tr>
                                     )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : showCaseDetails && selectedCase ? (
                <div>
                  <div className="info-section">
                    <h5>Case Details</h5>
                    <div className="case-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                      <div className="detail-section">
                        <h6>Basic Information</h6>
                        <p><strong>Registration No:</strong> {selectedCase.registrationNumber || 'N/A'}</p>
                        <p><strong>Date:</strong> {selectedCase.createdAt ? new Date(selectedCase.createdAt).toLocaleDateString() : (selectedCase.arrivalDate || 'N/A')}</p>
                        <p><strong>Type:</strong> {selectedCase.typeOfExposure && selectedCase.typeOfExposure.includes('BITE') ? 'Bite' : selectedCase.typeOfExposure && selectedCase.typeOfExposure.includes('NON-BITE') ? 'Non-Bite' : 'N/A'}</p>
                        <p><strong>Category:</strong> {selectedCase.management && selectedCase.management.category && selectedCase.management.category.includes('Category 1') ? 'Category 1' : selectedCase.management && selectedCase.management.category && selectedCase.management.category.includes('Category 2') ? 'Category 2' : selectedCase.management && selectedCase.management.category && selectedCase.management.category.includes('Category 3') ? 'Category 3' : 'N/A'}</p>
                        <p><strong>Status:</strong> {selectedCase.status || 'Active'}</p>
                      </div>
                      
                      <div className="detail-section">
                        <h6>Animal Information</h6>
                        <p><strong>Animal Type:</strong> {selectedCase.animalProfile && selectedCase.animalProfile.species && selectedCase.animalProfile.species.includes('Dog') ? 'Dog' : selectedCase.animalProfile && selectedCase.animalProfile.species && selectedCase.animalProfile.species.includes('Cat') ? 'Cat' : selectedCase.animalProfile && selectedCase.animalProfile.species && selectedCase.animalProfile.species.includes('Others') ? (selectedCase.animalProfile.othersSpecify || 'Other') : 'N/A'}</p>
                        <p><strong>Animal Status:</strong> {selectedCase.animalProfile && selectedCase.animalProfile.clinicalStatus && selectedCase.animalProfile.clinicalStatus.includes('Healthy') ? 'Healthy' : selectedCase.animalProfile && selectedCase.animalProfile.clinicalStatus && selectedCase.animalProfile.clinicalStatus.includes('Sick') ? 'Sick' : selectedCase.animalProfile && selectedCase.animalProfile.clinicalStatus && selectedCase.animalProfile.clinicalStatus.includes('Died') ? 'Died' : selectedCase.animalProfile && selectedCase.animalProfile.clinicalStatus && selectedCase.animalProfile.clinicalStatus.includes('Killed') ? 'Killed' : 'Unknown'}</p>
                        <p><strong>Brain Exam:</strong> {selectedCase.animalProfile && selectedCase.animalProfile.brainExam && selectedCase.animalProfile.brainExam.includes('Done') ? 'Done' : selectedCase.animalProfile && selectedCase.animalProfile.brainExam && selectedCase.animalProfile.brainExam.includes('Not Done') ? 'Not Done' : 'Unknown'}</p>
                      </div>
                      
                      <div className="detail-section">
                        <h6>Medical Information</h6>
                        <p><strong>Diagnosis:</strong> {selectedCase.diagnosis || 'N/A'}</p>
                        <p><strong>Management:</strong> {selectedCase.managementDetails || 'N/A'}</p>
                        <p><strong>Allergies:</strong> {selectedCase.allergyHistory || 'None'}</p>
                        <p><strong>Medications:</strong> {selectedCase.maintenanceMedications || 'None'}</p>
                      </div>
                      
                      <div className="detail-section">
                        <h6>Immunization</h6>
                        <p><strong>DPT:</strong> {selectedCase.patientImmunization && selectedCase.patientImmunization.dpt && selectedCase.patientImmunization.dpt.includes('Complete') ? 'Complete' : selectedCase.patientImmunization && selectedCase.patientImmunization.dpt && selectedCase.patientImmunization.dpt.includes('Incomplete') ? 'Incomplete' : 'None'}</p>
                        <p><strong>Tetanus Toxoid:</strong> {selectedCase.patientImmunization && selectedCase.patientImmunization.tt && selectedCase.patientImmunization.tt.includes('Active') ? 'Active' : 'None'}</p>
                        <p><strong>Anti-Rabies:</strong> {selectedCase.currentImmunization && selectedCase.currentImmunization.type && selectedCase.currentImmunization.type.includes('Post-exposure') ? 'Post-Exposure' : selectedCase.currentImmunization && selectedCase.currentImmunization.type && selectedCase.currentImmunization.type.includes('Pre-exposure') ? 'Pre-Exposure' : 'None'}</p>
                        <p><strong>HRIG Dose:</strong> {selectedCase.currentImmunization && selectedCase.currentImmunization.hrigDose || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showHistory ? (
                <div>
                  <div className="info-section">
                    <h5 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#374151' }}>
                      SCHEDULE DATES OF IMMUNIZATION
                    </h5>
                    
                    <div className="table-responsive" style={{ 
                      border: '2px solid #dc2626', 
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                      <table className="table" style={{ margin: 0, borderCollapse: 'collapse' }}>
                        <thead style={{ 
                          background: '#dc2626', 
                          color: 'white',
                          textAlign: 'center'
                        }}>
                          <tr>
                            <th style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '600',
                              border: '1px solid #b91c1c'
                            }}>
                              Immunization Day/Type
                            </th>
                            <th style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '600',
                              border: '1px solid #b91c1c'
                            }}>
                              Date Taken
                            </th>
                            <th style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '600',
                              border: '1px solid #b91c1c'
                            }}>
                              Medicine Used
                            </th>
                            <th style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '600',
                              border: '1px solid #b91c1c'
                            }}>
                              Branch No.
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* ERIG Row */}
                          <tr style={{ backgroundColor: '#fef2f2' }}>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '500',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              ERIG
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                if (currentCase?.currentImmunization?.erig?.dateTaken) {
                                  return new Date(currentCase.currentImmunization.erig.dateTaken).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  });
                                }
                                return '-';
                              })()}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                return currentCase?.currentImmunization?.erig?.medicineUsed || '-';
                              })()}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                return currentCase?.currentImmunization?.erig?.branchNo || currentCase?.center || currentCase?.centerName || '-';
                              })()}
                            </td>
                          </tr>
                          
                          {/* D0 Row */}
                          <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '500',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                display: 'inline-block'
                              }}></span>
                              D0
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {caseHistory.length > 0 && caseHistory[0].scheduleDates && caseHistory[0].scheduleDates[0] 
                                ? new Date(caseHistory[0].scheduleDates[0]).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'September 14, 2025'
                              }
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                if (currentCase?.currentImmunization?.vaccine) {
                                  const vaccineType = currentCase.currentImmunization.vaccine[0];
                                  if (vaccineType === 'PCEC') {
                                    return 'VAXIRAB (PCEC)';
                                  } else if (vaccineType === 'PVRV') {
                                    return 'SPEEDA (PVRV)';
                                  }
                                }
                                return currentCase?.brandName || currentCase?.genericName || 'VAXIRAB (BOOSTER)';
                              })()}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                return currentCase?.center || currentCase?.centerName || '001';
                              })()}
                            </td>
                          </tr>
                          
                          {/* D3 Row */}
                          <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '500',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                display: 'inline-block'
                              }}></span>
                              D3
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {caseHistory.length > 0 && caseHistory[0].scheduleDates && caseHistory[0].scheduleDates[1] 
                                ? new Date(caseHistory[0].scheduleDates[1]).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'September 17, 2025'
                              }
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                if (currentCase?.currentImmunization?.vaccine) {
                                  const vaccineType = currentCase.currentImmunization.vaccine[0];
                                  if (vaccineType === 'PCEC') {
                                    return 'VAXIRAB (PCEC)';
                                  } else if (vaccineType === 'PVRV') {
                                    return 'SPEEDA (PVRV)';
                                  }
                                }
                                return currentCase?.brandName || currentCase?.genericName || 'VAXIRAB (BOOSTER)';
                              })()}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                return currentCase?.center || currentCase?.centerName || '001';
                              })()}
                            </td>
                          </tr>
                          
                          {/* D7 Row */}
                          <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '500',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                display: 'inline-block'
                              }}></span>
                              D7
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {caseHistory.length > 0 && caseHistory[0].scheduleDates && caseHistory[0].scheduleDates[2] 
                                ? new Date(caseHistory[0].scheduleDates[2]).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'September 21, 2025'
                              }
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                if (currentCase?.currentImmunization?.vaccine) {
                                  const vaccineType = currentCase.currentImmunization.vaccine[0];
                                  if (vaccineType === 'PCEC') {
                                    return 'VAXIRAB (PCEC)';
                                  } else if (vaccineType === 'PVRV') {
                                    return 'SPEEDA (PVRV)';
                                  }
                                }
                                return currentCase?.brandName || currentCase?.genericName || '-';
                              })()}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                return currentCase?.center || currentCase?.centerName || '001';
                              })()}
                            </td>
                          </tr>
                          
                          {/* D14 Row */}
                          <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '500',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                display: 'inline-block'
                              }}></span>
                              D14
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {caseHistory.length > 0 && caseHistory[0].scheduleDates && caseHistory[0].scheduleDates[3] 
                                ? new Date(caseHistory[0].scheduleDates[3]).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'September 28, 2025'
                              }
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                if (currentCase?.currentImmunization?.vaccine) {
                                  const vaccineType = currentCase.currentImmunization.vaccine[0];
                                  if (vaccineType === 'PCEC') {
                                    return 'VAXIRAB (PCEC)';
                                  } else if (vaccineType === 'PVRV') {
                                    return 'SPEEDA (PVRV)';
                                  }
                                }
                                return currentCase?.brandName || currentCase?.genericName || '-';
                              })()}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                return currentCase?.center || currentCase?.centerName || '001';
                              })()}
                            </td>
                          </tr>
                          
                          {/* D28 Row */}
                          <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              fontWeight: '500',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                display: 'inline-block'
                              }}></span>
                              D28
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {caseHistory.length > 0 && caseHistory[0].scheduleDates && caseHistory[0].scheduleDates[4] 
                                ? new Date(caseHistory[0].scheduleDates[4]).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'October 12, 2025'
                              }
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                if (currentCase?.currentImmunization?.vaccine) {
                                  const vaccineType = currentCase.currentImmunization.vaccine[0];
                                  if (vaccineType === 'PCEC') {
                                    return 'VAXIRAB (PCEC)';
                                  } else if (vaccineType === 'PVRV') {
                                    return 'SPEEDA (PVRV)';
                                  }
                                }
                                return currentCase?.brandName || currentCase?.genericName || '-';
                              })()}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              fontSize: '0.9rem', 
                              color: '#374151',
                              border: '1px solid #dc2626',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const currentCase = caseHistory.length > 0 ? caseHistory[0] : null;
                                return currentCase?.center || currentCase?.centerName || '001';
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="patient-info-container">
                <div className="patient-profile-section">
                  <div className="patient-profile-left">
                    <div className="patient-avatar-large">
                      <i className="fa fa-user"></i>
                    </div>
                    <div className="patient-profile-info">
                      <h2 className="patient-name-large">
                        {[selectedPatient.firstName, selectedPatient.middleName, selectedPatient.lastName].filter(Boolean).join(' ')}
                      </h2>
                      <p className="patient-email">
                        {selectedPatient.email || 'No email provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="patient-profile-right">
                    <div className="patient-details-grid">
                      <div className="detail-row">
                        <span className="detail-label">Patient ID</span>
                        <span className="detail-value">{selectedPatient.patientId || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Gender</span>
                        <span className="detail-value">{selectedPatient.gender || selectedPatient.sex || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Age</span>
                        <span className="detail-value">
                          {selectedPatient.birthdate ? 
                            Math.floor((new Date() - new Date(selectedPatient.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) + ' years' : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Status</span>
                        <span className={`status-badge ${(selectedPatient.status?.toLowerCase() || 'active')}`}>
                          {selectedPatient.status || 'Active'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{selectedPatient.phone || selectedPatient.contactNumber || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Barangay</span>
                        <span className="detail-value">{selectedPatient.barangay || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date Registered</span>
                        <span className="detail-value">
                          {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Verification</span>
                        <span className={`verification-badge ${selectedPatient.isVerified === 'true' ? 'verified' : 'pending'}`}>
                          {selectedPatient.isVerified === 'true' ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>




              </div>
              )}
            </div>
            <div className="patient-modal-footer" style={{ justifyContent:'space-between' }}>
              <div>
                {!showCaseForm && !showHistory && !showCaseDetails && (
                  <button 
                    type="button"
                    className="patient-modal-btn"
                    onClick={() => setShowCaseForm(true)}
                  >
                    New Case
                  </button>
                )}
                {!showCaseForm && !showHistory && !showCaseDetails && (
                  <button 
                    type="button"
                    className="patient-modal-btn"
                    onClick={() => { setShowHistory(true); loadCaseHistoryForPatient(selectedPatient); }}
                  >
                    Case History
                  </button>
                )}
                {(showCaseForm || showHistory || showCaseDetails) && (
                  <button 
                    type="button"
                    className="patient-modal-btn"
                    onClick={() => { 
                      setShowCaseForm(false); 
                      setShowHistory(false); 
                      setShowCaseDetails(false);
                      setSelectedCase(null);
                    }}
                  >
                    Back to Info
                  </button>
                )}
                {showCaseDetails && (
                  <button 
                    type="button"
                    className="patient-modal-btn"
                    onClick={() => { 
                      setShowCaseDetails(false);
                      setSelectedCase(null);
                    }}
                  >
                    Back to History
                  </button>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setShowPatientModal(false)}
                className="patient-modal-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      <UnifiedModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        subtitle="You will need to log in again to access your account."
        icon={<i className="fa-solid fa-right-from-bracket"></i>}
        iconType="default"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmSignOut}
      />

      {/* Password Change Modal */}
      <UnifiedModal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="Change Patient Password"
        message=""
        subtitle=""
        icon={<i className="fa fa-key"></i>}
        iconType="default"
        confirmText="Change Password"
        cancelText="Cancel"
        onConfirm={confirmPasswordChange}
        customContent={
          <div className="password-change-form">
            {showAdminInfo && selectedPatient && (
              <>
                {/* Patient Information Section */}
                <div className="admin-info-section">
                  <h5>Patient Information</h5>
                  <div className="admin-info-grid">
                    <div className="info-item">
                      <span className="info-label">Full Name:</span>
                      <span className="info-value">
                        {[selectedPatient.firstName, selectedPatient.middleName, selectedPatient.lastName].filter(Boolean).join(' ')}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Patient ID:</span>
                      <span className="info-value">{selectedPatient.patientId}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status:</span>
                      <span className={`info-value status-${selectedPatient.status?.toLowerCase() || 'active'}`}>
                        {selectedPatient.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Password Display */}
                <div className="current-password-display">
                  <label>Current Password:</label>
                  <input 
                    type="text" 
                    value={currentPassword} 
                    readOnly 
                    className="password-display"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                className="password-input"
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="password-input"
                placeholder="Confirm new password"
              />
            </div>

            {passwordError && (
              <div className="password-error">
                {passwordError}
              </div>
            )}

            <div className="password-requirements">
              <h6>Password Requirements:</h6>
              <ul>
                <li>At least 8 characters long</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>
          </div>
        }
      />

      {/* Add New Patient Modal */}
      {showAddPatientModal && (
        <div className="patient-modal-backdrop" onClick={(e) => { if (e.target.classList.contains('patient-modal-backdrop')) setShowAddPatientModal(false); }}>
          <div className="patient-modal" style={{ maxWidth: '800px' }}>
            <div className="patient-modal-header">
              <h4 className="patient-modal-title">Add New Patient</h4>
              <button 
                onClick={() => setShowAddPatientModal(false)} 
                className="patient-modal-close"
              >
                ✕
              </button>
            </div>
            <div className="patient-modal-body">
              <form onSubmit={handleAddPatient}>
                {(addPatientError || toast) && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}>
                    {toast ? (
                      <span style={{ color: toast.type === 'success' ? '#16a34a' : '#dc2626' }}>
                        {toast.message}
                      </span>
                    ) : addPatientError}
                  </div>
                )}

                {/* Personal Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h5 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #dc2626', paddingBottom: '8px' }}>
                    Personal Information
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Middle Name
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Birth Date
                      </label>
                      <input
                        type="date"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.birthdate}
                        onChange={(e) => handleInputChange('birthdate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Sex *
                      </label>
                      <select
                        required
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.sex}
                        onChange={(e) => handleInputChange('sex', e.target.value)}
                      >
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Civil Status
                      </label>
                      <select
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.civilStatus}
                        onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                      >
                        <option value="">Select Civil Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Separated">Separated</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Birth Place
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.birthPlace}
                        onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Religion
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.religion}
                        onChange={(e) => handleInputChange('religion', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Occupation
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.occupation}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Nationality
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h5 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #dc2626', paddingBottom: '8px' }}>
                    Contact Information
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="example@email.com"
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px', 
                          fontSize: '14px',
                          backgroundColor: newPatientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatientData.email) ? '#fef2f2' : '#ffffff'
                        }}
                        value={newPatientData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                      {newPatientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatientData.email) && (
                        <small style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Please enter a valid email address
                        </small>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+639123456789"
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px', 
                          fontSize: '14px',
                          backgroundColor: newPatientData.phone && newPatientData.phone.length !== 13 ? '#fef2f2' : '#ffffff'
                        }}
                        value={newPatientData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                      {newPatientData.phone && newPatientData.phone.length !== 13 && (
                        <small style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Phone number must be 10 digits (e.g., +639123456789)
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h5 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #dc2626', paddingBottom: '8px' }}>
                    Address Information
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        House No.
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.houseNo}
                        onChange={(e) => handleInputChange('houseNo', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Street
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Barangay
                      </label>
                      <select
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.barangay}
                        onChange={(e) => handleInputChange('barangay', e.target.value)}
                      >
                        <option value="">Select Barangay</option>
                        <option value="Batis">Batis</option>
                        <option value="Balong-Bato">Balong-Bato</option>
                        <option value="Corazon de Jesus">Corazon de Jesus</option>
                        <option value="Ermitaño">Ermitaño</option>
                        <option value="Greenhills">Greenhills</option>
                        <option value="Isabelita">Isabelita</option>
                        <option value="Kabayanan">Kabayanan</option>
                        <option value="Little Baguio">Little Baguio</option>
                        <option value="Maytunas">Maytunas</option>
                        <option value="Onse">Onse</option>
                        <option value="Pasadena">Pasadena</option>
                        <option value="Pedro Cruz">Pedro Cruz</option>
                        <option value="Progreso">Progreso</option>
                        <option value="Rivera">Rivera</option>
                        <option value="Salapan">Salapan</option>
                        <option value="San Perfecto">San Perfecto</option>
                        <option value="Santa Lucia">Santa Lucia</option>
                        <option value="Tibagan">Tibagan</option>
                        <option value="West Crame">West Crame</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Subdivision
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.subdivision}
                        onChange={(e) => handleInputChange('subdivision', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        City
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Province
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Zip Code
                      </label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h5 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151', borderBottom: '2px solid #dc2626', paddingBottom: '8px' }}>
                    Account Information
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                        value={newPatientData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="patient-modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddPatientModal(false)}
                    className="patient-modal-btn"
                    style={{ backgroundColor: '#6b7280', color: 'white' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addPatientLoading}
                    className="patient-modal-btn"
                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                  >
                    {addPatientLoading ? (
                      <>Adding Patient...</>
                    ) : (
                      'Add Patient'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SuperAdminPatients);
