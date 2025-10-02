import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import LoadingSpinner from './DogLoadingSpinner';
import { getUserCenter } from '../../utils/userContext';
import { apiFetch, apiConfig } from '../../config/api';
import './SuperAdminGenerate.css';

const SuperAdminGenerate = () => {
  // State for all report types
  const [rabiesUtilData, setRabiesUtilData] = useState([]);
  const [animalBiteData, setAnimalBiteData] = useState([]);
  const [customDemoData, setCustomDemoData] = useState([]);
  const [patientsData, setPatientsData] = useState([]);
  const [vaccinationData, setVaccinationData] = useState([]);
  const [barangayData, setBarangayData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [adminData, setAdminData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states for each report
  const [rabiesUtilFilters, setRabiesUtilFilters] = useState({
    from: '',
    to: '',
    center: 'all',
    vaccineType: 'all',
    search: ''
  });

  const [animalBiteFilters, setAnimalBiteFilters] = useState({
    from: '',
    to: '',
    barangay: 'all',
    sex: 'all',           // Male | Female
    ageBand: 'all',       // lt15 | gt15
    species: 'all',       // Dog | Cat
    ownership: 'all',     // Pet | Stray
    category: 'all',      // 1 | 2 | 3
    completion: 'all',    // Complete | Incomplete | Not Given
    erig: 'all',          // Given | Not Given
    booster: 'all',       // Booster | No Booster
    status: 'all',
    search: ''
  });

  const [customDemoFilters, setCustomDemoFilters] = useState({
    from: '',
    to: '',
    sex: 'all',
    ageGroup: 'all',
    barangay: 'all',
    search: ''
  });

  const [patientsFilters, setPatientsFilters] = useState({
    from: '',
    to: '',
    sex: 'all',
    ageGroup: 'all',
    barangay: 'all',
    status: 'all',
    search: ''
  });

  const [vaccinationFilters, setVaccinationFilters] = useState({
    from: '',
    to: '',
    day: 'all',
    center: 'all',
    status: 'all',
    search: ''
  });

  const [barangayFilters, setBarangayFilters] = useState({
    from: '',
    to: '',
    riskLevel: 'all',
    search: ''
  });

  const [staffFilters, setStaffFilters] = useState({
    role: 'all',
    status: 'all',
    center: 'all',
    search: ''
  });

  const [adminFilters, setAdminFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const location = useLocation();

  // San Juan Barangays
  const sanJuanBarangays = [
    "Addition Hills", "Balong-Bato", "Batis", "Corazon de Jesus", "Ermitaño",
    "Greenhills", "Isabelita", "Kabayanan", "Little Baguio",
    "Maytunas", "Onse", "Pasadena", "Pedro Cruz", "Progreso", "Rivera",
    "Salapan", "San Perfecto", "Santa Lucia", "Tibagan", "West Crame"
  ];

  // Centers
  const centers = [
    "Balong-Bato Center", "Batis Center", "Greenhills Center", "Kabayanan Center",
    "Pasadena Center", "Salapan Center", "Tibagan Center", "West Crame Center"
  ];

  // Load data on component mount
  useEffect(() => {
    console.log('Loading all report data...');
    loadRabiesUtilData();
    loadAnimalBiteData();
    loadCustomDemoData();
    loadPatientsData();
    loadVaccinationData();
    loadBarangayData();
    loadStaffData();
    loadAdminData();
  }, []);

  // Debug effect to log data changes
  useEffect(() => {
    console.log('Staff data updated:', staffData.length, 'items');
    if (staffData.length > 0) {
      console.log('Sample staff item:', staffData[0]);
    }
  }, [staffData]);

  useEffect(() => {
    console.log('Animal bite data updated:', animalBiteData.length, 'items');
    if (animalBiteData.length > 0) {
      console.log('Sample animal bite item:', animalBiteData[0]);
    }
  }, [animalBiteData]);

  // Load data functions
  const loadRabiesUtilData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = '/api/reports/rabies-utilization';
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(url);
      const result = await response.json();
      if (result.success) {
        setRabiesUtilData(Array.isArray(result.data) ? result.data : (result.data?.table?.body || []));
      }
    } catch (error) {
      console.error('Error loading rabies utilization data:', error);
    }
  };

  const loadAnimalBiteData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = apiConfig.endpoints.bitecases;
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      console.log('Loading animal bite data from:', url);
      const response = await apiFetch(url);
      const result = await response.json();
      console.log('Animal bite API response:', result);
      
      let normalized = [];
      const derive = (it) => {
        const sex = (it.sex || it.gender || it.patientSex || '').toString();
        const ageVal = Number(it.age || it.patientAge || it.ageYears);
        const animalType = (it.animalType || it.animal || it.animal_type || it.type || '').toString();
        const species = /cat/i.test(animalType) ? 'Cat' : /dog/i.test(animalType) ? 'Dog' : '';
        const ownershipSource = (it.animalStatus || it.ownership || it.petType || '').toString();
        const ownership = /pet/i.test(ownershipSource) ? 'Pet' : /stray/i.test(ownershipSource) ? 'Stray' : '';
        const categoryRaw = (it.category || (it.management && it.management.category) || it.caseCategory || '').toString();
        const categoryMatch = categoryRaw.match(/(1|2|3)/);
        const category = categoryMatch ? categoryMatch[1] : '';
        const completionRaw = (it.vaccinationStatus || it.seriesStatus || it.completion || '').toString();
        let completion = '';
        if (/complete/i.test(completionRaw)) completion = 'Complete';
        else if (/incomplete/i.test(completionRaw)) completion = 'Incomplete';
        else if (/not\s?given/i.test(completionRaw)) completion = 'Not Given';
        const erigGiven = !!(it.erig || it.erigGiven || it.immunoglobulin || it.rigGiven);
        const boosterGiven = !!(it.booster || it.boosterGiven);
        const barangay = it.barangay || it.patientBarangay || it.addressBarangay || '';
        return {
          caseNo: it.caseNo || it.case_no || it.case || '',
          name: it.patientName || it.name || it.patient_name || '',
          date: it.date || it.createdAt || it.created_at || it.dateReported || '',
          age: it.age || it.patientAge || '',
          sex,
          address: it.address || it.patientAddress || it.location || '',
          animalType,
          biteSite: it.biteSite || it.bite_site || it.biteLocation || it.bite_location || it.location || '',
          status: it.status || it.caseStatus || 'Active',
          barangay,
          // derived fields for filtering
          _ageNumber: isNaN(ageVal) ? null : ageVal,
          _species: species,
          _ownership: ownership,
          _category: category,
          _completion: completion,
          _erig: erigGiven ? 'Given' : 'Not Given',
          _booster: boosterGiven ? 'Booster' : 'No Booster'
        };
      };

      if (Array.isArray(result)) {
        // Direct array response
        normalized = result.map(derive);
      } else if (result.success && result.data) {
        // Success response with data
        const raw = Array.isArray(result.data) ? result.data : (result.data?.table?.body || []);
        normalized = (raw || []).map(derive);
      } else {
        console.log('No animal bite data found or API returned empty result');
        // Add some sample data for testing if no real data exists
        const sampleBiteData = [
          {
            caseNo: 'BC001',
            name: 'John Doe',
            date: new Date().toISOString(),
            age: '25',
            sex: 'Male',
            address: '123 Main St, San Juan',
            animalType: 'Dog',
            biteSite: 'Left Hand',
            status: 'Active',
            barangay: 'Addition Hills'
          },
          {
            caseNo: 'BC002',
            name: 'Jane Smith',
            date: new Date().toISOString(),
            age: '30',
            sex: 'Female',
            address: '456 Oak Ave, San Juan',
            animalType: 'Cat',
            biteSite: 'Right Leg',
            status: 'Completed',
            barangay: 'Balong-Bato'
          }
        ];
        console.log('Using sample animal bite data for testing');
        normalized = sampleBiteData;
      }

      console.log('Loaded animal bite data:', normalized.length);
      setAnimalBiteData(normalized);
    } catch (error) {
      console.error('Error loading animal bite data:', error);
      // Add sample data on error for testing
      const sampleBiteData = [
        {
          caseNo: 'BC001',
          name: 'John Doe',
          date: new Date().toISOString(),
          age: '25',
          sex: 'Male',
          address: '123 Main St, San Juan',
          animalType: 'Dog',
          biteSite: 'Left Hand',
          status: 'Active',
          barangay: 'Addition Hills'
        }
      ];
      setAnimalBiteData(sampleBiteData);
    }
  };

  const loadCustomDemoData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = '/api/reports/demographic';
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(url);
      const result = await response.json();
      if (result.success) {
        setCustomDemoData(Array.isArray(result.data) ? result.data : (result.data?.table?.body || []));
      }
    } catch (error) {
      console.error('Error loading demographic data:', error);
    }
  };

  const loadPatientsData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = '/api/patients';
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(url);
      const result = await response.json();
      console.log('Patients API response:', result);
      if (result.success) {
        const patients = Array.isArray(result.data) ? result.data : (result.data?.patients || []);
        console.log('Loaded patients:', patients.length);
        setPatientsData(patients);
      }
    } catch (error) {
      console.error('Error loading patients data:', error);
    }
  };

  const loadVaccinationData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = '/api/bitecases';
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(url);
      const result = await response.json();
      console.log('Vaccination API response:', result);
      const normalizeVaccinationDay = (val) => {
        if (!val) return '0';
        const s = String(val).toLowerCase();
        // Try to extract digits (e.g., "day 0", "d0", "0")
        const m = s.match(/(\d{1,2})/);
        if (m) return String(parseInt(m[1], 10));
        // Map common words
        if (s.includes('zero')) return '0';
        if (s.includes('three')) return '3';
        if (s.includes('seven')) return '7';
        if (s.includes('fourteen')) return '14';
        if (s.includes('twenty-eight') || s.includes('twentyeight') || s.includes('28')) return '28';
        return '0';
      };

      const prettyVaccinationDay = (val) => `Day ${normalizeVaccinationDay(val)}`;

      const resolveName = (o) => {
        const byParts = [o.firstName || o.firstname, o.middleName || o.middlename, o.lastName || o.lastname]
          .filter(Boolean).join(' ').trim();
        const byNested = o.patient ? [o.patient.firstName, o.patient.middleName, o.patient.lastName].filter(Boolean).join(' ').trim() : '';
        return (
          o.patientName || o.patient_name || o.fullName || o.fullname || o.name || byParts || byNested || ''
        );
      };
      const resolveDay = (o) => prettyVaccinationDay(o.day || o.vaccinationDay || o.vaccination_day || o.scheduleDay || '0');
      const resolveDate = (o) => o.date || o.scheduledDate || o.scheduled_date || o.day0Date || o.day0_date || o.d0Date || o.createdAt;
      const resolveCenter = (o) => o.center || o.centerName || o.center_name || o.facility || '';

      if (Array.isArray(result)) {
        // Process bite cases to extract vaccination data
        const vaccinationData = result.map(case_ => ({
          patientName: resolveName(case_) || '—',
          day: resolveDay(case_),
          date: resolveDate(case_),
          center: resolveCenter(case_) || '—',
          status: case_.status || 'Scheduled',
          notes: case_.notes || ''
        }));
        console.log('Loaded vaccination data:', vaccinationData.length);
        setVaccinationData(vaccinationData);
      } else if (result.success && Array.isArray(result.data)) {
        const vaccinationData = result.data.map(case_ => ({
          patientName: resolveName(case_) || '—',
          day: resolveDay(case_),
          date: resolveDate(case_),
          center: resolveCenter(case_) || '—',
          status: case_.status || 'Scheduled',
          notes: case_.notes || ''
        }));
        console.log('Loaded vaccination data:', vaccinationData.length);
        setVaccinationData(vaccinationData);
      }
    } catch (error) {
      console.error('Error loading vaccination data:', error);
    }
  };

  const loadBarangayData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = '/api/cases-per-barangay';
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(url);
      const result = await response.json();
      console.log('Barangay API response:', result);
      if (result.success) {
        // Transform the data to match our expected format
        const barangayData = result.data.map(item => ({
          barangay: item.barangay,
          totalCases: item.count,
          riskLevel: item.count > 10 ? 'High' : item.count > 5 ? 'Medium' : 'Low',
          lastUpdated: new Date().toISOString(),
          recommendations: item.count > 10 ? 'High priority area - increase monitoring and vaccination efforts' : 
                          item.count > 5 ? 'Medium priority - maintain current protocols' : 
                          'Low priority - continue routine monitoring'
        }));
        console.log('Loaded barangay data:', barangayData.length);
        setBarangayData(barangayData);
      }
    } catch (error) {
      console.error('Error loading barangay data:', error);
    }
  };

  const loadStaffData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = '/api/staffs';
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(url);
      const result = await response.json();
      console.log('Staff API response:', result);
      
      if (result.success && result.staffs && result.staffs.length > 0) {
        // Transform the data to match our expected format
        const staffData = result.staffs.map(staff => ({
          firstName: staff.fullName ? staff.fullName.split(' ')[0] : '',
          middleName: staff.fullName ? staff.fullName.split(' ').slice(1, -1).join(' ') : '',
          lastName: staff.fullName ? staff.fullName.split(' ').slice(-1)[0] : '',
          email: staff.email || '',
          role: staff.role || 'staff',
          center: staff.centerName || 'Main Center',
          status: staff.isApproved ? 'Active' : 'Pending',
          dateAdded: staff.createdAt || new Date().toISOString()
        }));
        console.log('Loaded staff data:', staffData.length);
        setStaffData(staffData);
      } else {
        console.log('No staff data found or API returned empty result');
        // Add some sample data for testing if no real data exists
        const sampleStaffData = [
          {
            firstName: 'John',
            middleName: 'Michael',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            role: 'staff',
            center: 'Main Center',
            status: 'Active',
            dateAdded: new Date().toISOString()
          },
          {
            firstName: 'Jane',
            middleName: 'Elizabeth',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            role: 'nurse',
            center: 'Main Center',
            status: 'Active',
            dateAdded: new Date().toISOString()
          }
        ];
        console.log('Using sample staff data for testing');
        setStaffData(sampleStaffData);
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
      // Add sample data on error for testing
      const sampleStaffData = [
        {
          firstName: 'John',
          middleName: 'Michael',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'staff',
          center: 'Main Center',
          status: 'Active',
          dateAdded: new Date().toISOString()
        }
      ];
      setStaffData(sampleStaffData);
    }
  };

  const loadAdminData = async () => {
    try {
      const userCenter = getUserCenter();
      let url = '/api/admin-accounts';
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(url);
      const result = await response.json();
      console.log('Admin API response:', result);
      if (Array.isArray(result)) {
        // Transform the data to match our expected format
        const adminData = result.map(admin => ({
          firstName: admin.firstName || '',
          middleName: admin.middleName || '',
          lastName: admin.lastName || '',
          email: admin.username || admin.email || '',
          role: admin.role || 'admin',
          center: admin.centerName || 'All Centers',
          status: admin.isActive ? 'Active' : 'Inactive',
          dateAdded: admin.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString() // This would need to be fetched separately
        }));
        console.log('Loaded admin data:', adminData.length);
        setAdminData(adminData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  // Filter functions
  const filterRabiesUtilData = () => {
    let filtered = rabiesUtilData;
    const { from, to, center, vaccineType, search } = rabiesUtilFilters;

    if (from) {
      filtered = filtered.filter(row => {
        const d = row.dateRegistered ? new Date(row.dateRegistered) : null;
        return d && d >= new Date(from);
      });
    }

    if (to) {
      filtered = filtered.filter(row => {
        const d = row.dateRegistered ? new Date(row.dateRegistered) : null;
        return d && d <= new Date(to);
      });
    }

    if (center && center !== 'all') {
      filtered = filtered.filter(row => row.center === center);
    }

    if (vaccineType && vaccineType !== 'all') {
      filtered = filtered.filter(row => {
        if (vaccineType === 'brand') return row.brandName;
        if (vaccineType === 'generic') return row.genericName;
        return true;
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          (row.dateRegistered && formatDate(row.dateRegistered).toLowerCase().includes(searchLower)) ||
          (row.center && String(row.center).toLowerCase().includes(searchLower)) ||
          ([row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ').toLowerCase().includes(searchLower)) ||
          (row.brandName && String(row.brandName).toLowerCase().includes(searchLower)) ||
          (row.genericName && String(row.genericName).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  };

  const filterAnimalBiteData = () => {
    let filtered = animalBiteData;
    const { from, to, barangay, sex, ageBand, species, ownership, category, completion, erig, booster, status, search } = animalBiteFilters;

    if (from) {
      filtered = filtered.filter(row => row.date && new Date(row.date) >= new Date(from));
    }

    if (to) {
      filtered = filtered.filter(row => row.date && new Date(row.date) <= new Date(to));
    }

    if (barangay && barangay !== 'all') {
      filtered = filtered.filter(row => row.barangay === barangay);
    }

    if (sex && sex !== 'all') {
      filtered = filtered.filter(row => (row.sex || '').toLowerCase() === sex.toLowerCase());
    }

    if (ageBand && ageBand !== 'all') {
      filtered = filtered.filter(row => {
        const n = row._ageNumber;
        if (n === null) return false;
        if (ageBand === 'lt15') return n < 15;
        if (ageBand === 'gt15') return n >= 15;
        return true;
      });
    }

    if (species && species !== 'all') {
      filtered = filtered.filter(row => row._species === species);
    }

    if (ownership && ownership !== 'all') {
      filtered = filtered.filter(row => row._ownership === ownership);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(row => row._category === category);
    }

    if (completion && completion !== 'all') {
      filtered = filtered.filter(row => row._completion === completion);
    }

    if (erig && erig !== 'all') {
      filtered = filtered.filter(row => row._erig === erig);
    }

    if (booster && booster !== 'all') {
      filtered = filtered.filter(row => row._booster === booster);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(row => row.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          (row.caseNo && String(row.caseNo).toLowerCase().includes(searchLower)) ||
          (row.date && formatDate(row.date).toLowerCase().includes(searchLower)) ||
          (row.name && String(row.name).toLowerCase().includes(searchLower)) ||
          (row.patientName && String(row.patientName).toLowerCase().includes(searchLower)) ||
          (row.age && String(row.age).toLowerCase().includes(searchLower)) ||
          (row.sex && String(row.sex).toLowerCase().includes(searchLower)) ||
          (row.address && String(row.address).toLowerCase().includes(searchLower)) ||
          (row.animalType && String(row.animalType).toLowerCase().includes(searchLower)) ||
          (row.biteSite && String(row.biteSite).toLowerCase().includes(searchLower)) ||
          (row.status && String(row.status).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  };

  const filterCustomDemoData = () => {
    let filtered = customDemoData;
    const { from, to, sex, ageGroup, barangay, search } = customDemoFilters;

    if (from) {
      filtered = filtered.filter(row => row.registrationDate && new Date(row.registrationDate) >= new Date(from));
    }

    if (to) {
      filtered = filtered.filter(row => row.registrationDate && new Date(row.registrationDate) <= new Date(to));
    }

    if (sex && sex !== 'all') {
      filtered = filtered.filter(row => row.sex && row.sex === sex);
    }

    if (ageGroup && ageGroup !== 'all') {
      filtered = filtered.filter(row => {
        const age = Number(row.age);
        if (isNaN(age)) return false;
        if (ageGroup === '0-5') return age >= 0 && age <= 5;
        if (ageGroup === '6-12') return age >= 6 && age <= 12;
        if (ageGroup === '13-18') return age >= 13 && age <= 18;
        if (ageGroup === '19-35') return age >= 19 && age <= 35;
        if (ageGroup === '36-60') return age >= 36 && age <= 60;
        if (ageGroup === '61+') return age >= 61;
        return true;
      });
    }

    if (barangay && barangay !== 'all') {
      filtered = filtered.filter(row => row.barangay === barangay);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          ([row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ').toLowerCase().includes(searchLower)) ||
          (row.name && String(row.name).toLowerCase().includes(searchLower)) ||
          (row.age && String(row.age).toLowerCase().includes(searchLower)) ||
          (row.sex && String(row.sex).toLowerCase().includes(searchLower)) ||
          (row.address && String(row.address).toLowerCase().includes(searchLower)) ||
          (row.contactNo && String(row.contactNo).toLowerCase().includes(searchLower)) ||
          (row.registrationDate && formatDate(row.registrationDate).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  };

  // New filter functions
  const filterPatientsData = () => {
    let filtered = patientsData;
    const { from, to, sex, ageGroup, barangay, status, search } = patientsFilters;

    if (from) {
      filtered = filtered.filter(row => row.dateRegistered && new Date(row.dateRegistered) >= new Date(from));
    }

    if (to) {
      filtered = filtered.filter(row => row.dateRegistered && new Date(row.dateRegistered) <= new Date(to));
    }

    if (sex && sex !== 'all') {
      filtered = filtered.filter(row => row.sex === sex);
    }

    if (ageGroup && ageGroup !== 'all') {
      filtered = filtered.filter(row => {
        const age = Number(row.age);
        if (isNaN(age)) return false;
        if (ageGroup === '0-5') return age >= 0 && age <= 5;
        if (ageGroup === '6-12') return age >= 6 && age <= 12;
        if (ageGroup === '13-18') return age >= 13 && age <= 18;
        if (ageGroup === '19-35') return age >= 19 && age <= 35;
        if (ageGroup === '36-60') return age >= 36 && age <= 60;
        if (ageGroup === '61+') return age >= 61;
        return true;
      });
    }

    if (barangay && barangay !== 'all') {
      filtered = filtered.filter(row => row.barangay === barangay);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(row => row.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          ([row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ').toLowerCase().includes(searchLower)) ||
          (row.patientId && String(row.patientId).toLowerCase().includes(searchLower)) ||
          (row.age && String(row.age).toLowerCase().includes(searchLower)) ||
          (row.sex && String(row.sex).toLowerCase().includes(searchLower)) ||
          (row.address && String(row.address).toLowerCase().includes(searchLower)) ||
          (row.contactNo && String(row.contactNo).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  };

  const filterVaccinationData = () => {
    let filtered = vaccinationData;
    const { from, to, day, center, status, search } = vaccinationFilters;

    if (from) {
      filtered = filtered.filter(row => row.date && new Date(row.date) >= new Date(from));
    }

    if (to) {
      filtered = filtered.filter(row => row.date && new Date(row.date) <= new Date(to));
    }

    if (day && day !== 'all') {
      const key = (val) => {
        const s = String(val || '').toLowerCase();
        const m = s.match(/(\d{1,2})/);
        return m ? String(parseInt(m[1], 10)) : '';
      };
      const wanted = key(day);
      filtered = filtered.filter(row => key(row.day) === wanted);
    }

    if (center && center !== 'all') {
      filtered = filtered.filter(row => row.center === center);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(row => row.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          (row.patientName && String(row.patientName).toLowerCase().includes(searchLower)) ||
          (row.day && String(row.day).toLowerCase().includes(searchLower)) ||
          (row.center && String(row.center).toLowerCase().includes(searchLower)) ||
          (row.status && String(row.status).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  };

  const filterBarangayData = () => {
    let filtered = barangayData;
    const { from, to, riskLevel, search } = barangayFilters;

    if (from) {
      filtered = filtered.filter(row => row.date && new Date(row.date) >= new Date(from));
    }

    if (to) {
      filtered = filtered.filter(row => row.date && new Date(row.date) <= new Date(to));
    }

    if (riskLevel && riskLevel !== 'all') {
      filtered = filtered.filter(row => row.riskLevel === riskLevel);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          (row.barangay && String(row.barangay).toLowerCase().includes(searchLower)) ||
          (row.riskLevel && String(row.riskLevel).toLowerCase().includes(searchLower)) ||
          (row.totalCases && String(row.totalCases).includes(searchLower))
        );
      });
    }

    return filtered;
  };

  const filterStaffData = () => {
    let filtered = staffData;
    const { role, status, center, search } = staffFilters;

    if (role && role !== 'all') {
      filtered = filtered.filter(row => row.role === role);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(row => row.status === status);
    }

    if (center && center !== 'all') {
      filtered = filtered.filter(row => row.center === center);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          ([row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ').toLowerCase().includes(searchLower)) ||
          (row.email && String(row.email).toLowerCase().includes(searchLower)) ||
          (row.role && String(row.role).toLowerCase().includes(searchLower)) ||
          (row.center && String(row.center).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  };

  const filterAdminData = () => {
    let filtered = adminData;
    const { role, status, search } = adminFilters;

    if (role && role !== 'all') {
      filtered = filtered.filter(row => row.role === role);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(row => row.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(row => {
        return (
          ([row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ').toLowerCase().includes(searchLower)) ||
          (row.email && String(row.email).toLowerCase().includes(searchLower)) ||
          (row.role && String(row.role).toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  };

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Helper function to check if PDF libraries are available
  const checkPDFLibraries = () => {
    if (!window.jspdf) {
      alert('PDF generation libraries are not loaded. Please refresh the page and try again.');
      return false;
    }
    return true;
  };

  // ---- PDF Header Logos Helpers ----
  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const addHeaderLogos = async (doc) => {
    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const logoW = 22;
      const logoH = 22;
      const y = 6;
      const left1X = margin;
      const left2X = margin + logoW + 6;
      const right2X = pageWidth - margin - logoW; // far right
      const right1X = right2X - logoW - 6;       // left of far right

      // Order: prefer two left (sanjuan, sj1), two right (bp and optional extra)
      const sources = [
        '/img/sanjuan.png',
        '/img/sj1.png',
        '/img/bp.png'
      ];

      const loaded = (await Promise.all(sources.map((s)=>loadImage(s).catch(()=>null)))).filter(Boolean);

      const add = (image, x) => {
        const src = image.src.toLowerCase();
        const fmt = src.endsWith('.jpg') || src.endsWith('.jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(image, fmt, x, y, logoW, logoH);
      };

      // Place up to two on the left
      if (loaded[0]) add(loaded[0], left1X);
      if (loaded[1]) add(loaded[1], left2X);
      // Remaining go on the right (from rightmost inward)
      const rightImages = loaded.slice(2);
      if (rightImages.length === 1) {
        add(rightImages[0], right2X);
      } else if (rightImages.length >= 2) {
        add(rightImages[0], right1X);
        add(rightImages[1], right2X);
      }
    } catch (e) {
      // Non-fatal; continue without logos
      console.warn('PDF logos failed to load:', e);
    }
  };

  const addCenteredHeading = (doc, heading, subLines = []) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18; // under the logos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(String(heading || ''), pageWidth / 2, y, { align: 'center' });
    y += 6;
    if (subLines && subLines.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      subLines.forEach((line) => {
        doc.text(String(line || ''), pageWidth / 2, y, { align: 'center' });
        y += 6;
      });
    }
    // Date line
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), pageWidth / 2, y, { align: 'center' });
    y += 8;
    return y; // return next Y for content
  };

  // Handle sign out
  const handleSignOut = () => {
    setShowSignoutModal(true);
  };

  // Confirm sign out
  const confirmSignOut = async () => {
    try {
      let currentUser = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('userData'));
      
      if (currentUser && currentUser.email) {
        try {
          const res = await apiFetch(`${apiConfig.endpoints.accountStatus}/${encodeURIComponent(currentUser.email)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.account) {
              currentUser = { ...currentUser, ...data.account };
            }
          }
        } catch (err) {
          console.warn('Failed to fetch account status for logout:', err);
        }
      }

      if (!currentUser) {
        throw new Error('No active session found');
      }

      const logoutData = {
        role: currentUser.role,
        firstName: currentUser.firstName,
        middleName: currentUser.middleName || '',
        lastName: currentUser.lastName,
        action: 'Signed out'
      };

      if (currentUser.role === 'admin' && currentUser.adminID) {
        logoutData.adminID = currentUser.adminID;
      } else if (currentUser.role === 'superadmin' && currentUser.superAdminID) {
        logoutData.superAdminID = currentUser.superAdminID;
      }

      try {
        await apiFetch(apiConfig.endpoints.logout, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logoutData)
        });
      } catch (err) {
        console.warn('Logout API call failed:', err);
      }

      localStorage.removeItem('currentUser');
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      
      window.location.replace('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      alert(error.message || 'Error signing out. Please try again.');
    } finally {
      setShowSignoutModal(false);
    }
  };

  // Export functions
  const exportRabiesUtilPDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterRabiesUtilData();
    
    try {
      // Create PDF using jsPDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      const startY = addCenteredHeading(doc, 'CASES PER CENTER AND VACCINE USED', ['NAME OF FACILITY: Animal Bite Treatment Center']);

      // Table
      const columns = ['Date', 'Center', 'Patient Name', 'Vaccine Used'];
      const rows = filteredData.map(row => [
        formatDate(row.dateRegistered),
        row.center || '',
        [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' '),
        row.brandName || row.genericName || ''
      ]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('cases_per_center_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportAnimalBitePDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterAnimalBiteData();
    const summaryRows = buildBiteSummaryRows(filteredData);
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      // Build a compact filters summary line
      const filterLine = [
        animalBiteFilters.barangay !== 'all' ? `Barangay: ${animalBiteFilters.barangay}` : null,
        animalBiteFilters.sex !== 'all' ? `Sex: ${animalBiteFilters.sex}` : null,
        animalBiteFilters.ageBand !== 'all' ? `Age: ${animalBiteFilters.ageBand === 'lt15' ? '<15' : '≥15'}` : null,
        animalBiteFilters.species !== 'all' ? `Animal: ${animalBiteFilters.species}` : null,
        animalBiteFilters.ownership !== 'all' ? `Type: ${animalBiteFilters.ownership}` : null,
        animalBiteFilters.category !== 'all' ? `Category: ${animalBiteFilters.category}` : null,
        animalBiteFilters.completion !== 'all' ? `Completion: ${animalBiteFilters.completion}` : null,
        animalBiteFilters.erig !== 'all' ? `ERIG: ${animalBiteFilters.erig}` : null,
        animalBiteFilters.booster !== 'all' ? `Booster: ${animalBiteFilters.booster}` : null,
        animalBiteFilters.status !== 'all' ? `Status: ${animalBiteFilters.status}` : null
      ].filter(Boolean).join('  •  ');
      const startY = addCenteredHeading(doc, 'ANIMAL BITE EXPOSURE REPORT', [
        'NAME OF FACILITY: Animal Bite Treatment Center',
        filterLine
      ]);

      const columns = ['Metric', 'Count'];
      const rows = summaryRows.map(r => [r.label, String(r.count)]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('animal_bite_exposure_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Build the single-table summary for Animal Bite report
  const buildBiteSummaryRows = (list) => {
    const count = (pred) => list.filter(pred).length;
    const rows = [];
    // 1-2 Sex
    rows.push({ label: 'Male', count: count(r => String(r.sex || '').toLowerCase() === 'male') });
    rows.push({ label: 'Female', count: count(r => String(r.sex || '').toLowerCase() === 'female') });
    // 3-4 Age bands
    rows.push({ label: '< 15 years old', count: count(r => (r._ageNumber ?? 0) < 15) });
    rows.push({ label: '≥ 15 years old', count: count(r => (r._ageNumber ?? 0) >= 15) });
    // 5 Dog and sub
    const dogCount = count(r => r._species === 'Dog');
    rows.push({ label: 'Dog', count: dogCount });
    rows.push({ label: '–  Pet Dog', count: count(r => r._species === 'Dog' && r._ownership === 'Pet') });
    rows.push({ label: '–  Stray Dog', count: count(r => r._species === 'Dog' && r._ownership === 'Stray') });
    // 6 Cat and sub
    const catCount = count(r => r._species === 'Cat');
    rows.push({ label: 'Cat', count: catCount });
    rows.push({ label: '–  Pet Cat', count: count(r => r._species === 'Cat' && r._ownership === 'Pet') });
    rows.push({ label: '–  Stray Cat', count: count(r => r._species === 'Cat' && r._ownership === 'Stray') });
    // 7-9 Categories
    rows.push({ label: 'Category 1', count: count(r => r._category === '1') });
    const cat2 = count(r => r._category === '2');
    rows.push({ label: 'Category 2', count: cat2 });
    rows.push({ label: '–  Complete', count: count(r => r._category === '2' && r._completion === 'Complete') });
    rows.push({ label: '–  Incomplete', count: count(r => r._category === '2' && r._completion === 'Incomplete') });
    rows.push({ label: '–  Not Given', count: count(r => r._category === '2' && r._completion === 'Not Given') });
    const cat3 = count(r => r._category === '3');
    rows.push({ label: 'Category 3', count: cat3 });
    rows.push({ label: '–  Complete', count: count(r => r._category === '3' && r._completion === 'Complete') });
    rows.push({ label: '–  Incomplete', count: count(r => r._category === '3' && r._completion === 'Incomplete') });
    rows.push({ label: '–  Not Given', count: count(r => r._category === '3' && r._completion === 'Not Given') });
    rows.push({ label: '–  ERIG Given', count: count(r => r._category === '3' && r._erig === 'Given') });
    // 10 Booster
    rows.push({ label: 'Booster', count: count(r => r._booster === 'Booster') });
    return rows;
  };

  const exportCustomDemoPDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterCustomDemoData();
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      const startY = addCenteredHeading(doc, 'CUSTOM DEMOGRAPHIC REPORT', [
        'NAME OF FACILITY: Animal Bite Treatment Center',
        `Filter: Sex = ${customDemoFilters.sex}, Age Group = ${customDemoFilters.ageGroup}`
      ]);

      const columns = ['Name', 'Age', 'Sex', 'Address', 'Contact', 'Registration Date'];
      const rows = filteredData.map(row => [
        [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || String(row.name || ''),
        String(row.age || ''),
        String(row.sex || ''),
        String(row.address || ''),
        String(row.contactNo || ''),
        formatDate(row.registrationDate)
      ]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('demographic_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // New export functions
  const exportPatientsPDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterPatientsData();
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      const startY = addCenteredHeading(doc, 'PATIENTS REGISTRATION REPORT', [
        'NAME OF FACILITY: Animal Bite Treatment Center',
        `Filter: Sex = ${patientsFilters.sex}, Age Group = ${patientsFilters.ageGroup}, Barangay = ${patientsFilters.barangay}`
      ]);

      const columns = ['Patient ID', 'Name', 'Age', 'Sex', 'Barangay', 'Address', 'Contact', 'Status', 'Registration Date'];
      const rows = filteredData.map(row => [
        String(row.patientId || ''),
        [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' '),
        String(row.age || ''),
        String(row.sex || ''),
        String(row.barangay || ''),
        String(row.address || ''),
        String(row.contactNo || ''),
        String(row.status || ''),
        formatDate(row.dateRegistered)
      ]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('patients_registration_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportVaccinationPDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterVaccinationData();
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      const startY = addCenteredHeading(doc, 'VACCINATION SCHEDULE REPORT', [
        'NAME OF FACILITY: Animal Bite Treatment Center',
        `Filter: Day = ${vaccinationFilters.day}, Center = ${vaccinationFilters.center}, Status = ${vaccinationFilters.status}`
      ]);

      const columns = ['Patient Name', 'Vaccination Day', 'Scheduled Date', 'Center', 'Status', 'Notes'];
      const rows = filteredData.map(row => [
        String(row.patientName || ''),
        String(row.day || ''),
        formatDate(row.date),
        String(row.center || ''),
        String(row.status || ''),
        String(row.notes || '')
      ]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('vaccination_schedule_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportBarangayPDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterBarangayData();
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      const startY = addCenteredHeading(doc, 'BARANGAY ANALYTICS REPORT', [
        'NAME OF FACILITY: Animal Bite Treatment Center',
        `Filter: Risk Level = ${barangayFilters.riskLevel}`
      ]);

      const columns = ['Barangay', 'Total Cases', 'Risk Level', 'Last Updated', 'Recommendations'];
      const rows = filteredData.map(row => [
        String(row.barangay || ''),
        String(row.totalCases || 0),
        String(row.riskLevel || ''),
        formatDate(row.lastUpdated),
        String(row.recommendations || '')
      ]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('barangay_analytics_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportStaffPDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterStaffData();
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      const startY = addCenteredHeading(doc, 'STAFF MANAGEMENT REPORT', [
        'NAME OF FACILITY: Animal Bite Treatment Center',
        `Filter: Role = ${staffFilters.role}, Status = ${staffFilters.status}, Center = ${staffFilters.center}`
      ]);

      const columns = ['Name', 'Email', 'Role', 'Center', 'Status', 'Date Added'];
      const rows = filteredData.map(row => [
        [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' '),
        String(row.email || ''),
        String(row.role || ''),
        String(row.center || ''),
        String(row.status || ''),
        formatDate(row.dateAdded)
      ]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('staff_management_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportAdminPDF = async () => {
    if (!checkPDFLibraries()) return;
    
    setLoading(true);
    const filteredData = filterAdminData();
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      await addHeaderLogos(doc);
      const startY = addCenteredHeading(doc, 'ADMINISTRATOR REPORT', [
        'NAME OF FACILITY: Animal Bite Treatment Center',
        `Filter: Role = ${adminFilters.role}, Status = ${adminFilters.status}`
      ]);

      const columns = ['Name', 'Email', 'Role', 'Status', 'Date Added', 'Last Login'];
      const rows = filteredData.map(row => [
        [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' '),
        String(row.email || ''),
        String(row.role || ''),
        String(row.status || ''),
        formatDate(row.dateAdded),
        formatDate(row.lastLogin)
      ]);

      doc.autoTable({
        startY,
        head: [columns],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        tableLineColor: [128, 0, 0],
        tableLineWidth: 0.3
      });

      doc.save('administrator_report.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="content-header">
          <h2>Generate Reports</h2>
          <p className="subtitle">Generate and download detailed reports in PDF format</p>
        </div>

        <div className="reports-container">
          {/* Rabies Utilization Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-syringe"></i>
              <h3>Cases Per Center and Vaccine Used</h3>
                </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="rabiesUtilFrom">FROM:</label>
                  <input
                    type="date"
                        id="rabiesUtilFrom"
                    className="form-control"
                        value={rabiesUtilFilters.from}
                        onChange={(e) => setRabiesUtilFilters({...rabiesUtilFilters, from: e.target.value})}
                  />
                </div>
                    <div className="filter-group">
                      <label htmlFor="rabiesUtilTo">TO:</label>
                  <input
                    type="date"
                        id="rabiesUtilTo"
                    className="form-control"
                        value={rabiesUtilFilters.to}
                        onChange={(e) => setRabiesUtilFilters({...rabiesUtilFilters, to: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="rabiesUtilCenter">CENTER:</label>
                      <select
                        id="rabiesUtilCenter"
                        className="form-control"
                        value={rabiesUtilFilters.center}
                        onChange={(e) => setRabiesUtilFilters({...rabiesUtilFilters, center: e.target.value})}
                      >
                        <option value="all">All Centers</option>
                        {centers.map(center => (
                          <option key={center} value={center}>{center}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="rabiesUtilVaccineType">VACCINE TYPE:</label>
                      <select
                        id="rabiesUtilVaccineType"
                        className="form-control"
                        value={rabiesUtilFilters.vaccineType}
                        onChange={(e) => setRabiesUtilFilters({...rabiesUtilFilters, vaccineType: e.target.value})}
                      >
                        <option value="all">All Types</option>
                        <option value="brand">Brand Name</option>
                        <option value="generic">Generic Name</option>
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="rabiesUtilSearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="rabiesUtilSearch"
                          className="form-control table-search"
                          placeholder="Search by name, vaccine, or center..."
                          value={rabiesUtilFilters.search}
                          onChange={(e) => setRabiesUtilFilters({...rabiesUtilFilters, search: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportRabiesUtilPDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>CENTER</th>
                        <th>PATIENT NAME</th>
                        <th>VACCINE USED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterRabiesUtilData().length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterRabiesUtilData().map((row, index) => (
                          <tr key={index}>
                            <td>{formatDate(row.dateRegistered)}</td>
                            <td>{String(row.center || '')}</td>
                            <td>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}</td>
                            <td>{String(row.brandName || row.genericName || '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            </div>

          {/* Animal Bite Exposure Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-file-medical-alt"></i>
              <h3>Animal Bite Exposure Report</h3>
            </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="animalBiteFrom">FROM:</label>
                      <input
                        type="date"
                        id="animalBiteFrom"
                        className="form-control"
                        value={animalBiteFilters.from}
                        onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, from: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="animalBiteTo">TO:</label>
                      <input
                        type="date"
                        id="animalBiteTo"
                        className="form-control"
                        value={animalBiteFilters.to}
                        onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, to: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="animalBiteBarangay">BARANGAY:</label>
                      <select
                        id="animalBiteBarangay"
                        className="form-control"
                        value={animalBiteFilters.barangay}
                        onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, barangay: e.target.value})}
                      >
                        <option value="all">All Barangays</option>
                        {sanJuanBarangays.map(barangay => (
                          <option key={barangay} value={barangay}>{barangay}</option>
                        ))}
                      </select>
                    </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteSex">SEX:</label>
                  <select
                    id="animalBiteSex"
                    className="form-control"
                    value={animalBiteFilters.sex}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, sex: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteAgeBand">AGE:</label>
                  <select
                    id="animalBiteAgeBand"
                    className="form-control"
                    value={animalBiteFilters.ageBand}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, ageBand: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="lt15">&lt; 15 years old</option>
                    <option value="gt15">&ge; 15 years old</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteSpecies">ANIMAL:</label>
                  <select
                    id="animalBiteSpecies"
                    className="form-control"
                    value={animalBiteFilters.species}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, species: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteOwnership">TYPE:</label>
                  <select
                    id="animalBiteOwnership"
                    className="form-control"
                    value={animalBiteFilters.ownership}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, ownership: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="Pet">Pet</option>
                    <option value="Stray">Stray</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteCategory">CATEGORY:</label>
                  <select
                    id="animalBiteCategory"
                    className="form-control"
                    value={animalBiteFilters.category}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, category: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="1">Category 1</option>
                    <option value="2">Category 2</option>
                    <option value="3">Category 3</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteCompletion">COMPLETION:</label>
                  <select
                    id="animalBiteCompletion"
                    className="form-control"
                    value={animalBiteFilters.completion}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, completion: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="Complete">Complete</option>
                    <option value="Incomplete">Incomplete</option>
                    <option value="Not Given">Not Given</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteERIG">ERIG:</label>
                  <select
                    id="animalBiteERIG"
                    className="form-control"
                    value={animalBiteFilters.erig}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, erig: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="Given">ERIG Given</option>
                    <option value="Not Given">ERIG Not Given</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="animalBiteBooster">BOOSTER:</label>
                  <select
                    id="animalBiteBooster"
                    className="form-control"
                    value={animalBiteFilters.booster}
                    onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, booster: e.target.value})}
                  >
                    <option value="all">All</option>
                    <option value="Booster">Booster</option>
                    <option value="No Booster">No Booster</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="animalBiteAnimalType">ANIMAL TYPE:</label>
                      <select
                        id="animalBiteAnimalType"
                        className="form-control"
                        value={animalBiteFilters.animalType}
                        onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, animalType: e.target.value})}
                      >
                        <option value="all">All Types</option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="animalBiteSeverity">SEVERITY:</label>
                      <select
                        id="animalBiteSeverity"
                        className="form-control"
                        value={animalBiteFilters.severity}
                        onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, severity: e.target.value})}
                      >
                        <option value="all">All Severity</option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="animalBiteStatus">STATUS:</label>
                      <select
                        id="animalBiteStatus"
                        className="form-control"
                        value={animalBiteFilters.status}
                        onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, status: e.target.value})}
                      >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="animalBiteSearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                  <input
                    type="text"
                          id="animalBiteSearch"
                          className="form-control table-search"
                          placeholder="Search by name, animal, or address..."
                          value={animalBiteFilters.search}
                          onChange={(e) => setAnimalBiteFilters({...animalBiteFilters, search: e.target.value})}
                  />
                </div>
              </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportAnimalBitePDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Case No.</th>
                        <th>Date</th>
                        <th>Patient Name</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Address</th>
                        <th>Animal Type</th>
                        <th>Bite Site</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterAnimalBiteData().length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterAnimalBiteData().map((row, index) => (
                          <tr key={index}>
                            <td>{String(row.caseNo || '')}</td>
                            <td>{formatDate(row.date)}</td>
                            <td>{String(row.name || row.patientName || '')}</td>
                            <td>{String(row.age || '')}</td>
                            <td>{String(row.sex || '')}</td>
                            <td>{String(row.address || '')}</td>
                            <td>{String(row.animalType || '')}</td>
                            <td>{String(row.biteSite || '')}</td>
                            <td>{String(row.status || '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Demographic Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-user-friends"></i>
              <h3>Custom Demographic Report</h3>
            </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="customDemoFrom">FROM:</label>
                      <input
                        type="date"
                        id="customDemoFrom"
                        className="form-control"
                        value={customDemoFilters.from}
                        onChange={(e) => setCustomDemoFilters({...customDemoFilters, from: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="customDemoTo">TO:</label>
                      <input
                        type="date"
                        id="customDemoTo"
                        className="form-control"
                        value={customDemoFilters.to}
                        onChange={(e) => setCustomDemoFilters({...customDemoFilters, to: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="filterSex">SEX:</label>
                      <select
                        id="filterSex"
                        className="form-control"
                        value={customDemoFilters.sex}
                        onChange={(e) => setCustomDemoFilters({...customDemoFilters, sex: e.target.value})}
                      >
                        <option value="all">All Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="filterAge">AGE GROUP:</label>
                      <select
                        id="filterAge"
                        className="form-control"
                        value={customDemoFilters.ageGroup}
                        onChange={(e) => setCustomDemoFilters({...customDemoFilters, ageGroup: e.target.value})}
                      >
                        <option value="all">All Age Groups</option>
                        <option value="0-5">0-5</option>
                        <option value="6-12">6-12</option>
                        <option value="13-18">13-18</option>
                        <option value="19-35">19-35</option>
                        <option value="36-60">36-60</option>
                        <option value="61+">61+</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="customDemoBarangay">BARANGAY:</label>
                      <select
                        id="customDemoBarangay"
                        className="form-control"
                        value={customDemoFilters.barangay}
                        onChange={(e) => setCustomDemoFilters({...customDemoFilters, barangay: e.target.value})}
                      >
                        <option value="all">All Barangays</option>
                        {sanJuanBarangays.map(barangay => (
                          <option key={barangay} value={barangay}>{barangay}</option>
                        ))}
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="customDemoSearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="customDemoSearch"
                          className="form-control table-search"
                          placeholder="Search by name, address, or contact..."
                          value={customDemoFilters.search}
                          onChange={(e) => setCustomDemoFilters({...customDemoFilters, search: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportCustomDemoPDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Barangay</th>
                        <th>Address</th>
                        <th>Contact</th>
                        <th>Registration Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterCustomDemoData().length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterCustomDemoData().map((row, index) => (
                          <tr key={index}>
                            <td>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || String(row.name || '')}</td>
                            <td>{String(row.age || '')}</td>
                            <td>{String(row.sex || '')}</td>
                            <td>{String(row.barangay || '')}</td>
                            <td>{String(row.address || '')}</td>
                            <td>{String(row.contactNo || '')}</td>
                            <td>{formatDate(row.registrationDate)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Patients Registration Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-user-plus"></i>
              <h3>Patients Registration Report</h3>
            </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="patientsFrom">FROM:</label>
                      <input
                        type="date"
                        id="patientsFrom"
                        className="form-control"
                        value={patientsFilters.from}
                        onChange={(e) => setPatientsFilters({...patientsFilters, from: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="patientsTo">TO:</label>
                      <input
                        type="date"
                        id="patientsTo"
                        className="form-control"
                        value={patientsFilters.to}
                        onChange={(e) => setPatientsFilters({...patientsFilters, to: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="patientsSex">SEX:</label>
                      <select
                        id="patientsSex"
                        className="form-control"
                        value={patientsFilters.sex}
                        onChange={(e) => setPatientsFilters({...patientsFilters, sex: e.target.value})}
                      >
                        <option value="all">All Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="patientsAgeGroup">AGE GROUP:</label>
                      <select
                        id="patientsAgeGroup"
                        className="form-control"
                        value={patientsFilters.ageGroup}
                        onChange={(e) => setPatientsFilters({...patientsFilters, ageGroup: e.target.value})}
                      >
                        <option value="all">All Age Groups</option>
                        <option value="0-5">0-5</option>
                        <option value="6-12">6-12</option>
                        <option value="13-18">13-18</option>
                        <option value="19-35">19-35</option>
                        <option value="36-60">36-60</option>
                        <option value="61+">61+</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="patientsBarangay">BARANGAY:</label>
                      <select
                        id="patientsBarangay"
                        className="form-control"
                        value={patientsFilters.barangay}
                        onChange={(e) => setPatientsFilters({...patientsFilters, barangay: e.target.value})}
                      >
                        <option value="all">All Barangays</option>
                        {sanJuanBarangays.map(barangay => (
                          <option key={barangay} value={barangay}>{barangay}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="patientsStatus">STATUS:</label>
                      <select
                        id="patientsStatus"
                        className="form-control"
                        value={patientsFilters.status}
                        onChange={(e) => setPatientsFilters({...patientsFilters, status: e.target.value})}
                      >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="patientsSearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="patientsSearch"
                          className="form-control table-search"
                          placeholder="Search by name, ID, or contact..."
                          value={patientsFilters.search}
                          onChange={(e) => setPatientsFilters({...patientsFilters, search: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportPatientsPDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Barangay</th>
                        <th>Address</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterPatientsData().length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterPatientsData().map((row, index) => (
                          <tr key={index}>
                            <td>{String(row.patientId || '')}</td>
                            <td>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}</td>
                            <td>{String(row.age || '')}</td>
                            <td>{String(row.sex || '')}</td>
                            <td>{String(row.barangay || '')}</td>
                            <td>{String(row.address || '')}</td>
                            <td>{String(row.contactNo || '')}</td>
                            <td>{String(row.status || '')}</td>
                            <td>{formatDate(row.dateRegistered)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Vaccination Schedule Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-syringe"></i>
              <h3>Vaccination Schedule Report</h3>
            </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="vaccinationFrom">FROM:</label>
                      <input
                        type="date"
                        id="vaccinationFrom"
                        className="form-control"
                        value={vaccinationFilters.from}
                        onChange={(e) => setVaccinationFilters({...vaccinationFilters, from: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="vaccinationTo">TO:</label>
                      <input
                        type="date"
                        id="vaccinationTo"
                        className="form-control"
                        value={vaccinationFilters.to}
                        onChange={(e) => setVaccinationFilters({...vaccinationFilters, to: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="vaccinationDay">VACCINATION DAY:</label>
                      <select
                        id="vaccinationDay"
                        className="form-control"
                        value={vaccinationFilters.day}
                        onChange={(e) => setVaccinationFilters({...vaccinationFilters, day: e.target.value})}
                      >
                        <option value="all">All Days</option>
                        <option value="Day 0">Day 0</option>
                        <option value="Day 3">Day 3</option>
                        <option value="Day 7">Day 7</option>
                        <option value="Day 14">Day 14</option>
                        <option value="Day 28">Day 28</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="vaccinationCenter">CENTER:</label>
                      <select
                        id="vaccinationCenter"
                        className="form-control"
                        value={vaccinationFilters.center}
                        onChange={(e) => setVaccinationFilters({...vaccinationFilters, center: e.target.value})}
                      >
                        <option value="all">All Centers</option>
                        {centers.map(center => (
                          <option key={center} value={center}>{center}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="vaccinationStatus">STATUS:</label>
                      <select
                        id="vaccinationStatus"
                        className="form-control"
                        value={vaccinationFilters.status}
                        onChange={(e) => setVaccinationFilters({...vaccinationFilters, status: e.target.value})}
                      >
                        <option value="all">All Status</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Missed">Missed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="vaccinationSearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="vaccinationSearch"
                          className="form-control table-search"
                          placeholder="Search by patient name or center..."
                          value={vaccinationFilters.search}
                          onChange={(e) => setVaccinationFilters({...vaccinationFilters, search: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportVaccinationPDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Vaccination Day</th>
                        <th>Scheduled Date</th>
                        <th>Center</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterVaccinationData().length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterVaccinationData().map((row, index) => (
                          <tr key={index}>
                            <td>{String(row.patientName || '')}</td>
                            <td>{String(row.day || '')}</td>
                            <td>{formatDate(row.date)}</td>
                            <td>{String(row.center || '')}</td>
                            <td>{String(row.status || '')}</td>
                            <td>{String(row.notes || '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Barangay Analytics Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-chart-bar"></i>
              <h3>Barangay Analytics Report</h3>
            </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="barangayFrom">FROM:</label>
                      <input
                        type="date"
                        id="barangayFrom"
                        className="form-control"
                        value={barangayFilters.from}
                        onChange={(e) => setBarangayFilters({...barangayFilters, from: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="barangayTo">TO:</label>
                      <input
                        type="date"
                        id="barangayTo"
                        className="form-control"
                        value={barangayFilters.to}
                        onChange={(e) => setBarangayFilters({...barangayFilters, to: e.target.value})}
                      />
                    </div>
                    <div className="filter-group">
                      <label htmlFor="barangayRiskLevel">RISK LEVEL:</label>
                      <select
                        id="barangayRiskLevel"
                        className="form-control"
                        value={barangayFilters.riskLevel}
                        onChange={(e) => setBarangayFilters({...barangayFilters, riskLevel: e.target.value})}
                      >
                        <option value="all">All Risk Levels</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="barangaySearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="barangaySearch"
                          className="form-control table-search"
                          placeholder="Search by barangay name..."
                          value={barangayFilters.search}
                          onChange={(e) => setBarangayFilters({...barangayFilters, search: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportBarangayPDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Barangay</th>
                        <th>Total Cases</th>
                        <th>Risk Level</th>
                        <th>Last Updated</th>
                        <th>Recommendations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterBarangayData().length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterBarangayData().map((row, index) => (
                          <tr key={index}>
                            <td>{String(row.barangay || '')}</td>
                            <td>{String(row.totalCases || 0)}</td>
                            <td>{String(row.riskLevel || '')}</td>
                            <td>{formatDate(row.lastUpdated)}</td>
                            <td>{String(row.recommendations || '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Management Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-users-cog"></i>
              <h3>Staff Management Report</h3>
            </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="staffRole">ROLE:</label>
                      <select
                        id="staffRole"
                        className="form-control"
                        value={staffFilters.role}
                        onChange={(e) => setStaffFilters({...staffFilters, role: e.target.value})}
                      >
                        <option value="all">All Roles</option>
                        <option value="staff">Staff</option>
                        <option value="nurse">Nurse</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="staffStatus">STATUS:</label>
                      <select
                        id="staffStatus"
                        className="form-control"
                        value={staffFilters.status}
                        onChange={(e) => setStaffFilters({...staffFilters, status: e.target.value})}
                      >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="staffCenter">CENTER:</label>
                      <select
                        id="staffCenter"
                        className="form-control"
                        value={staffFilters.center}
                        onChange={(e) => setStaffFilters({...staffFilters, center: e.target.value})}
                      >
                        <option value="all">All Centers</option>
                        {centers.map(center => (
                          <option key={center} value={center}>{center}</option>
                        ))}
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="staffSearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="staffSearch"
                          className="form-control table-search"
                          placeholder="Search by name, email, or role..."
                          value={staffFilters.search}
                          onChange={(e) => setStaffFilters({...staffFilters, search: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportStaffPDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Center</th>
                        <th>Status</th>
                        <th>Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterStaffData().length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterStaffData().map((row, index) => (
                          <tr key={index}>
                            <td>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}</td>
                            <td>{String(row.email || '')}</td>
                            <td>{String(row.role || '')}</td>
                            <td>{String(row.center || '')}</td>
                            <td>{String(row.status || '')}</td>
                            <td>{formatDate(row.dateAdded)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Administrator Report */}
          <div className="report-card card-fade-in">
            <div className="report-header">
              <i className="fas fa-user-shield"></i>
              <h3>Administrator Report</h3>
            </div>
            <div className="report-body">
              <div className="table-section">
                <div className="table-section-header">
                  <div className="modern-filter-row">
                    <div className="filter-group">
                      <label htmlFor="adminRole">ROLE:</label>
                      <select
                        id="adminRole"
                        className="form-control"
                        value={adminFilters.role}
                        onChange={(e) => setAdminFilters({...adminFilters, role: e.target.value})}
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label htmlFor="adminStatus">STATUS:</label>
                      <select
                        id="adminStatus"
                        className="form-control"
                        value={adminFilters.status}
                        onChange={(e) => setAdminFilters({...adminFilters, status: e.target.value})}
                      >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                    <div className="search-group filter-group">
                      <label htmlFor="adminSearch" style={{visibility: 'hidden'}}>Search</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="adminSearch"
                          className="form-control table-search"
                          placeholder="Search by name or email..."
                          value={adminFilters.search}
                          onChange={(e) => setAdminFilters({...adminFilters, search: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="export-btn-group">
                      <button className="btn" onClick={exportAdminPDF}>
                        <i className="fa fa-download"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Date Added</th>
                        <th>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterAdminData().length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{textAlign: 'center'}}>No data found</td>
                        </tr>
                      ) : (
                        filterAdminData().map((row, index) => (
                          <tr key={index}>
                            <td>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}</td>
                            <td>{String(row.email || '')}</td>
                            <td>{String(row.role || '')}</td>
                            <td>{String(row.status || '')}</td>
                            <td>{formatDate(row.dateAdded)}</td>
                            <td>{formatDate(row.lastLogin)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay" style={{display: 'flex'}}>
          <LoadingSpinner />
        </div>
      )}

      {/* Logout Modal */}
      {showSignoutModal && (
        <div className="signout-modal active">
          <div className="signout-modal-overlay" onClick={() => setShowSignoutModal(false)}></div>
          <div className="signout-modal-content">
            <div className="signout-modal-header">
              <div className="signout-icon-wrapper">
                <i className="fa-solid fa-right-from-bracket"></i>
              </div>
              <h3>Sign Out</h3>
            </div>
            <div className="signout-modal-body">
              <p>Are you sure you want to sign out?</p>
              <span className="signout-subtitle">You will need to log in again to access your account.</span>
            </div>
            <div className="signout-modal-footer">
              <button className="cancel-btn" onClick={() => setShowSignoutModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={confirmSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminGenerate;

 