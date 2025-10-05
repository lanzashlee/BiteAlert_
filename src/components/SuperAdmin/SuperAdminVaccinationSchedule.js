import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import UnifiedSpinner from '../Common/UnifiedSpinner';
import UnifiedModal from '../UnifiedModal';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import './SuperAdminVaccinationSchedule.css';
import { apiFetch, apiConfig } from '../../config/api';

const SuperAdminVaccinationSchedule = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [vaccinationDayFilter, setVaccinationDayFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [centerOptions, setCenterOptions] = useState([]);
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
    setVaccinationDayFilter('');
    setCenterFilter('');
  }, []);
  const [viewMode, setViewMode] = useState('card');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVaccineInfoModal, setShowVaccineInfoModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  // New lightweight modal (X-only close)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModalLoading, setScheduleModalLoading] = useState(false);
  const [scheduleModalData, setScheduleModalData] = useState(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState(null);
  const [selectedVaccineInfo, setSelectedVaccineInfo] = useState(null);
  const [vaccineInfoLoading, setVaccineInfoLoading] = useState(false);
  const [caseHistory, setCaseHistory] = useState([]);
  const [caseHistoryLoading, setCaseHistoryLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [updatingVaccinationId, setUpdatingVaccinationId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Dose edit state
  const [selectedDose, setSelectedDose] = useState(null); // { day, scheduleItem }
  const [doseEditLoading, setDoseEditLoading] = useState(false);
  // Vaccine confirmation modal
  const [showVaccineConfirm, setShowVaccineConfirm] = useState(false);
  const [vaccineConfirmData, setVaccineConfirmData] = useState(null);
  const [selectedVaccine, setSelectedVaccine] = useState('');
  const [selectedVaccineBrand, setSelectedVaccineBrand] = useState('');
  const [vaccineStocks, setVaccineStocks] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  // Inline date picker popover state
  const [datePicker, setDatePicker] = useState(null); // { day, patientId, top, left }

  // Close popover on Escape / outside click / heavy scroll or resize
  useEffect(() => {
    if (!datePicker) return;
    const onKey = (e) => { if (e.key === 'Escape') setDatePicker(null); };
    const onClick = (e) => {
      const el = document.querySelector('.date-popover-container');
      if (el && !el.contains(e.target)) setDatePicker(null);
    };
    const onScrollOrResize = () => { setDatePicker(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [datePicker]);

  // While date picker is open, hide page scrollbars for a clean popover UX
  useEffect(() => {
    if (datePicker) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
  }, [datePicker]);
  
  // Get schedule status for a patient
  const getScheduleStatus = useCallback((patientData) => {
    if (!patientData?.vaccinations || patientData.vaccinations.length === 0) {
      return { status: 'No Schedule', color: '#6c757d' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const vaccinations = patientData.vaccinations;
    
    // Check if any vaccination is scheduled for today
    const todayVaccinations = vaccinations.filter(v => {
      if (!v.scheduledDate) return false;
      const scheduledDate = new Date(v.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate.getTime() === today.getTime();
    });

    if (todayVaccinations.length > 0) {
      return { status: 'Today', color: '#28a745' };
    }

    // Check if any vaccination is scheduled for the future
    const futureVaccinations = vaccinations.filter(v => {
      if (!v.scheduledDate) return false;
      const scheduledDate = new Date(v.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate.getTime() > today.getTime();
    });

    if (futureVaccinations.length > 0) {
      return { status: 'Scheduled', color: '#007bff' };
    }

    // Check if all vaccinations are completed
    const allCompleted = vaccinations.every(v => v.status === 'completed');
    if (allCompleted) {
      return { status: 'Completed', color: '#6c757d' };
    }

    // Check if any vaccinations are missed
    const missedVaccinations = vaccinations.filter(v => {
      if (!v.scheduledDate || v.status === 'completed') return false;
      const scheduledDate = new Date(v.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate.getTime() < today.getTime();
    });

    if (missedVaccinations.length > 0) {
      return { status: 'Missed', color: '#dc3545' };
    }

    return { status: 'Pending', color: '#ffc107' };
  }, []);

  // Load vaccine stocks
  const loadVaccineStocks = async () => {
    try {
      setStockLoading(true);
      const userCenter = getUserCenter();
      
      let stockUrl = '/api/vaccinestocks';
      if (userCenter && userCenter !== 'all') {
        stockUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      console.log('Loading vaccine stocks from:', stockUrl);
      const response = await apiFetch(stockUrl);
      const result = await response.json();
      
      console.log('🔍 Vaccine stock API response:', result);
      
      if (Array.isArray(result)) {
        console.log('🔍 Setting vaccine stocks (array):', result);
        setVaccineStocks(result);
      } else if (result.success && Array.isArray(result.data)) {
        console.log('🔍 Setting vaccine stocks (success.data):', result.data);
        setVaccineStocks(result.data);
      } else {
        console.log('🔍 No vaccine stock data found, result:', result);
        setVaccineStocks([]);
      }
    } catch (error) {
      console.error('Error loading vaccine stocks:', error);
      setVaccineStocks([]);
    } finally {
      setStockLoading(false);
    }
  };
  
  // Get vaccine dosage based on type and route
  const getVaccineDosage = (vaccine, route) => {
    const dosageMap = {
      'SPEEDA (PVRV)': route === 'ID' ? '0.4ml' : '1ml',
      'VAXIRAB (PCEC)': route === 'ID' ? '0.2ml' : '0.5ml',
      'SPEEDA (BOOSTER)': '0.2ml',
      'VAXIRAB (BOOSTER)': '0.1ml',
      'TCV': '1ml',
      'ERIG': 'Weight × 0.2ml'
    };
    return dosageMap[vaccine] || '1ml';
  };

  // Calculate ERIG dosage based on patient weight
  const calculateERIGDosage = (weight) => {
    if (!weight) return 0;
    const ml = weight * 0.2;
    return Number(ml.toFixed(2));
  };

  // Get available stock for a vaccine
  const getVaccineStock = (vaccineType, brand = '') => {
    if (!vaccineStocks || vaccineStocks.length === 0) return 0;
    
    const stock = vaccineStocks.find(s => {
      const nameMatch = s.name && s.name.toLowerCase().includes(vaccineType.toLowerCase());
      const typeMatch = s.type && s.type.toLowerCase().includes(vaccineType.toLowerCase());
      const brandMatch = !brand || (s.brand && s.brand.toLowerCase().includes(brand.toLowerCase()));
      
      return (nameMatch || typeMatch) && brandMatch;
    });
    
    return stock ? (stock.quantity || 0) : 0;
  };

  // Get available brands for a specific vaccine
  const getAvailableBrands = (vaccineName) => {
    console.log('🔍 getAvailableBrands called with:', vaccineName);
    console.log('🔍 vaccineStocks:', vaccineStocks);
    
    if (!vaccineStocks || vaccineStocks.length === 0) {
      console.log('🔍 No vaccine stocks available');
      return [];
    }
    
    const brands = [];
    
    // Process the vaccine stock structure
    vaccineStocks.forEach(center => {
      console.log('🔍 Processing center:', center.centerName);
      if (center.vaccines && Array.isArray(center.vaccines)) {
        center.vaccines.forEach(vaccine => {
          console.log('🔍 Processing vaccine:', vaccine.name, vaccine.type);
          
          // Match by vaccine name - be more flexible with matching
          let nameMatch = false;
          let typeMatch = false;
          
          if (vaccineName === 'VAXIRAB (PCEC)') {
            nameMatch = vaccine.name && vaccine.name.toLowerCase().includes('vaxirab');
            typeMatch = vaccine.type && vaccine.type.toLowerCase().includes('anti-rabies') && vaccine.brand && vaccine.brand.toLowerCase().includes('pcec');
          } else if (vaccineName === 'SPEEDA (PVRV)') {
            nameMatch = vaccine.name && vaccine.name.toLowerCase().includes('speeda');
            typeMatch = vaccine.type && vaccine.type.toLowerCase().includes('anti-rabies') && vaccine.brand && vaccine.brand.toLowerCase().includes('pvrv');
          } else if (vaccineName === 'TCV') {
            nameMatch = vaccine.name && vaccine.name.toLowerCase().includes('tetanus');
            typeMatch = vaccine.type && vaccine.type.toLowerCase().includes('tetanus');
          } else if (vaccineName === 'ERIG') {
            nameMatch = vaccine.name && vaccine.name.toLowerCase().includes('erig');
            typeMatch = vaccine.type && vaccine.type.toLowerCase().includes('erig');
          }
          
          console.log('🔍 Match results:', { nameMatch, typeMatch, vaccineName });
          
          if (nameMatch || typeMatch) {
            console.log('🔍 Found matching vaccine:', vaccine.name);
            // Process stock entries
            if (vaccine.stockEntries && Array.isArray(vaccine.stockEntries)) {
              vaccine.stockEntries.forEach(entry => {
                console.log('🔍 Processing stock entry:', entry);
                if (entry.stock > 0) {
                  brands.push({
                    name: vaccine.name,
                    brand: vaccine.brand,
                    branchNo: entry.branchNo,
                    quantity: entry.stock,
                    expirationDate: entry.expirationDate,
                    centerName: center.centerName,
                    type: vaccine.type
                  });
                }
              });
            }
          }
        });
      }
    });
    
    console.log('🔍 Final brands array:', brands);
    return brands;
  };

  // Map UI vaccine labels to inventory schema (name/brand/type)
  const mapVaccineToInventoryEntry = (vaccineLabel) => {
    switch (vaccineLabel) {
      case 'SPEEDA (PVRV)':
        return { name: 'SPEEDA', brand: 'PVRV', type: 'Anti-Rabies Vaccine' };
      case 'VAXIRAB (PCEC)':
        return { name: 'VAXIRAB', brand: 'PCEC', type: 'Anti-Rabies Vaccine' };
      case 'SPEEDA (BOOSTER)':
        return { name: 'SPEEDA', brand: 'PVRV', type: 'Anti-Rabies Vaccine' };
      case 'VAXIRAB (BOOSTER)':
        return { name: 'VAXIRAB', brand: 'PCEC', type: 'Anti-Rabies Vaccine' };
      case 'TCV':
        return { name: 'Tetanus Toxoid-Containing Vaccine', brand: 'TCV', type: 'Tetanus Toxoid-Containing Vaccine' };
      case 'ERIG':
        return { name: 'Equine Rabies Immunoglobulin', brand: 'ERIG', type: 'Equine Rabies Immunoglobulin' };
      default:
        return { name: vaccineLabel, brand: '', type: '' };
    }
  };

  // Process vaccine update with stock deduction
  const processVaccineUpdate = async () => {
    const { day, scheduleItem, selectedVaccine, selectedVaccineBrand } = vaccineConfirmData;
    
    // Update vaccinationdates
    const map = {
      'Day 0': { dateField: 'd0Date', statusField: 'd0Status' },
      'Day 3': { dateField: 'd3Date', statusField: 'd3Status' },
      'Day 7': { dateField: 'd7Date', statusField: 'd7Status' },
      'Day 14': { dateField: 'd14Date', statusField: 'd14Status' },
      'Day 28': { dateField: 'd28Date', statusField: 'd28Status' }
    };
    const fields = map[day];
    const payload = {};
    if (fields && scheduleItem) {
      if (scheduleItem.date) payload[fields.dateField] = new Date(scheduleItem.date).toISOString();
      if (scheduleItem.status) payload[fields.statusField] = scheduleItem.status;
    }
    
    // Update vaccinationdates
    const putBases = [apiConfig.endpoints.vaccinationDates];
    let updated = false;
    for (const base of putBases) {
      try {
        const res = await apiFetch(`${base}?biteCaseId=${encodeURIComponent(scheduleModalData.biteCaseId || '')}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) { updated = true; break; }
      } catch (_) {}
    }
    
    if (!updated) {
      throw new Error('Failed to update vaccination dates');
    }

    // Deduct from stock for selected vaccine
    const stockUpdates = [];
    if (selectedVaccine && selectedVaccineBrand) {
        let quantity = 0;
        
      if (selectedVaccine.includes('ERIG')) {
          // Get patient weight for ERIG calculation
          const patientWeight = scheduleModalData?.patient?.weight || 70; // default 70kg
          quantity = calculateERIGDosage(patientWeight);
        } else {
          // Get dosage based on vaccine and route
        const dosage = getVaccineDosage(selectedVaccine, scheduleModalData?.route);
          quantity = parseFloat(dosage.replace('ml', '')) || 1;
        }
        
        stockUpdates.push({
        vaccine: selectedVaccine,
        brand: selectedVaccineBrand,
          quantity: quantity,
          operation: 'deduct'
        });
    }

    // Update stock for each selected vaccine (center-scoped)
    for (const update of stockUpdates) {
      const inv = mapVaccineToInventoryEntry(update.vaccine);
      const centerName = scheduleModalData?.centerName || scheduleModalData?.patient?.center || scheduleModalData?.patient?.centerName;
      try {
        const stockRes = await apiFetch('/api/stock/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            centerName,
            itemName: inv.name,
            brand: inv.brand,
            type: inv.type,
            quantity: update.quantity,
            operation: update.operation,
            reason: `Vaccination administration - ${day}`,
            patientId: scheduleModalData?.patient?.patientId
          })
        });
        
        if (!stockRes.ok) {
          console.warn(`Failed to update stock for ${update.vaccine}`);
        }
      } catch (err) {
        console.warn(`Error updating stock for ${update.vaccine}:`, err);
      }
    }

    showNotification('Vaccination updated and stock deducted successfully', 'success');
  };
  
  // Best-effort display name for a patient
  const getPatientDisplayName = (p) => {
    if (!p) return 'Unknown Patient';
    const nameFromParts = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.replace(/\s+/g, ' ').trim();
    return (p.fullName && p.fullName.trim()) || nameFromParts || p.patientId || 'Unknown Patient';
  };

  const getDoseCodeFromDay = (dayLabel) => {
    switch (dayLabel) {
      case 'Day 0': return 'D0';
      case 'Day 3': return 'D3';
      case 'Day 7': return 'D7';
      case 'Day 14': return 'D14';
      case 'Day 28': return 'D28';
      default: return '';
    }
  };

  const buildVaccinationsForBiteCase = (biteCase) => {
    const fromPerDay = [
      { day: 'Day 0',  date: biteCase.d0Date,  status: biteCase.d0Status },
      { day: 'Day 3',  date: biteCase.d3Date,  status: biteCase.d3Status },
      { day: 'Day 7',  date: biteCase.d7Date,  status: biteCase.d7Status },
      { day: 'Day 14', date: biteCase.d14Date, status: biteCase.d14Status },
      { day: 'Day 28', date: biteCase.d28Date, status: biteCase.d28Status }
    ];
    let days = fromPerDay;
    const noDates = fromPerDay.every(d => !d.date);
    if (noDates && Array.isArray(biteCase.scheduleDates) && biteCase.scheduleDates.length > 0) {
      const labels = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
      days = labels.map((label, idx) => ({
        day: label,
        date: biteCase.scheduleDates[idx],
        status: biteCase.status === 'completed' ? 'completed' : 'scheduled'
      }));
    }
    return days
      .map(d => ({ ...d, date: normalizeDate(d.date) }))
      .filter(d => d.date)
      .map(d => ({
        label: d.day,
        date: d.date.toISOString(),
        status: d.status || 'scheduled'
      }));
  };

  // Format date for display without timezone shifts; preserve YYYY-MM-DD when provided
  const formatScheduleDate = (raw) => {
    try {
      if (!raw) return 'Not scheduled';
      if (typeof raw === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw; // already date-only
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;
        return d.toLocaleDateString(undefined, { timeZone: 'UTC' });
      }
      if (typeof raw === 'number') {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString(undefined, { timeZone: 'UTC' });
      }
      if (typeof raw === 'object') {
        if (raw?.$date?.$numberLong) {
          const d = new Date(Number(raw.$date.$numberLong));
          return d.toLocaleDateString(undefined, { timeZone: 'UTC' });
        }
        if (raw?.$date) {
          const d = new Date(raw.$date);
          return d.toLocaleDateString(undefined, { timeZone: 'UTC' });
        }
      }
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString(undefined, { timeZone: 'UTC' });
    } catch (_) {
      return String(raw);
    }
  };

  // Fetch latest vaccine info for this bite case directly from backend
  const openVaccineInfo = async (vaccination) => {
    try {
      setShowVaccineInfoModal(true);
      setVaccineInfoLoading(true);
      setSelectedVaccineInfo(null);

      // Try canonical endpoint first
      let biteCaseRes = await apiFetch(`${apiConfig.endpoints.bitecases}/${vaccination.originalId}`);
      if (!biteCaseRes.ok) {
        // Fallback: some backends use query format
        biteCaseRes = await apiFetch(`${apiConfig.endpoints.bitecases}?id=${encodeURIComponent(vaccination.originalId)}`);
      }
      let biteCaseData = null;
      if (biteCaseRes.ok) {
        try {
        const json = await biteCaseRes.json();
        if (Array.isArray(json)) biteCaseData = json[0];
        else if (json && json.data && Array.isArray(json.data)) biteCaseData = json.data[0];
        else biteCaseData = json;
        } catch (e) {
          const txt = await biteCaseRes.text();
          console.warn('Non-JSON bitecase response:', txt.slice(0, 120));
        }
      }

      const dose = getDoseCodeFromDay(vaccination.vaccinationDay);
      const brandName = biteCaseData?.brandName || biteCaseData?.currentImmunization?.doseMedicines?.find?.(d => d.dose === dose)?.medicineUsed || vaccination.vaccineBrand || '';
      const genericName = biteCaseData?.genericName || vaccination.vaccineGeneric || '';
      const route = biteCaseData?.route || biteCaseData?.currentImmunization?.route?.[0] || vaccination.vaccineRoute || '';

      setSelectedVaccineInfo({
        patientName: getPatientDisplayName(vaccination.patient),
        vaccinationDay: vaccination.vaccinationDay,
        date: vaccination.scheduledDate,
        brand: brandName,
        generic: genericName,
        route: route,
        dose: dose
      });
    } catch (e) {
      setSelectedVaccineInfo({
        patientName: getPatientDisplayName(vaccination.patient),
        vaccinationDay: vaccination.vaccinationDay,
        date: vaccination.scheduledDate,
        brand: vaccination.vaccineBrand || '',
        generic: vaccination.vaccineGeneric || '',
        route: vaccination.vaccineRoute || '',
        dose: vaccination.vaccineDose || ''
      });
    } finally {
      setVaccineInfoLoading(false);
    }
  };

  // Open patient detail modal
  const openPatientDetail = async (patientData) => {
    try {
      setShowPatientDetailModal(true);
      setSelectedPatientDetail(patientData);
    } catch (error) {
      console.error('Error opening patient detail:', error);
      showNotification('Error loading patient details', 'error');
    }
  };

  // Open new schedule modal fetching bite case directly
  const openPatientScheduleModal = async (patientData) => {
    try {
      console.log('🔍 Modal click triggered for patient:', patientData?.patient?.patientId, patientData?.patient?.fullName);
      console.log('🔍 Patient data structure:', patientData);
      
      setScheduleModalLoading(true);
      setShowScheduleModal(true);
      setScheduleModalData(null);
      setSelectedVaccine(''); // Reset vaccine selection
      setSelectedVaccineBrand(''); // Reset vaccine brand selection

      console.log('🔍 Modal state set - showScheduleModal should be true');
      
      // Force a re-render to ensure modal shows
      setTimeout(() => {
        console.log('🔍 Modal should be visible now');
      }, 100);

      // Get the specific patient ID
      const patientId = patientData?.patient?.patientId;
      if (!patientId) {
        throw new Error('No patient ID found');
      }

      // Fetch vaccinationdates for this specific patient
      let vdItem = null;
      try {
        console.log('🔍 Fetching vaccinationdates for patientId:', patientId);
        const list = await fetchVaccinationDatesForPatient(patientId);
        console.log('🔍 Found vaccinationdates records:', list.length, list);
        if (list.length > 0) {
          vdItem = list[0];
          console.log('🔍 Using vaccinationdates record:', vdItem);
        }

        // Fallback: fetch all and filter on client if API filter is not working
        if (!vdItem) {
          console.log('🔁 Fallback: fetching ALL vaccinationdates and filtering client-side');
          const all = await fetchAllVaccinationDates();
          const norm = (val) => (val || '').toString().trim().toLowerCase();
          vdItem = all.find(v => norm(v.patientId || v.patientID) === norm(patientId))
                || all.find(v => norm(v.registrationNumber) === norm(patientData?.vaccinations?.[0]?.registrationNumber))
                || all.find(v => norm(v.biteCaseId) === norm(patientData?.vaccinations?.[0]?.biteCaseId));
          if (vdItem) console.log('✅ Client-side matched vaccinationdates record:', vdItem);
        }
      } catch (e) {
        console.warn('Failed fetching vaccinationdates:', e);
      }

      // Build schedule from vaccinationdates; fallback to bite case fields
      let scheduleList = vdItem ? buildScheduleFromVaccinationDates(vdItem) : [];
      console.log('🔍 Built schedule list:', scheduleList);

     // Get vaccine info from bitecases if available
    let brandName = '', genericName = '', route = '', categoryOfExposure = '', caseCenter = '';
      try {
        const biteCaseRes = await apiFetch(`${apiConfig.endpoints.bitecases}?patientId=${encodeURIComponent(patientId)}`);
        if (biteCaseRes.ok) {
          let biteCase = null;
          try {
          const json = await biteCaseRes.json();
            biteCase = Array.isArray(json) ? json[0] : (Array.isArray(json?.data) ? json.data[0] : json);
          } catch (e) {
            const txt = await biteCaseRes.text();
            console.warn('Non-JSON bitecases by patientId:', txt.slice(0, 120));
          }
         if (biteCase) {
            brandName = biteCase.brandName || '';
            genericName = biteCase.genericName || '';
            route = biteCase.route || '';
           categoryOfExposure = biteCase.categoryOfExposure || biteCase.exposureCategory || biteCase.category || '';
           caseCenter = biteCase.center || biteCase.centerName || '';
            console.log('🔍 Found bite case vaccine info:', { brandName, genericName, route });
            // If we don't have schedule yet, or it's empty, build from bite case per-day fields
            if (!scheduleList || scheduleList.length === 0) {
              scheduleList = buildVaccinationsForBiteCase(biteCase).map(d => ({
                label: d.label,
                date: d.date,
                status: d.status || 'scheduled'
              }));
            }
          }
        }
      } catch (e) {
        console.warn('Failed fetching bite case:', e);
      }

      // Auto-populate vaccine selection for completed schedules
      if (brandName) {
        // Map brand name to vaccine selection
        if (brandName.includes('VAXIRAB') || brandName.includes('PCEC')) {
          setSelectedVaccine('VAXIRAB (PCEC)');
        } else if (brandName.includes('SPEEDA') || brandName.includes('PVRV')) {
          setSelectedVaccine('SPEEDA (PVRV)');
        } else if (brandName.includes('TCV')) {
          setSelectedVaccine('TCV');
        } else if (brandName.includes('ERIG')) {
          setSelectedVaccine('ERIG');
        }
      }

      setScheduleModalData({
        patient: patientData?.patient,
        biteCaseId: vdItem?.biteCaseId,
        vdId: vdItem?._id || vdItem?.id,
        brand: brandName,
        generic: genericName,
        route: route,
      categoryOfExposure,
      centerName: caseCenter || patientData?.patient?.center || patientData?.patient?.centerName || '',
        schedule: scheduleList
      });
    } catch (e) {
      console.error('Error loading schedule modal:', e);
      setScheduleModalData({
        patient: patientData?.patient,
        brand: '',
        generic: '',
        route: '',
        schedule: []
      });
      setSelectedVaccine(''); // Reset vaccine selection on error
      setSelectedVaccineBrand(''); // Reset vaccine brand selection on error
    } finally {
      setScheduleModalLoading(false);
    }
  };

  // Open patient case history (re-fetches on open; uses true patientId)
  const openCaseHistory = async (patient) => {
    try {
      setShowHistoryModal(true);
      setCaseHistoryLoading(true);
      setCaseHistory([]);

      const truePatientId = patient?.patientId || '';
      if (!truePatientId) throw new Error('Missing patientId');

      // Fetch all bite cases for the patient via API helper
      const res = await apiFetch(`${apiConfig.endpoints.bitecases}?patientId=${encodeURIComponent(truePatientId)}`);
      const raw = res.ok ? await res.json() : [];
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

      // Normalize and enrich fields; sort most recent first
      const normalized = list
        .map(bc => ({
        id: bc._id,
        registrationNumber: bc.registrationNumber,
        dateRegistered: bc.dateRegistered || bc.createdAt,
          createdAt: bc.createdAt,
          center: bc.center || bc.centerName || '',
          address: bc.address || bc.patientAddress || '',
        exposureDate: bc.exposureDate,
          severity: bc.severity || bc.exposureCategory || '',
          woundLocation: bc.woundLocation || '',
        status: bc.status,
        genericName: bc.genericName,
        brandName: bc.brandName,
        route: bc.route || bc.currentImmunization?.route?.[0] || '',
          notes: bc.notes || bc.remarks || '',
        scheduleDates: bc.scheduleDates || [],
        vaccinations: buildVaccinationsForBiteCase(bc)
        }))
        .sort((a, b) => new Date(b.dateRegistered || b.createdAt || 0) - new Date(a.dateRegistered || a.createdAt || 0));

      // Merge any statuses from current UI vaccinations state (ensures latest)
      const vaccinationByBiteCase = vaccinations.filter(v => v.biteCaseId).reduce((acc, v) => {
        if (!acc[v.biteCaseId]) acc[v.biteCaseId] = {};
        acc[v.biteCaseId][v.vaccinationDay] = v.status;
        return acc;
      }, {});
      normalized.forEach(item => {
        const map = vaccinationByBiteCase[item.id];
        if (map) {
          item.vaccinations = item.vaccinations.map(d => ({
            ...d,
            status: map[d.label] || d.status
          }));
        }
      });
      setCaseHistory(normalized);
    } catch (e) {
      console.warn('Failed to load case history:', e);
      setCaseHistory([]);
    } finally {
      setCaseHistoryLoading(false);
    }
  };

  // Safely normalize various date formats coming from API (ISO string, millis, {$date: {$numberLong}})
  const normalizeDate = (raw) => {
    try {
      if (!raw) return null;
      // BSON extended JSON cases
      if (typeof raw === 'object') {
        if (raw.$date) {
          const inner = raw.$date;
          if (typeof inner === 'string' || typeof inner === 'number') {
            const d = new Date(inner);
            return isNaN(d.getTime()) ? null : d;
          }
          if (typeof inner === 'object' && inner.$numberLong) {
            const num = Number(inner.$numberLong);
            const d = new Date(num);
            return isNaN(d.getTime()) ? null : d;
          }
        }
        if (raw.$numberLong) {
          const num = Number(raw.$numberLong);
          const d = new Date(num);
          return isNaN(d.getTime()) ? null : d;
        }
      }
      // Primitive cases
      if (typeof raw === 'number') {
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    } catch (_) {
      return null;
    }
  };

  // Build ordered schedule array from a vaccinationdates document
  const buildScheduleFromVaccinationDates = (vdItem) => {
    if (!vdItem) return [];
    const base = normalizeDate(vdItem.d0Date);
    // If we have Day 0, auto-compute missing dates for D3, D7, D14, D28
    const auto = (daysAfter) => {
      if (!base) return null;
      const d = new Date(base);
      d.setDate(d.getDate() + daysAfter);
      return d;
    };
    const entries = [
      { label: 'Day 0',  raw: vdItem.d0Date,  status: vdItem.d0Status },
      { label: 'Day 3',  raw: vdItem.d3Date ?? auto(3),  status: vdItem.d3Status },
      { label: 'Day 7',  raw: vdItem.d7Date ?? auto(7),  status: vdItem.d7Status },
      { label: 'Day 14', raw: vdItem.d14Date ?? auto(14), status: vdItem.d14Status },
      { label: 'Day 28', raw: vdItem.d28Date ?? auto(28), status: vdItem.d28Status }
    ];
    return entries
      .map(e => ({ label: e.label, date: normalizeDate(e.raw)?.toISOString(), status: e.status || 'scheduled' }))
      .filter(e => !!e.date);
  };

  // Robust fetchers that try multiple endpoint variants to avoid 404s
  const tryFetchJson = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  };

  const fetchVaccinationDatesForPatient = async (patientId) => {
    const bases = [
      apiConfig.endpoints.vaccinationDates
    ];
    for (const base of bases) {
      const data = await tryFetchJson(`${base}?patientId=${encodeURIComponent(patientId)}`);
      if (data) return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    }
    return [];
  };

  const fetchAllVaccinationDates = async () => {
    const userCenter = getUserCenter();
    const bases = [
      apiConfig.endpoints.vaccinationDates
    ];
    for (const base of bases) {
      let url = base;
      if (userCenter && userCenter !== 'all') {
        url += `?center=${encodeURIComponent(userCenter)}`;
      }
      const data = await tryFetchJson(url);
      if (data) return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    }
    return [];
  };

  // Form states
  const [formData, setFormData] = useState({
    patientId: '',
    vaccinationDay: '',
    scheduledDate: '',
    status: 'scheduled',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Custom confirmation modal
  const customConfirm = (message, actionObj) => {
    setConfirmAction({ message, action: actionObj.action });
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      if (confirmAction && confirmAction.action && typeof confirmAction.action === 'function') {
        await confirmAction.action();
      } else {
        console.error('Invalid action in confirmAction:', confirmAction);
      }
    } catch (error) {
      console.error('Error executing confirm action:', error);
      showNotification('Error executing action', 'error');
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
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
          const res = await fetch(`/api/account-status/${encodeURIComponent(currentUser.email)}`);
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

  // Force re-render when vaccinations change
  useEffect(() => {
    console.log('Vaccinations state changed:', vaccinations.length, 'items');
    if (vaccinations.length > 0) {
      console.log('Sample vaccination status:', vaccinations[0]?.status, vaccinations[0]?.vaccinationDay);
    }
  }, [vaccinations]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const userCenter = getUserCenter();
        
        // Load vaccine stocks
        await loadVaccineStocks();
        
        // Build API URLs with center filter for non-superadmin users
        let patientsUrl = `${apiConfig.endpoints.patients}?page=1&limit=1000`;
        let vaccinationUrl = apiConfig.endpoints.bitecases;
        
        if (userCenter && userCenter !== 'all') {
          patientsUrl += `&center=${encodeURIComponent(userCenter)}`;
          vaccinationUrl += `?center=${encodeURIComponent(userCenter)}`;
        }
        
        // Fetch patients (use apiFetch with base URL and handle non-JSON responses)
        const patientsRes = await apiFetch(patientsUrl);
        let patientsData = [];
        if (!patientsRes.ok) {
          throw new Error(`Failed to fetch patients: ${patientsRes.status}`);
        }
        try {
          patientsData = await patientsRes.json();
        } catch (e) {
          const text = await patientsRes.text();
          console.error('Patients response not JSON:', text);
          throw new Error('Patients API returned non-JSON');
        }
        
        // Fetch bite cases which contain vaccination data
        const vaccinationRes = await apiFetch(vaccinationUrl);
        const vaccinationData = await vaccinationRes.json();
        
        // Handle different response formats
        let patients = [];
        let biteCases = [];
        
        if (patientsData.success && patientsData.data) {
          patients = patientsData.data;
        } else if (Array.isArray(patientsData)) {
          patients = patientsData;
        }
        
        if (Array.isArray(vaccinationData)) {
          biteCases = vaccinationData;
        } else if (vaccinationData && vaccinationData.success && Array.isArray(vaccinationData.data)) {
          biteCases = vaccinationData.data;
        } else if (vaccinationData && Array.isArray(vaccinationData.data)) {
          biteCases = vaccinationData.data;
        }

        // Only include bite cases that already have an assigned schedule
        const hasAssignedSchedule = (bc) => {
          const perDay = [bc.d0Date, bc.d3Date, bc.d7Date, bc.d14Date, bc.d28Date].some(Boolean);
          const arraySched = Array.isArray(bc.scheduleDates) && bc.scheduleDates.some(Boolean);
          return perDay || arraySched;
        };
        biteCases = (biteCases || []).filter(hasAssignedSchedule);

        // Fallback: try vaccinationdates if bitecases returned nothing
        if (!biteCases || biteCases.length === 0) {
          try {
            let vdUrl = apiConfig.endpoints.vaccinationDates;
            if (userCenter && userCenter !== 'all') {
              vdUrl += `?center=${encodeURIComponent(userCenter)}`;
            }
            const vdRes = await apiFetch(vdUrl);
            const vdData = await vdRes.json();
            if (Array.isArray(vdData)) {
              biteCases = vdData;
            } else if (vdData && vdData.success && Array.isArray(vdData.data)) {
              biteCases = vdData.data;
            }
          } catch (e) {
            // ignore fallback failure
          }
        }
        
        setPatients(patients);
        
        // Process bite cases and populate patient information
        const vaccinationSchedule = [];
        biteCases.forEach(biteCase => {
          // Try multiple ways to associate patient
          let patient = patients.find(p => 
            p?._id === biteCase.patientId ||
            p?.patientId === biteCase.patientId ||
            (biteCase.registrationNumber && p?.registrationNumber === biteCase.registrationNumber)
          );

          // Fallback patient using fields on biteCase (ensures names show even if not in patients list)
          if (!patient) {
            const fallbackFullName = (biteCase.fullName && String(biteCase.fullName).trim().length > 0)
              ? biteCase.fullName
              : `${biteCase.firstName || ''} ${biteCase.middleName || ''} ${biteCase.lastName || ''}`.replace(/\s+/g, ' ').trim();
            patient = {
              _id: biteCase.patientId || biteCase._id,
              patientId: biteCase.patientId || '',
              fullName: fallbackFullName || 'Unknown Patient',
              email: biteCase.email || '',
              firstName: biteCase.firstName || '',
              middleName: biteCase.middleName || '',
              lastName: biteCase.lastName || ''
            };
          }
          
          // Create separate entries for each vaccination day
          let vaccinationDays = [
            { day: 'Day 0',  date: biteCase.d0Date,  status: biteCase.d0Status },
            { day: 'Day 3',  date: biteCase.d3Date,  status: biteCase.d3Status },
            { day: 'Day 7',  date: biteCase.d7Date,  status: biteCase.d7Status },
            { day: 'Day 14', date: biteCase.d14Date, status: biteCase.d14Status },
            { day: 'Day 28', date: biteCase.d28Date, status: biteCase.d28Status }
          ];

          // Debug: Log the status values from database
          console.log('Bite case statuses from database:', {
            biteCaseId: biteCase._id,
            d0Status: biteCase.d0Status,
            d3Status: biteCase.d3Status,
            d7Status: biteCase.d7Status,
            d14Status: biteCase.d14Status,
            d28Status: biteCase.d28Status
          });

          // Special debugging for the problematic bite case
          if (biteCase._id === '682f535474c3e8fd25ee8cbf') {
            console.log('🔍 DEBUGGING BITE CASE 682f535474c3e8fd25ee8cbf:', {
              fullBiteCase: biteCase,
              vaccinationDays: [
                { day: 'Day 0',  date: biteCase.d0Date,  status: biteCase.d0Status },
                { day: 'Day 3',  date: biteCase.d3Date,  status: biteCase.d3Status },
                { day: 'Day 7',  date: biteCase.d7Date,  status: biteCase.d7Status },
                { day: 'Day 14', date: biteCase.d14Date, status: biteCase.d14Status },
                { day: 'Day 28', date: biteCase.d28Date, status: biteCase.d28Status }
              ]
            });
          }

          // If per-day fields absent, map from scheduleDates array
          if ((!vaccinationDays[0].date && !vaccinationDays[1].date && !vaccinationDays[2].date && !vaccinationDays[3].date && !vaccinationDays[4].date) && Array.isArray(biteCase.scheduleDates) && biteCase.scheduleDates.length > 0) {
            const mapIndexToDay = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
            vaccinationDays = mapIndexToDay.map((label, idx) => ({
              day: label,
              date: biteCase.scheduleDates[idx],
              // Fall back: if whole case completed, mark completed; else scheduled
              status: biteCase.status === 'completed' ? 'completed' : 'scheduled'
            }));
          }
          
          vaccinationDays.forEach(vaccinationDay => {
            const normalized = normalizeDate(vaccinationDay.date);
            if (normalized) {
              // Get the correct status field from the bite case
              let actualStatus = vaccinationDay.status;
              
              // If status is undefined, try to get it from the bite case directly
              if (!actualStatus) {
                const statusField = vaccinationDay.day === 'Day 0' ? 'd0Status' :
                                   vaccinationDay.day === 'Day 3' ? 'd3Status' :
                                   vaccinationDay.day === 'Day 7' ? 'd7Status' :
                                   vaccinationDay.day === 'Day 14' ? 'd14Status' :
                                   vaccinationDay.day === 'Day 28' ? 'd28Status' : null;
                
                if (statusField) {
                  actualStatus = biteCase[statusField];
                }
              }
              
              // Default to scheduled if still no status
              actualStatus = actualStatus || 'scheduled';
              
              // Debug: Log what status is being used for each vaccination
              console.log('Creating vaccination entry:', {
                day: vaccinationDay.day,
                date: vaccinationDay.date,
                statusFromVaccinationDay: vaccinationDay.status,
                statusFromBiteCase: biteCase[vaccinationDay.day === 'Day 0' ? 'd0Status' : 
                                             vaccinationDay.day === 'Day 3' ? 'd3Status' :
                                             vaccinationDay.day === 'Day 7' ? 'd7Status' :
                                             vaccinationDay.day === 'Day 14' ? 'd14Status' :
                                             vaccinationDay.day === 'Day 28' ? 'd28Status' : 'unknown'],
                actualStatusUsed: actualStatus,
                biteCaseId: biteCase._id
              });

              // Special debugging for the problematic bite case
              if (biteCase._id === '682f535474c3e8fd25ee8cbf') {
                console.log('🔍 CREATING VACCINATION ENTRY FOR PROBLEMATIC BITE CASE:', {
                  day: vaccinationDay.day,
                  vaccinationDayObject: vaccinationDay,
                  biteCaseStatuses: {
                    d0Status: biteCase.d0Status,
                    d3Status: biteCase.d3Status,
                    d7Status: biteCase.d7Status,
                    d14Status: biteCase.d14Status,
                    d28Status: biteCase.d28Status
                  },
                  finalStatus: actualStatus
                });
              }
              
              vaccinationSchedule.push({
                _id: `${biteCase._id}_${vaccinationDay.day}`,
                originalId: biteCase._id,
                patientId: biteCase.patientId,
                patient: patient,
                biteCaseId: biteCase._id,
                registrationNumber: biteCase.registrationNumber,
                vaccinationDay: vaccinationDay.day,
                scheduledDate: normalized.toISOString(),
                status: actualStatus, // Use the actual status from database
                notes: '',
                isManual: false,
                createdAt: biteCase.createdAt || new Date().toISOString(),
                updatedAt: biteCase.updatedAt,
                treatmentStatus: biteCase.treatmentStatus
              });
            }
          });
        });
        
        setVaccinations(vaccinationSchedule);
        
        if (vaccinationSchedule.length === 0) {
          setShowEmptyState(true);
        }
        
      } catch (error) {
        console.error('Error fetching vaccination data:', error);
        showNotification('Error loading vaccination data. Please check if the backend server is running.', 'error');
        
        // Set empty data to prevent crashes
        setPatients([]);
        setVaccinations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load centers for Center filter
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await apiFetch(apiConfig.endpoints.centers);
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json?.data || json?.centers || []);
        const names = Array.from(new Set((list || [])
          .filter(c => !c.isArchived)
          .map(c => String(c.centerName || c.name || '').trim())
          .filter(Boolean)))
          .sort((a, b) => a.localeCompare(b));
        setCenterOptions(names);
      } catch (_) {
        setCenterOptions([]);
      }
    };
    fetchCenters();
  }, []);

  // Filtered vaccination data
  const filteredVaccinations = useMemo(() => {
    let filtered = vaccinations;

    // Search filter - improved to handle patient name properly
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        if (!v.patient) return false;
        
        // Build full name from patient data
        const fullName = [
          v.patient.firstName,
          v.patient.middleName,
          v.patient.lastName
        ].filter(Boolean).join(' ').toLowerCase();
        
        return (
          fullName.includes(searchLower) ||
          v.patient.patientId?.toLowerCase().includes(searchLower) ||
          v.patient.email?.toLowerCase().includes(searchLower) ||
          v.vaccinationDay?.toLowerCase().includes(searchLower) ||
          v.biteCaseId?.toLowerCase().includes(searchLower)
      );
      });
    }

    // Status filter - improved to work with schedule status
    if (statusFilter) {
      filtered = filtered.filter(v => {
        if (statusFilter === 'missed') {
          return v.status === 'missed' || (v.status === 'scheduled' && new Date(v.scheduledDate) < new Date());
        }
        if (statusFilter === 'today') {
          const today = new Date();
          const vaccinationDate = new Date(v.scheduledDate);
          return vaccinationDate.toDateString() === today.toDateString();
        }
        if (statusFilter === 'scheduled') {
          return v.status === 'scheduled' && new Date(v.scheduledDate) > new Date();
        }
        return v.status === statusFilter;
      });
    }

    // Vaccination day filter
    if (vaccinationDayFilter) {
      filtered = filtered.filter(v => v.vaccinationDay === vaccinationDayFilter);
    }

    // Center filter - improved to be more flexible
    if (centerFilter) {
      const norm = (v) => String(v || '')
        .toLowerCase()
        .replace(/\s*health\s*center$/i, '')
        .replace(/\s*center$/i, '')
        .replace(/-/g, ' ')
        .trim();
      const want = norm(centerFilter);
      filtered = filtered.filter(v => {
        const fromPatient = norm(v.patient?.center || v.patient?.centerName || v.patient?.facility || v.patient?.barangay || '');
        const fromBiteCase = norm(v.patient?.biteCaseCenter || '');
        return fromPatient === want || fromBiteCase === want || fromPatient.includes(want) || want.includes(fromPatient);
      });
    }

    // Date filter - improved date comparison
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(v => {
        const vaccinationDate = new Date(v.scheduledDate);
        vaccinationDate.setHours(0, 0, 0, 0);
        return vaccinationDate.getTime() === filterDate.getTime();
      });
    }

    return filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  }, [searchTerm, statusFilter, vaccinationDayFilter, dateFilter, centerFilter, vaccinations]);

  // Vaccination actions
  const handleMarkCompleted = async (vaccinationId) => {
    try {
      setUpdatingVaccinationId(vaccinationId);
      const vaccination = vaccinations.find(v => v._id === vaccinationId);
      if (!vaccination) {
        showNotification('Vaccination not found', 'error');
        return;
      }

      const statusField = vaccination.vaccinationDay === 'Day 0' ? 'd0Status' :
                         vaccination.vaccinationDay === 'Day 3' ? 'd3Status' :
                         vaccination.vaccinationDay === 'Day 7' ? 'd7Status' :
                         vaccination.vaccinationDay === 'Day 14' ? 'd14Status' :
                         vaccination.vaccinationDay === 'Day 28' ? 'd28Status' : null;

      if (!statusField) {
        showNotification('Invalid vaccination day', 'error');
        return;
      }

      console.log('Updating vaccination status:', {
        biteCaseId: vaccination.originalId,
        statusField,
        status: 'completed'
      });

      // Special debugging for the problematic bite case
      if (vaccination.originalId === '682f535474c3e8fd25ee8cbf') {
        console.log('🔍 UPDATING PROBLEMATIC BITE CASE:', {
          vaccinationId,
          vaccination,
          statusField,
          targetStatus: 'completed'
        });
      }

      // Try multiple API endpoints for updating bite case status
      let response;
      let responseData;
      let updateSuccessful = false;

      // Try different update approaches
      const updatePayloads = [
        { [statusField]: 'completed' }, // Direct field update
        { diagnosis: { [statusField]: 'completed' } }, // Nested in diagnosis
        { vaccinationStatus: { [statusField]: 'completed' } }, // Nested in vaccinationStatus
        { status: 'completed', [statusField]: 'completed' } // Multiple fields
      ];

      const endpoints = [
        `/api/bitecases/${vaccination.originalId}`,
        `/api/bitecases/${vaccination.originalId}/diagnosis`,
        `/api/bitecases/${vaccination.originalId}/vaccination`,
        `/api/bitecases/${vaccination.originalId}/status`
      ];

      // Try each combination until one works
      for (let endpoint of endpoints) {
        for (let payload of updatePayloads) {
          try {
            console.log(`Trying endpoint: ${endpoint} with payload:`, payload);
            response = await fetch(endpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
            });
            responseData = await response.json();
            
            if (response.ok && (responseData.success || responseData.message || response.status === 200)) {
              console.log(`Success with endpoint: ${endpoint}`);
              updateSuccessful = true;
              break;
            }
          } catch (err) {
            console.warn(`Failed endpoint: ${endpoint}`, err);
            continue;
          }
        }
        if (updateSuccessful) break;
      }

      console.log('Final API Response:', responseData);

      // Special debugging for the problematic bite case
      if (vaccination.originalId === '682f535474c3e8fd25ee8cbf') {
        console.log('🔍 API RESPONSE FOR PROBLEMATIC BITE CASE:', {
          updateSuccessful,
          responseOk: response.ok,
          responseData,
          responseStatus: response.status
        });
      }

      if (updateSuccessful || response.ok) {
        showNotification('Vaccination marked as completed', 'success');
        
        // Update local state immediately for better UX
        setVaccinations(prev => {
          const updated = prev.map(v => 
            v._id === vaccinationId ? { ...v, status: 'completed' } : v
          );
          console.log('Updated local state:', updated.find(v => v._id === vaccinationId));
          return updated;
        });
        
        // Force re-render by updating refresh key
        setRefreshKey(prev => prev + 1);
        
        // Don't refresh from backend automatically - keep the local change
        console.log('Local state updated successfully, keeping local changes');
      } else {
        console.error('Backend update failed:', responseData);
        throw new Error(responseData.message || 'Failed to update vaccination status');
      }
    } catch (error) {
      console.error('Error updating vaccination status:', error);
      showNotification('Error updating vaccination status: ' + error.message, 'error');
    } finally {
      setUpdatingVaccinationId(null);
    }
  };

  const handleMarkMissed = async (vaccinationId) => {
    try {
      setUpdatingVaccinationId(vaccinationId);
      const vaccination = vaccinations.find(v => v._id === vaccinationId);
      if (!vaccination) {
        showNotification('Vaccination not found', 'error');
        return;
      }

      const statusField = vaccination.vaccinationDay === 'Day 0' ? 'd0Status' :
                         vaccination.vaccinationDay === 'Day 3' ? 'd3Status' :
                         vaccination.vaccinationDay === 'Day 7' ? 'd7Status' :
                         vaccination.vaccinationDay === 'Day 14' ? 'd14Status' :
                         vaccination.vaccinationDay === 'Day 28' ? 'd28Status' : null;

      if (!statusField) {
        showNotification('Invalid vaccination day', 'error');
        return;
      }

      console.log('Updating vaccination status:', {
        biteCaseId: vaccination.originalId,
        statusField,
        status: 'missed'
      });

      // Try multiple API endpoints for updating bite case status
      let response;
      let responseData;
      let updateSuccessful = false;

      // Try different update approaches
      const updatePayloads = [
        { [statusField]: 'missed' }, // Direct field update
        { diagnosis: { [statusField]: 'missed' } }, // Nested in diagnosis
        { vaccinationStatus: { [statusField]: 'missed' } }, // Nested in vaccinationStatus
        { status: 'missed', [statusField]: 'missed' } // Multiple fields
      ];

      const endpoints = [
        `/api/bitecases/${vaccination.originalId}`,
        `/api/bitecases/${vaccination.originalId}/diagnosis`,
        `/api/bitecases/${vaccination.originalId}/vaccination`,
        `/api/bitecases/${vaccination.originalId}/status`
      ];

      // Try each combination until one works
      for (let endpoint of endpoints) {
        for (let payload of updatePayloads) {
          try {
            console.log(`Trying endpoint: ${endpoint} with payload:`, payload);
            response = await fetch(endpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
            });
            responseData = await response.json();
            
            if (response.ok && (responseData.success || responseData.message || response.status === 200)) {
              console.log(`Success with endpoint: ${endpoint}`);
              updateSuccessful = true;
              break;
            }
          } catch (err) {
            console.warn(`Failed endpoint: ${endpoint}`, err);
            continue;
          }
        }
        if (updateSuccessful) break;
      }

      console.log('Final API Response:', responseData);

      if (updateSuccessful || response.ok) {
        showNotification('Vaccination marked as missed', 'success');
        
        // Update local state immediately for better UX
        setVaccinations(prev => {
          const updated = prev.map(v => 
            v._id === vaccinationId ? { ...v, status: 'missed' } : v
          );
          console.log('Updated local state:', updated.find(v => v._id === vaccinationId));
          return updated;
        });
        
        // Force re-render by updating refresh key
        setRefreshKey(prev => prev + 1);
        
        // Don't refresh from backend automatically - keep the local change
        console.log('Local state updated successfully, keeping local changes');
      } else {
        console.error('Backend update failed:', responseData);
        throw new Error(responseData.message || 'Failed to update vaccination status');
      }
    } catch (error) {
      console.error('Error updating vaccination status:', error);
      showNotification('Error updating vaccination status: ' + error.message, 'error');
    } finally {
      setUpdatingVaccinationId(null);
    }
  };

  const handleReschedule = async (vaccinationId, newDate) => {
    try {
      setUpdatingVaccinationId(vaccinationId);
      const vaccination = vaccinations.find(v => v._id === vaccinationId);
      if (!vaccination) {
        showNotification('Vaccination not found', 'error');
        return;
      }

      const dateField = vaccination.vaccinationDay === 'Day 0' ? 'd0Date' :
                       vaccination.vaccinationDay === 'Day 3' ? 'd3Date' :
                       vaccination.vaccinationDay === 'Day 7' ? 'd7Date' :
                       vaccination.vaccinationDay === 'Day 14' ? 'd14Date' :
                       vaccination.vaccinationDay === 'Day 28' ? 'd28Date' : null;

      if (!dateField) {
        showNotification('Invalid vaccination day', 'error');
        return;
      }

      console.log('Rescheduling vaccination:', {
        biteCaseId: vaccination.originalId,
        dateField,
        newDate: new Date(newDate).toISOString()
      });

      // Try multiple API endpoints for updating bite case date
      let response;
      let responseData;

      // First try the standard bite case update endpoint (apiFetch ensures baseURL)
      try {
        response = await apiFetch(`${apiConfig.endpoints.bitecases}/${vaccination.originalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [dateField]: new Date(newDate).toISOString() })
      });
        responseData = await response.json();
      } catch (err) {
        console.warn('Primary endpoint failed, trying diagnosis endpoint:', err);
        // Fallback to diagnosis endpoint
        response = await apiFetch(`${apiConfig.endpoints.bitecases}/${vaccination.originalId}/diagnosis`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [dateField]: new Date(newDate).toISOString() })
        });
        responseData = await response.json();
      }

      console.log('API Response:', responseData);

      if (response.ok && (responseData.success || responseData.message === 'Bite case updated successfully')) {
        showNotification('Vaccination rescheduled successfully', 'success');
        
        // Update local state immediately for better UX
        setVaccinations(prev => prev.map(v => 
          v._id === vaccinationId ? { ...v, scheduledDate: new Date(newDate).toISOString() } : v
        ));
        
        // Also refresh data from backend to ensure consistency
        setTimeout(() => handleRefreshData(), 500);
      } else {
        throw new Error(responseData.message || 'Failed to reschedule vaccination');
      }
    } catch (error) {
      console.error('Error rescheduling vaccination:', error);
      showNotification('Error rescheduling vaccination: ' + error.message, 'error');
    } finally {
      setUpdatingVaccinationId(null);
    }
  };

  // Reschedule a given day and cascade updates to later days only, marking past ones as missed
  const handleRescheduleCascade = async (dayLabel, newDateStr, patientIdForScope) => {
    try {
      const scopePatientId = patientIdForScope || selectedPatientDetail?.patient?.patientId || null;
      // Find any vaccination entry for this day to extract ids within the same patient scope
      const anyEntry = vaccinations.find(v => v.vaccinationDay === dayLabel && (!scopePatientId || v.patient?.patientId === scopePatientId));
      if (!anyEntry) return;
      await handleReschedule(anyEntry._id, newDateStr);

      // Update local schedule list in modal: set chosen day date/status, recompute later dates from chosen base
      setScheduleModalData(prev => {
        if (!prev) return prev;
        const labels = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
        const dayIndex = labels.indexOf(dayLabel);
        const base = new Date(newDateStr);
        const addDays = [0,3,7,14,28];
        const nextSchedule = (prev.schedule || []).map(item => {
          const idx = labels.indexOf(item.label);
          if (idx < dayIndex) {
            // earlier days unaffected
            return item;
          }
          if (idx === dayIndex) {
            return { ...item, date: new Date(base).toISOString(), status: 'scheduled' };
          }
          const d = new Date(base);
          d.setDate(d.getDate() + (addDays[idx] - addDays[dayIndex]));
          return { ...item, date: d.toISOString(), status: 'scheduled' };
        });
        return { ...prev, schedule: nextSchedule };
      });

      // After changing the plan, mark any previously scheduled past dates as missed locally
      setVaccinations(prev => prev.map(v => {
        if (v.vaccinationDay === dayLabel && new Date(v.scheduledDate).toISOString().slice(0,10) !== newDateStr) {
          return { ...v, scheduledDate: new Date(newDateStr).toISOString(), status: 'scheduled' };
        }
        // For downstream days for same patient, recompute relative if they were scheduled
        const labels = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
        const addDays = [0,3,7,14,28];
        const idxV = labels.indexOf(v.vaccinationDay);
        const idxBase = labels.indexOf(dayLabel);
        if (v.patient?.patientId === anyEntry.patient?.patientId && idxV > idxBase) {
          const d = new Date(newDateStr);
          d.setDate(d.getDate() + (addDays[idxV] - addDays[idxBase]));
          return { ...v, scheduledDate: d.toISOString(), status: 'scheduled' };
        }
        // If a scheduled date is already in the past, mark as missed
        if (v.status === 'scheduled' && new Date(v.scheduledDate) < new Date()) {
          return { ...v, status: 'missed' };
        }
        return v;
      }));
    } catch (e) {
      console.warn('Failed cascade reschedule:', e);
    }
  };

  // Build a preview of cascade changes and validations
  const buildCascadePreview = (dayLabel, newDateStr) => {
    const labels = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
    const addDays = [0,3,7,14,28];
    const idxBase = labels.indexOf(dayLabel);
    const baseDate = new Date(newDateStr);
    const errors = [];
    if (isNaN(baseDate.getTime())) errors.push('Invalid date.');
    const today = new Date(); today.setHours(0,0,0,0);
    if (baseDate < today) errors.push('Date cannot be in the past.');
    // Validate not earlier than previous dose date (if exists)
    const schedule = scheduleModalData?.schedule || [];
    if (idxBase > 0) {
      const prevLabel = labels[idxBase-1];
      const prev = schedule.find(s => s.label === prevLabel);
      if (prev && prev.date) {
        const prevDate = new Date(prev.date);
        if (baseDate < prevDate) {
          errors.push(`${dayLabel} cannot be earlier than ${prevLabel} (${formatScheduleDate(prev.date)}).`);
        }
      }
    }
    const affected = [];
    if (!errors.length) {
      for (let i = idxBase; i < labels.length; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + (addDays[i] - addDays[idxBase]));
        affected.push({ label: labels[i], date: d.toISOString() });
      }
    }
    return { errors, affected };
  };

  // Handle edit vaccination
  const handleEditVaccination = (vaccination) => {
    if (vaccination?.status && vaccination.status !== 'scheduled') {
      showNotification('This dose is view-only because it is already ' + vaccination.status + '.', 'info');
      return;
    }
    setSelectedVaccination(vaccination);
    setFormData({
      patientId: vaccination.patient?.patientId || '',
      vaccinationDay: vaccination.vaccinationDay || '',
      scheduledDate: vaccination.scheduledDate ? new Date(vaccination.scheduledDate).toISOString().split('T')[0] : '',
      notes: vaccination.notes || '',
      status: vaccination.status || 'scheduled'
    });
    setShowEditModal(true);
  };

  // Handle update vaccination
  const handleUpdateVaccination = async () => {
    if (!selectedVaccination) {
      showNotification('No vaccination selected', 'error');
      return;
    }
    
    setFormErrors({});
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsProcessing(true);
    
    try {
      const statusField = formData.vaccinationDay === 'Day 0' ? 'd0Status' :
                         formData.vaccinationDay === 'Day 3' ? 'd3Status' :
                         formData.vaccinationDay === 'Day 7' ? 'd7Status' :
                         formData.vaccinationDay === 'Day 14' ? 'd14Status' :
                         formData.vaccinationDay === 'Day 28' ? 'd28Status' : null;

      const dateField = formData.vaccinationDay === 'Day 0' ? 'd0Date' :
                       formData.vaccinationDay === 'Day 3' ? 'd3Date' :
                       formData.vaccinationDay === 'Day 7' ? 'd7Date' :
                       formData.vaccinationDay === 'Day 14' ? 'd14Date' :
                       formData.vaccinationDay === 'Day 28' ? 'd28Date' : null;

      const updateData = {};
      if (statusField) updateData[statusField] = formData.status;
      if (dateField) updateData[dateField] = new Date(formData.scheduledDate).toISOString();

      console.log('Updating vaccination:', {
        biteCaseId: selectedVaccination.originalId,
        updateData
      });

      // Try multiple API endpoints for updating bite case
      let response;
      let responseData;

      // First try the standard bite case update endpoint
      try {
        response = await fetch(`/api/bitecases/${selectedVaccination.originalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
        responseData = await response.json();
      } catch (err) {
        console.warn('Primary endpoint failed, trying diagnosis endpoint:', err);
        // Fallback to diagnosis endpoint
        response = await fetch(`/api/bitecases/${selectedVaccination.originalId}/diagnosis`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });
        responseData = await response.json();
      }

      console.log('API Response:', responseData);

      if (response.ok && (responseData.success || responseData.message === 'Bite case updated successfully')) {
        // Update local state immediately for better UX
        setVaccinations(prev => prev.map(v => 
          v._id === selectedVaccination._id ? {
            ...v,
            vaccinationDay: formData.vaccinationDay,
            scheduledDate: new Date(formData.scheduledDate).toISOString(),
            status: formData.status,
            notes: formData.notes
          } : v
        ));
        
        setShowEditModal(false);
        setSelectedVaccination(null);
        showNotification('Vaccination updated successfully', 'success');
        
        // Also refresh data from backend to ensure consistency
        setTimeout(() => handleRefreshData(), 500);
        
        // Reset form
        setFormData({
          patientId: '',
          vaccinationDay: '',
          scheduledDate: '',
          notes: '',
          status: 'scheduled'
        });
      } else {
        throw new Error(responseData.message || 'Failed to update vaccination');
      }
    } catch (error) {
      console.error('Error updating vaccination:', error);
      showNotification('Error updating vaccination: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.patientId) {
      errors.patientId = 'Please select a patient';
    }
    
    if (!formData.vaccinationDay) {
      errors.vaccinationDay = 'Please select a vaccination day';
    }
    
    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Please select a scheduled date';
    } else {
      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.scheduledDate = 'Scheduled date cannot be in the past';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // If user changes the scheduled date, auto-set status back to scheduled
      if (field === 'scheduledDate' && value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(selectedDate.getTime()) && selectedDate >= today) {
          next.status = 'scheduled';
        }
      }
      return next;
    });
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle schedule vaccination
  const handleScheduleVaccination = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsProcessing(true);
      
      showNotification('Manual vaccination scheduling is not available. Vaccination schedules are automatically created from bite cases.', 'info');
      
      // Reset form
      setFormData({
        patientId: '',
        vaccinationDay: '',
        scheduledDate: '',
        status: 'scheduled',
        notes: ''
      });
      setFormErrors({});
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Error scheduling vaccination:', error);
      showNotification('Error scheduling vaccination', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Close add modal
  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({
      patientId: '',
      vaccinationDay: '',
      scheduledDate: '',
      status: 'scheduled',
      notes: ''
    });
    setFormErrors({});
  };

  // Close empty state
  const closeEmptyState = () => {
    setShowEmptyState(false);
  };

  // Handle refresh data
  const handleRefreshData = async () => {
    try {
      console.log('Refreshing vaccination data...');
      
      const userCenter = getUserCenter();
      
      // Build API URL with center filter for non-superadmin users
      let vaccinationUrl = apiConfig.endpoints.bitecases;
      if (userCenter && userCenter !== 'all') {
        vaccinationUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      // Fetch bite cases which contain vaccination data
      const vaccinationRes = await apiFetch(vaccinationUrl);
      const vaccinationData = await vaccinationRes.json();
      
      // Handle different response formats
      let biteCases = [];
      
      if (Array.isArray(vaccinationData)) {
        biteCases = vaccinationData;
      } else if (vaccinationData.success && vaccinationData.data && Array.isArray(vaccinationData.data)) {
        biteCases = vaccinationData.data;
      } else if (vaccinationData.data && Array.isArray(vaccinationData.data)) {
        biteCases = vaccinationData.data;
      }
      
      console.log('Fetched bite cases:', biteCases.length);
      
      // Process bite cases and populate patient information
      const vaccinationSchedule = [];
      biteCases.forEach(biteCase => {
        // Patient matching with fallback
        let patient = patients.find(p => 
          p?._id === biteCase.patientId ||
          p?.patientId === biteCase.patientId ||
          (biteCase.registrationNumber && p?.registrationNumber === biteCase.registrationNumber)
        );

        if (!patient) {
          const fallbackFullName = (biteCase.fullName && String(biteCase.fullName).trim().length > 0)
            ? biteCase.fullName
            : `${biteCase.firstName || ''} ${biteCase.middleName || ''} ${biteCase.lastName || ''}`.replace(/\s+/g, ' ').trim();
          patient = {
            _id: biteCase.patientId || biteCase._id,
            patientId: biteCase.patientId || '',
            fullName: fallbackFullName || 'Unknown Patient',
            email: biteCase.email || '',
            firstName: biteCase.firstName || '',
            middleName: biteCase.middleName || '',
            lastName: biteCase.lastName || ''
          };
        }

        // Build vaccination day list (per-day fields or scheduleDates array)
        let vaccinationDays = [
          { day: 'Day 0',  date: biteCase.d0Date,  status: biteCase.d0Status },
          { day: 'Day 3',  date: biteCase.d3Date,  status: biteCase.d3Status },
          { day: 'Day 7',  date: biteCase.d7Date,  status: biteCase.d7Status },
          { day: 'Day 14', date: biteCase.d14Date, status: biteCase.d14Status },
          { day: 'Day 28', date: biteCase.d28Date, status: biteCase.d28Status }
        ];

        // Debug: Log the status values from database
        console.log('Refreshing bite case statuses:', {
          biteCaseId: biteCase._id,
          d0Status: biteCase.d0Status,
          d3Status: biteCase.d3Status,
          d7Status: biteCase.d7Status,
          d14Status: biteCase.d14Status,
          d28Status: biteCase.d28Status
        });

        if ((!vaccinationDays[0].date && !vaccinationDays[1].date && !vaccinationDays[2].date && !vaccinationDays[3].date && !vaccinationDays[4].date) && Array.isArray(biteCase.scheduleDates) && biteCase.scheduleDates.length > 0) {
          const mapIndexToDay = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
          vaccinationDays = mapIndexToDay.map((label, idx) => ({
            day: label,
            date: biteCase.scheduleDates[idx],
            status: biteCase.status === 'completed' ? 'completed' : 'scheduled'
          }));
        }

        vaccinationDays.forEach(vaccinationDay => {
          const normalized = normalizeDate(vaccinationDay.date);
          if (normalized) {
            // try to derive vaccine info for the specific dose from biteCase
            const doseCode = getDoseCodeFromDay(vaccinationDay.day);
            const brandName = biteCase.brandName || biteCase.currentImmunization?.doseMedicines?.find?.(d => d.dose === doseCode)?.medicineUsed || '';
            const genericName = biteCase.genericName || '';
            const route = biteCase.route || biteCase.currentImmunization?.route?.[0] || '';
            
            // Get the correct status field from the bite case
            let actualStatus = vaccinationDay.status;
            
            // If status is undefined, try to get it from the bite case directly
            if (!actualStatus) {
              const statusField = vaccinationDay.day === 'Day 0' ? 'd0Status' :
                                 vaccinationDay.day === 'Day 3' ? 'd3Status' :
                                 vaccinationDay.day === 'Day 7' ? 'd7Status' :
                                 vaccinationDay.day === 'Day 14' ? 'd14Status' :
                                 vaccinationDay.day === 'Day 28' ? 'd28Status' : null;
              
              if (statusField) {
                actualStatus = biteCase[statusField];
              }
            }
            
            // Default to scheduled if still no status
            actualStatus = actualStatus || 'scheduled';
            
            console.log('Creating refreshed vaccination entry:', {
              day: vaccinationDay.day,
              date: vaccinationDay.date,
              statusFromVaccinationDay: vaccinationDay.status,
              statusFromBiteCase: biteCase[vaccinationDay.day === 'Day 0' ? 'd0Status' : 
                                           vaccinationDay.day === 'Day 3' ? 'd3Status' :
                                           vaccinationDay.day === 'Day 7' ? 'd7Status' :
                                           vaccinationDay.day === 'Day 14' ? 'd14Status' :
                                           vaccinationDay.day === 'Day 28' ? 'd28Status' : 'unknown'],
              actualStatusUsed: actualStatus,
              biteCaseId: biteCase._id
            });
            
            vaccinationSchedule.push({
              _id: `${biteCase._id}_${vaccinationDay.day}`,
              originalId: biteCase._id,
              patientId: biteCase.patientId,
              patient: patient,
              biteCaseId: biteCase._id,
              registrationNumber: biteCase.registrationNumber,
              vaccinationDay: vaccinationDay.day,
              scheduledDate: normalized.toISOString(),
              status: actualStatus, // Use the actual status from database
              notes: '',
              isManual: false,
              vaccineBrand: brandName,
              vaccineGeneric: genericName,
              vaccineRoute: route,
              vaccineDose: doseCode,
              createdAt: biteCase.createdAt || new Date().toISOString(),
              updatedAt: biteCase.updatedAt,
              treatmentStatus: biteCase.treatmentStatus
            });
          }
        });
      });
      
      console.log('Refreshed vaccination schedule:', vaccinationSchedule.length);
      console.log('Sample vaccination after refresh:', vaccinationSchedule[0]);
      setVaccinations(vaccinationSchedule);
      setShowEmptyState(false);
      
      if (vaccinationSchedule.length === 0) {
        setShowEmptyState(true);
      }
      
      
    } catch (error) {
      console.error('Error refreshing vaccination data:', error);
      showNotification('Error refreshing vaccination data', 'error');
    }
  };

  // Calendar utility functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getVaccinationsForDate = (day) => {
    if (!day) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return filteredVaccinations.filter(v => {
      const vaccinationDate = new Date(v.scheduledDate).toISOString().split('T')[0];
      return vaccinationDate === dateStr;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Group vaccinations by patient with improved filtering
  const vaccinationsByPatient = useMemo(() => {
    const grouped = {};
    
    // Group vaccinations by patient
    filteredVaccinations.forEach(vaccination => {
      const patientId = vaccination.patient?.patientId || 'unknown';
      if (!grouped[patientId]) {
        grouped[patientId] = {
          patient: vaccination.patient,
          vaccinations: []
        };
      }
      grouped[patientId].vaccinations.push(vaccination);
    });
    
    // Sort vaccinations by day for each patient
    Object.values(grouped).forEach(group => {
      group.vaccinations.sort((a, b) => {
        const dayA = parseInt(a.vaccinationDay.replace('Day ', ''));
        const dayB = parseInt(b.vaccinationDay.replace('Day ', ''));
        return dayA - dayB;
      });
    });
    
    // Apply additional patient-level filters
    const filteredGroups = {};
    Object.entries(grouped).forEach(([patientId, patientData]) => {
      let shouldInclude = true;
      
      // Status filter at patient level (check if any vaccination matches)
      if (statusFilter) {
        const hasMatchingStatus = patientData.vaccinations.some(v => {
          if (statusFilter === 'missed') {
            return v.status === 'missed' || (v.status === 'scheduled' && new Date(v.scheduledDate) < new Date());
          }
          if (statusFilter === 'today') {
            const today = new Date();
            const vaccinationDate = new Date(v.scheduledDate);
            return vaccinationDate.toDateString() === today.toDateString();
          }
          if (statusFilter === 'scheduled') {
            return v.status === 'scheduled' && new Date(v.scheduledDate) > new Date();
          }
          return v.status === statusFilter;
        });
        shouldInclude = shouldInclude && hasMatchingStatus;
      }
      
      // Vaccination day filter at patient level
      if (vaccinationDayFilter) {
        const hasMatchingDay = patientData.vaccinations.some(v => v.vaccinationDay === vaccinationDayFilter);
        shouldInclude = shouldInclude && hasMatchingDay;
      }
      
      // Date filter at patient level
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filterDate.setHours(0, 0, 0, 0);
        const hasMatchingDate = patientData.vaccinations.some(v => {
          const vaccinationDate = new Date(v.scheduledDate);
          vaccinationDate.setHours(0, 0, 0, 0);
          return vaccinationDate.getTime() === filterDate.getTime();
        });
        shouldInclude = shouldInclude && hasMatchingDate;
      }
      
      if (shouldInclude) {
        filteredGroups[patientId] = patientData;
      }
    });
    
    return filteredGroups;
  }, [filteredVaccinations, statusFilter, vaccinationDayFilter, dateFilter]);

  // Get status badge class
  const getStatusBadgeClass = (status, scheduledDate) => {
    const today = new Date();
    const vaccinationDate = new Date(scheduledDate);
    
    // Use the actual status from database first
    if (status === 'completed') return 'status-completed';
    if (status === 'missed') return 'status-missed';
    
    // Only calculate overdue if status is still 'scheduled' and date has passed
    if (status === 'scheduled' && vaccinationDate < today) return 'status-missed';
    if (status === 'scheduled' && vaccinationDate.toDateString() === today.toDateString()) return 'status-today';
    if (status === 'scheduled') return 'status-scheduled';
    
    // Default fallback
    return 'status-scheduled';
  };

  // Get status text
  const getStatusText = (status, scheduledDate) => {
    const today = new Date();
    const vaccinationDate = new Date(scheduledDate);
    
    // Use the actual status from database first
    if (status === 'completed') return 'Completed';
    if (status === 'missed') return 'Missed';
    
    // Only calculate overdue if status is still 'scheduled' and date has passed
    if (status === 'scheduled' && vaccinationDate < today) return 'Missed';
    if (status === 'scheduled' && vaccinationDate.toDateString() === today.toDateString()) return 'Today';
    if (status === 'scheduled') return 'Scheduled';
    
    // Default fallback
    return 'Scheduled';
  };

  // Calendar view helpers
  const getUpcomingVaccinations = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return filteredVaccinations.filter(v => {
      const vaccinationDate = new Date(v.scheduledDate);
      return vaccinationDate >= today && vaccinationDate <= nextWeek && v.status === 'scheduled';
    });
  };

  const getTodaysVaccinations = () => {
    const today = new Date();
    return filteredVaccinations.filter(v => {
      const vaccinationDate = new Date(v.scheduledDate);
      return vaccinationDate.toDateString() === today.toDateString();
    });
  };

  return (
    <>
    <div className="dashboard-container" key={refreshKey}>
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">
        <div className="content-header">
          <h2>Vaccine Schedule Tracker</h2>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              type="button"
            >
              <i className="fa-solid fa-id-card"></i> Cards
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              type="button"
            >
              <i className="fa-solid fa-list"></i> List
            </button>
          </div>
          </div>

        <div className="vaccination-container">

          {/* Search and Filters */}
          <div className="filters-container">
            <div className="search-box">
              <i className="fa fa-search" />
              <input
                type="text"
                placeholder="Search by patient name, bite case ID, or vaccination day..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <select 
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter by health center"
                title="Filter by health center"
              >
                <option value="">All Centers</option>
                {centerOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter by vaccination status"
                title="Filter by status"
              >
                <option value="">All Status</option>
                <option value="today">Today</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
              
              <select 
                value={vaccinationDayFilter} 
                onChange={(e) => setVaccinationDayFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter by vaccination day"
                title="Filter by day"
              >
                <option value="">All Days</option>
                <option value="Day 0">Day 0</option>
                <option value="Day 3">Day 3</option>
                <option value="Day 7">Day 7</option>
                <option value="Day 14">Day 14</option>
                <option value="Day 28">Day 28</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
                placeholder="Filter by date"
                aria-label="Filter by specific date"
                title="Filter by date"
              />

              <button type="button" className="btn-secondary" onClick={clearFilters} title="Clear all filters" aria-label="Clear all applied filters">
                Clear Filters
              </button>
            </div>
          </div>

          {/* Views */}
              {loading ? (
                <UnifiedSpinner text="Loading vaccination schedules..." />
              ) : Object.keys(vaccinationsByPatient).length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-state-message">
                    <i className="fa-solid fa-users"></i>
                    <span>No patients with vaccination schedules found</span>
                  </div>
                </div>
              ) : viewMode === 'card' ? (
                <div className="patients-grid">
                  {Object.entries(vaccinationsByPatient).map(([patientId, patientData]) => (
                <div 
                  key={patientId} 
                  className="patient-card clickable-card"
                  onClick={(e) => {
                    console.log('🔍 Patient card clicked:', patientData?.patient?.patientId);
                    e.preventDefault();
                    e.stopPropagation();
                    openPatientScheduleModal(patientData);
                  }}
                >
                      <div className="patient-header">
                        <div className="patient-info">
                          <h3>{getPatientDisplayName(patientData.patient)}</h3>
                          <p className="patient-id">ID: {patientData.patient?.patientId || 'N/A'}</p>
                          {(() => {
                            const scheduleStatus = getScheduleStatus(patientData);
                            return (
                              <p className="schedule-status" style={{ color: scheduleStatus.color, fontWeight: 'bold' }}>
                                Status: {scheduleStatus.status}
                              </p>
                            );
                          })()}
                    </div>
                        <div className="patient-status">
                      <div className="click-hint">
                        <i className="fa-solid fa-mouse-pointer"></i>
                        <span>Click to view details</span>
                    </div>
                      </div>
                    </div>
                  </div>
                  ))}
            </div>
          ) : (
            <div className="calendar-view" style={{paddingTop: 0}}>
              <div className="schedule-table-wrapper">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Patient ID</th>
                      <th>Next Dose</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVaccinations.map(v => (
                      <tr key={v._id} onClick={(e) => {
                        console.log('🔍 Table row clicked for patient:', v.patient?.patientId);
                        e.preventDefault();
                        e.stopPropagation();
                        openPatientScheduleModal(vaccinationsByPatient[v.patient?.patientId || 'unknown']);
                      }} style={{cursor:'pointer'}}>
                        <td>{getPatientDisplayName(v.patient)}</td>
                        <td>{v.patient?.patientId || 'N/A'}</td>
                        <td>{v.vaccinationDay}</td>
                        <td>{formatScheduleDate(v.scheduledDate)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(v.status, v.scheduledDate)}`}>{getStatusText(v.status, v.scheduledDate)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Empty State Notification */}
      {showEmptyState && (
        <div className="empty-state-notification">
          <div className="empty-notification-content">
            <div className="empty-notification-icon">
              <i className="fa-solid fa-calendar-xmark"></i>
            </div>
            <div className="empty-notification-text">
              <h4>No Vaccination Schedules Found</h4>
              <p>No vaccination schedules are currently available. This could be because no bite cases have been recorded or the backend server is not running.</p>
            </div>
            <div className="empty-notification-actions">
                    <button 
                className="btn-refresh-small"
                onClick={handleRefreshData}
                    >
                <i className="fa-solid fa-refresh"></i> Refresh
                    </button>
                    <button 
                className="btn-close-small"
                onClick={closeEmptyState}
                    >
                <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                    </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <UnifiedModal
        isOpen={showConfirmModal}
        onClose={handleCancel}
        title="Confirm Action"
        message={confirmAction?.message}
        icon={<i className="fa-solid fa-question-circle"></i>}
        iconType="warning"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        isLoading={isProcessing}
        loadingText="Processing..."
      />
        {/* New X-only Schedule Modal */}
        {console.log('🔍 Modal render check - showScheduleModal:', showScheduleModal)}
        {showScheduleModal && (
          <div 
            className="schedule-modal-overlay"
            onClick={() => {
              console.log('🔍 Modal backdrop clicked - closing modal');
              setShowScheduleModal(false);
            }}
          >
            <div 
              className="schedule-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                className="schedule-modal-close"
                onClick={() => setShowScheduleModal(false)} 
                aria-label="Close"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {scheduleModalLoading ? (
                <div className="schedule-loading">
                  <div className="schedule-loading-spinner"></div>
                  <span className="schedule-loading-text">Loading vaccination schedule...</span>
                </div>
              ) : (
                <div className="schedule-modal-body">
                  {/* Patient Header */}
                  <div className="patient-header-card">
                    <h3 className="patient-name">
                      {getPatientDisplayName(scheduleModalData?.patient)}
                    </h3>
                    <p className="patient-id">
                      ID: {scheduleModalData?.patient?.patientId || 'N/A'}
                    </p>
                    <div className="patient-location">
                      {scheduleModalData?.patient?.barangay && (
                        <span>📍 Barangay: {scheduleModalData.patient.barangay}</span>
                      )}
                      {scheduleModalData?.patient?.center && (
                        <span>🏥 Center: {scheduleModalData.patient.center}</span>
                      )}
                    </div>
                  </div>

                  {/* Vaccine Meta Info */}
                  {(scheduleModalData?.generic || scheduleModalData?.route) && (
                    <div className="vaccine-info-grid">
                      {scheduleModalData?.generic && (
                        <div className="vaccine-info-card">
                          <p className="vaccine-info-label">Generic Name</p>
                          <p className="vaccine-info-value">{scheduleModalData.generic}</p>
                        </div>
                      )}
                      {scheduleModalData?.route && (
                        <div className="vaccine-info-card">
                          <p className="vaccine-info-label">Route</p>
                          <p className="vaccine-info-value">{scheduleModalData.route}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Complete Vaccination Schedule */}
                  <div className="schedule-container">
                    <div className="schedule-header">
                      <h2 className="schedule-title">Vaccination Schedule</h2>
                      <p className="schedule-subtitle">Complete vaccination timeline and status</p>
                    </div>
                    <div className="schedule-content">
                      {scheduleModalData?.schedule && scheduleModalData.schedule.length > 0 ? (
                        <div>
                          {scheduleModalData.schedule.map((scheduleItem, index) => {
                            const isCompleted = scheduleItem.status === 'completed';
                            const isMissed = scheduleItem.status === 'missed';
                            const isScheduled = scheduleItem.status === 'scheduled';
                            const isUpcoming = new Date(scheduleItem.date) > new Date();
                            
                            return (
                              <div 
                                key={scheduleItem.label}
                                className={`schedule-item ${
                                  isCompleted ? 'completed' : 
                                  isMissed ? 'missed' : 
                                  isScheduled ? 'scheduled' : 'pending'
                                }`}
                              >
                                {/* Status Indicator */}
                                <div className={`schedule-status-indicator ${
                                  isCompleted ? 'completed' : 
                                  isMissed ? 'missed' : 
                                  isScheduled ? 'scheduled' : 'pending'
                                }`}></div>

                                <div className="schedule-item-content">
                                  {/* Day Badge */}
                                  <div className={`schedule-day-badge ${
                                    isCompleted ? 'completed' : 
                                    isMissed ? 'missed' : 
                                    isScheduled ? 'scheduled' : 'pending'
                                  }`}>
                                    {scheduleItem.label.replace('Day ', 'D')}
                                  </div>

                                  {/* Content */}
                                  <div className="schedule-details">
                                    <div className="schedule-details-header">
                                      <h3 className="schedule-day-title">
                                        {scheduleItem.label}
                                      </h3>
                                      <span className={`schedule-status-badge ${
                                        isCompleted ? 'completed' : 
                                        isMissed ? 'missed' : 
                                        isScheduled ? 'scheduled' : 'pending'
                                      }`}>
                                        {isCompleted ? '✅ Completed' : 
                                         isMissed ? '❌ Missed' : 
                                         isScheduled ? '📅 Scheduled' : '⏸️ Pending'}
                                      </span>
                                    </div>

                                    <div className="schedule-info-grid">
                                      <div className="schedule-info-item">
                                        <p className="schedule-info-label">Scheduled Date</p>
                                        <p className="schedule-info-value">
                                          {scheduleItem.date ? formatScheduleDate(scheduleItem.date) : 'Not scheduled'}
                                        </p>
                                      </div>
                                      <div className="schedule-info-item">
                                        <p className="schedule-info-label">Vaccine Type</p>
                                        <p className="schedule-info-value">
                                          {scheduleModalData?.brand || scheduleModalData?.generic || 'Anti-Rabies'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {isScheduled && (
                                      <div className="schedule-actions">
                                        <button
                                          onClick={() => {
                                            setScheduleModalData(prev => ({
                                              ...prev,
                                              schedule: prev.schedule.map(item => 
                                                item.label === scheduleItem.label 
                                                  ? { ...item, status: 'completed' } 
                                                  : item
                                              )
                                            }));
                                          }}
                                          className="schedule-action-btn complete"
                                        >
                                          Mark as Completed
                                        </button>
                                        <button
                                          onClick={() => {
                                            setScheduleModalData(prev => ({
                                              ...prev,
                                              schedule: prev.schedule.map(item => 
                                                item.label === scheduleItem.label 
                                                  ? { ...item, status: 'missed' } 
                                                  : item
                                              )
                                            }));
                                          }}
                                          className="schedule-action-btn miss"
                                        >
                                          Mark as Missed
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="schedule-empty-state">
                          <div className="schedule-empty-icon">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="schedule-empty-title">No Schedule Found</h3>
                          <p className="schedule-empty-description">This patient doesn't have a vaccination schedule yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(SuperAdminVaccinationSchedule);
