import React, { useState, useEffect, useMemo } from 'react';
// import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import { apiFetch } from '../../config/api';
import { fullLogout } from '../../utils/auth';
import LoadingSpinner from './DogLoadingSpinner';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import './SuperAdminStock.css';

const SuperAdminStock = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy] = useState('centerName');
  const [sortOrder] = useState('asc');
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [centers, setCenters] = useState([]);
  const [availableVaccines, setAvailableVaccines] = useState([]);
  const [formData, setFormData] = useState({
    center: '',
    vaccineName: '',
    vaccineType: '',
    brand: '',
    quantity: '',
    expiryDate: '',
    batchNumber: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [expandedCenters, setExpandedCenters] = useState(new Set());
  const [expandedVaccines, setExpandedVaccines] = useState(new Set());
  // Inline quick add state keyed by `${centerName}::${vaccineName}`
  const [quickAdd, setQuickAdd] = useState({});
  // Small modal for per‑vaccine add
  const [quickModal, setQuickModal] = useState({ open:false, centerName:'', vaccine:null, quantity:'', batchNumber:'', expiryDate:'' });
  // Lightweight toast notification for real-time feedback
  const [toast, setToast] = useState({ show:false, message:'', type:'info' });
  const showToast = (message, type='info') => {
    setToast({ show:true, message, type });
    setTimeout(() => setToast({ show:false, message:'', type:'info' }), 2500);
  };

  const updateQuickAdd = (key, field, value) => {
    setQuickAdd(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { quantity: '', batchNumber: '', expiryDate: '', minThreshold: '10' }), [field]: value }
    }));
  };

  const submitQuickAdd = async (centerName, vaccine, override) => {
    const key = `${centerName}::${vaccine.name}`;
    const qa = override || quickAdd[key] || {};
    const qty = parseInt(qa.quantity);
    if (!centerName || !vaccine?.name || isNaN(qty)) {
      alert('Center, vaccine name, and quantity are required');
      return;
    }
    try {
      setFormLoading(true);
      // Determine merge vs create in UI first (optimistic behavior)
      const normalizeDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      };
      const desiredBatch = String(qa.batchNumber || '').trim();
      const desiredExpiry = qa.expiryDate ? normalizeDate(qa.expiryDate) : '';
      const entries = Array.isArray(vaccine.stockEntries) ? vaccine.stockEntries : [];
      const foundSameBatchSameExpiry = entries.find(en => {
        const enBatch = String(en.branchNo || '').trim();
        const enExpiry = en.expirationDate ? normalizeDate(en.expirationDate) : '';
        return enBatch.toLowerCase() === desiredBatch.toLowerCase() && enExpiry === desiredExpiry;
      });

      const payload = {
        center: centerName,
        centerName: centerName,
        vaccineName: vaccine.name,
        vaccineType: vaccine.type || '',
        brand: vaccine.brand || '',
        quantity: qty,
        expiryDate: qa.expiryDate || '',
        batchNumber: qa.batchNumber || ''
      };
      const res = await apiFetch('/api/vaccinestocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic UI update: merge or create locally for instant feedback
        setData(prevData => {
          const copy = JSON.parse(JSON.stringify(prevData || []));
          const center = copy.find(c => (c.centerName || '') === centerName);
          if (!center) return prevData; 
          const vac = (center.vaccines || []).find(v => (v.name || '') === vaccine.name);
          if (!vac) return prevData;
          if (!Array.isArray(vac.stockEntries)) vac.stockEntries = [];
          if (foundSameBatchSameExpiry) {
            // Merge quantities
            const target = vac.stockEntries.find(en => {
              const enBatch = String(en.branchNo || '').trim();
              const enExpiry = en.expirationDate ? normalizeDate(en.expirationDate) : '';
              return enBatch.toLowerCase() === desiredBatch.toLowerCase() && enExpiry === desiredExpiry;
            });
            if (target) {
              let cur = Number(target.stock || 0);
              cur = isNaN(cur) ? 0 : cur;
              target.stock = cur + (isNaN(qty) ? 0 : qty);
            }
            showToast('Added to existing batch', 'success');
          } else {
            // Create new entry (even if same batch but different expiry)
            vac.stockEntries.push({ branchNo: desiredBatch, stock: qty, expirationDate: qa.expiryDate || '' });
            showToast('New batch created', 'success');
          }
          return copy;
        });
        // Clear inputs and close modal
        setQuickAdd(prev => ({ ...prev, [key]: { quantity: '', batchNumber: '', expiryDate: '' } }));
        setQuickModal({ open:false, centerName:'', vaccine:null, quantity:'', batchNumber:'', expiryDate:'' });
        // Background refresh to stay accurate with server
        loadData();
      } else {
        showToast(result.message || 'Failed to add vaccine stock', 'error');
      }
    } catch (e) {
      console.error('Quick add failed:', e);
      showToast('Error adding vaccine stock. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Centers will be loaded from Center Data Management

  // Load centers and vaccines on component mount
  useEffect(() => {
    loadCenters();
    loadAvailableVaccines();
  }, []);

  // Available vaccines will be loaded dynamically based on selected center

  // Handle sign out
  const handleSignOut = () => {
    setShowSignoutModal(true);
  };

  // Confirm sign out
  const confirmSignOut = async () => {
    try { await fullLogout(apiFetch); } catch {}
      setShowSignoutModal(false);
  };

  useEffect(() => {
    loadData();
    loadCenters();
  }, []);

  const loadData = async () => {
    try {
      const userCenter = getUserCenter();
      
      // Build API URL with center filter for non-superadmin users
      let apiUrl = '/api/vaccinestocks';
      if (userCenter && userCenter !== 'all') {
        apiUrl += `?center=${encodeURIComponent(userCenter)}`;
      }
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
      if (result.success) {
        // Apply additional client-side filtering if needed
        const allData = result.data || [];
        // Map the data to ensure consistent field names
        const mappedData = allData.map(stock => ({
          ...stock,
          center: stock.center || stock.centerName
        }));
        
        const filteredData = filterByCenter(mappedData, 'center');
        
        // Group flat data by center to match component expectations
        const groupedData = {};
        filteredData.forEach((stock, index) => {
          const centerName = stock.center;
          
          if (!groupedData[centerName]) {
            groupedData[centerName] = {
              centerName: centerName,
              vaccines: []
            };
          }
          
          // Find existing vaccine or create new one
          let vaccine = groupedData[centerName].vaccines.find(v => v.name === stock.vaccineName);
          if (!vaccine) {
            vaccine = {
              name: stock.vaccineName,
              brand: stock.vaccineType,
              type: stock.category,
              stockEntries: []
            };
            groupedData[centerName].vaccines.push(vaccine);
          }
          
          // Add stock entry
          vaccine.stockEntries.push({
            branchNo: stock.batchNumber,
            stock: stock.quantity,
            expirationDate: stock.expiryDate
          });
        });
        
        // Convert to array format expected by component
        const finalData = Object.values(groupedData);
        setData(finalData);
      }
    } catch (error) {
      console.error('Error loading vaccine stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      // Prefer deriving centers from existing vaccinestocks so additions map correctly
      const fetchAllStocks = async () => {
        let page = 1;
        const limit = 200;
        let all = [];
        while (true) {
          const url = `/api/vaccinestocks?page=${page}&limit=${limit}`;
          try {
            const res = await apiFetch(url);
            const json = await res.json();
            const list = Array.isArray(json) ? json : (json.data || []);
            if (!list || list.length === 0) break;
            all = all.concat(list);
            const totalPages = json.totalPages || json.pages || null;
            if (totalPages && page >= totalPages) break;
            if (!totalPages && list.length < limit) break;
            page += 1;
          } catch (_) { break; }
        }
        return all;
      };

      let stockList = await fetchAllStocks();
      const namesFromStocks = Array.from(new Set((stockList || [])
        .map(s => String(s.centerName || s.center || '').trim())
        .filter(Boolean)))
        .sort((a,b)=>a.localeCompare(b));

      if (namesFromStocks.length) {
        const asObjects = namesFromStocks.map((n, idx) => ({ _id: String(idx+1), centerName: n }));
        setCenters(asObjects);
        return;
      }

      // Fallback to centers collection if no stocks yet
      const response = await apiFetch('/api/centers');
      const result = await response.json();
      const list = Array.isArray(result) ? result : (result.data || result.centers || []);
      const cleaned = (list || [])
        .filter(c => !c.isArchived)
        .map(c => ({ _id: c._id || c.id || String(c.name || c.centerName), centerName: String(c.centerName || c.name || '').trim() }))
        .filter(c => c.centerName)
        .sort((a,b)=>a.centerName.localeCompare(b.centerName));
      setCenters(cleaned);
    } catch (error) {
      console.error('Error loading centers:', error);
      setCenters([]);
    }
  };

  const loadAvailableVaccines = async () => {
    try {
      // 1) Try to derive from already loaded grouped `data`
      const fromState = [];
      (data || []).forEach(center => {
        (center.vaccines || []).forEach(v => {
          fromState.push({ name: v.name, brand: v.brand, type: v.type });
        });
      });
      if (fromState.length) {
        const uniq = Array.from(new Map(fromState.map(v => [v.name, v])).values());
        setAvailableVaccines(uniq);
        return;
      }

      // 2) Derive from vaccinestocks endpoint (flat format)
      let page = 1;
      const limit = 200;
      const flat = [];
      while (true) {
        let url = `/api/vaccinestocks?page=${page}&limit=${limit}`;
        try {
          const res = await apiFetch(url);
          if (!res.ok) break; // stop on HTTP errors (like 404) to avoid HTML parsing
          // Defensive: only parse as JSON if response looks like JSON
          let text = await res.text();
          try {
            const json = JSON.parse(text);
            const list = Array.isArray(json) ? json : (json.data || []);
            if (!list || list.length === 0) break;
            flat.push(...list);
            const totalPages = json.totalPages || json.pages || null;
            if (totalPages && page >= totalPages) break;
            if (!totalPages && list.length < limit) break;
            page += 1;
          } catch (_) {
            break; // not JSON (likely HTML), stop loop
          }
        } catch (_) {
          break;
        }
      }

      if (flat.length) {
        const mapped = flat.map(s => ({
          name: s.vaccineName,
          brand: s.vaccineType,
          type: s.category
        })).filter(v => v.name);
        const uniq = Array.from(new Map(mapped.map(v => [v.name, v])).values());
        setAvailableVaccines(uniq);
        return;
      }

      // 3) Final fallback to defaults
      setAvailableVaccines([
        { _id: '1', name: 'VAXIRAB', brand: 'PCEC', type: 'Anti-Rabies Vaccine' },
        { _id: '2', name: 'SPEEDA', brand: 'PVRV', type: 'Anti-Rabies Vaccine' },
        { _id: '3', name: 'Tetanus Toxoid-Containing Vaccine', brand: 'TCV', type: 'Tetanus Toxoid-Containing Vaccine' },
        { _id: '4', name: 'Equine Rabies Immunoglobulin', brand: 'ERIG', type: 'Equine Rabies Immunoglobulin' }
      ]);
    } catch (error) {
      console.error('Error loading vaccines, using defaults:', error);
      setAvailableVaccines([
        { _id: '1', name: 'VAXIRAB', brand: 'PCEC', type: 'Anti-Rabies Vaccine' },
        { _id: '2', name: 'SPEEDA', brand: 'PVRV', type: 'Anti-Rabies Vaccine' },
        { _id: '3', name: 'Tetanus Toxoid-Containing Vaccine', brand: 'TCV', type: 'Tetanus Toxoid-Containing Vaccine' },
        { _id: '4', name: 'Equine Rabies Immunoglobulin', brand: 'ERIG', type: 'Equine Rabies Immunoglobulin' }
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'center') {
      // When center changes, load vaccines for that center and reset vaccine fields
      const selectedCenter = centers.find(c => c.centerName === value);
      if (selectedCenter && selectedCenter.vaccines) {
        setAvailableVaccines(selectedCenter.vaccines);
      } else {
        // Keep the current vaccines if no center-specific vaccines are found
        // Don't clear the vaccines array
        console.log('No center-specific vaccines found, keeping current vaccines');
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        vaccineName: '',
        vaccineType: '',
        brand: ''
      }));
    } else if (name === 'vaccineName') {
      // When vaccine changes, set the type only; brand should be chosen manually
      const selectedVaccine = availableVaccines.find(v => v.name === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        vaccineType: selectedVaccine ? selectedVaccine.type : '',
        brand: ''
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      // Prepare data in the new structure
      const stockData = {
        center: formData.center,
        centerName: formData.center, // keep for backward compatibility
        vaccineName: formData.vaccineName,
        vaccineType: formData.vaccineType,
        brand: formData.brand,
        quantity: parseInt(formData.quantity),
        expiryDate: formData.expiryDate,
        batchNumber: formData.batchNumber
      };
      
      const response = await apiFetch('/api/vaccinestocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Vaccine stock added successfully!');
        setShowAddModal(false);
        setFormData({
          center: '',
          vaccineName: '',
          vaccineType: '',
          brand: '',
          quantity: '',
          expiryDate: '',
          batchNumber: ''
        });
        setAvailableVaccines([]);
        loadData(); // Reload data
      } else {
        alert(result.message || 'Failed to add vaccine stock');
      }
    } catch (error) {
      console.error('Error adding vaccine stock:', error);
      alert('Error adding vaccine stock. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const openAddModal = () => {
    const userCenter = getUserCenter();
    // For center-based admins, set their center automatically
    if (userCenter && userCenter !== 'all') {
      setFormData(prev => ({
        ...prev,
        center: userCenter
      }));
    }
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({
      center: '',
      vaccineName: '',
      vaccineType: '',
      brand: '',
      quantity: '',
      expiryDate: '',
      batchNumber: ''
    });
    setAvailableVaccines([]);
  };

  const toggleCenterExpansion = (centerName) => {
    const newExpanded = new Set(expandedCenters);
    if (newExpanded.has(centerName)) {
      newExpanded.delete(centerName);
    } else {
      newExpanded.add(centerName);
    }
    setExpandedCenters(newExpanded);
  };

  const toggleVaccineExpansion = (centerName, vaccineName) => {
    const key = `${centerName}::${vaccineName}`;
    const next = new Set(expandedVaccines);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedVaccines(next);
  };

  // Get unique types for filter dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set();
    data.forEach(center => {
      center.vaccines?.forEach(vaccine => {
        if (vaccine.type) {
          types.add(vaccine.type);
        }
      });
    });
    return Array.from(types).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter first
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(center => 
        center.centerName?.toLowerCase().includes(searchLower) ||
        center.vaccines?.some(vaccine => 
          vaccine.type?.toLowerCase().includes(searchLower) ||
          vaccine.name?.toLowerCase().includes(searchLower) ||
          vaccine.brand?.toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(center => 
        center.vaccines?.some(vaccine => vaccine.type === typeFilter)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(center => {
        const hasLowStock = center.vaccines?.some(vaccine => {
          const totalStock = vaccine.stockEntries?.reduce((sum, entry) => {
            let val = entry.stock;
            if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
            else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
            else val = Number(val);
            return sum + (isNaN(val) ? 0 : val);
          }, 0) || 0;
          return totalStock <= 10 && totalStock > 0;
        });
        
        const hasOutOfStock = center.vaccines?.some(vaccine => {
          const totalStock = vaccine.stockEntries?.reduce((sum, entry) => {
            let val = entry.stock;
            if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
            else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
            else val = Number(val);
            return sum + (isNaN(val) ? 0 : val);
          }, 0) || 0;
          return totalStock === 0;
        });

        if (statusFilter === 'low') return hasLowStock;
        if (statusFilter === 'out') return hasOutOfStock;
        return false;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'centerName':
          aValue = a.centerName || '';
          bValue = b.centerName || '';
          break;
        case 'totalStock':
          aValue = a.vaccines?.reduce((sum, vaccine) => {
            const vaccineStock = vaccine.stockEntries?.reduce((s, entry) => {
              let val = entry.stock;
              if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
              else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
              else val = Number(val);
              return s + (isNaN(val) ? 0 : val);
            }, 0) || 0;
            return sum + vaccineStock;
          }, 0) || 0;
          bValue = b.vaccines?.reduce((sum, vaccine) => {
            const vaccineStock = vaccine.stockEntries?.reduce((s, entry) => {
              let val = entry.stock;
              if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
              else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
              else val = Number(val);
              return s + (isNaN(val) ? 0 : val);
            }, 0) || 0;
            return sum + vaccineStock;
          }, 0) || 0;
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [data, typeFilter, statusFilter, search, sortBy, sortOrder]);

  // Calculate total filtered items count
  const totalFilteredItems = useMemo(() => {
    return filteredAndSortedData.reduce((total, center) => {
      return total + center.vaccines?.filter(vaccine => {
        // Apply type filter to individual vaccines
        if (typeFilter && vaccine.type !== typeFilter) {
          return false;
        }
        
        // Apply status filter to individual vaccines
        if (statusFilter) {
          const totalStock = vaccine.stockEntries?.reduce((sum, entry) => {
            let val = entry.stock;
            if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
            else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
            else val = Number(val);
            return sum + (isNaN(val) ? 0 : val);
          }, 0) || 0;
          
          if (statusFilter === 'low' && (totalStock > 10 || totalStock === 0)) {
            return false;
          }
          if (statusFilter === 'out' && totalStock !== 0) {
            return false;
          }
        }
        
        return true;
      }).length || 0;
    }, 0);
  }, [filteredAndSortedData, typeFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = data.length;
    const lowStock = data.filter(center => 
      center.vaccines?.some(vaccine => {
        const totalStock = vaccine.stockEntries?.reduce((sum, entry) => {
          let val = entry.stock;
          if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
          else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
          else val = Number(val);
          return sum + (isNaN(val) ? 0 : val);
        }, 0) || 0;
        return totalStock <= 10 && totalStock > 0;
      })
    ).length;
    const outOfStock = data.filter(center => 
      center.vaccines?.some(vaccine => {
        const totalStock = vaccine.stockEntries?.reduce((sum, entry) => {
          let val = entry.stock;
          if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
          else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
          else val = Number(val);
          return sum + (isNaN(val) ? 0 : val);
        }, 0) || 0;
        return totalStock === 0;
      })
    ).length;

    return { total, lowStock, outOfStock };
  }, [data]);

  const exportToPDF = async () => {
    try {
      // Detect jsPDF from CDN or npm
      let jsPDFCtor = undefined;
      if (typeof window !== 'undefined') {
        jsPDFCtor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || undefined;
      }
      let autoTableFn = (typeof window !== 'undefined' && window.jspdf && window.jspdf.autoTable) ? window.jspdf.autoTable : undefined;

      if (!jsPDFCtor) {
        // Try dynamic import (npm)
        try {
          const jspdfModule = await import('jspdf');
          jsPDFCtor = jspdfModule.jsPDF || jspdfModule.default;
        } catch (_) {
          jsPDFCtor = undefined;
        }
      }

      if (!autoTableFn) {
        try {
          const at = await import('jspdf-autotable');
          autoTableFn = at.default || at.autoTable;
        } catch (_) {
          autoTableFn = undefined;
        }
      }

      if (!jsPDFCtor) {
        alert('PDF export unavailable: jsPDF not found. Install jspdf and jspdf-autotable or include their CDNs.');
        return;
      }

      const doc = new jsPDFCtor('p', 'mm', 'a4');

      // Header
      doc.setFontSize(18);
      doc.text('Vaccine Stock Report', 105, 15, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

      // Summary block
      const startY = 30;
      doc.setFontSize(12);
      doc.text('Summary', 20, startY);
      doc.setFontSize(10);
      doc.text(`Total Centers: ${summary.total}`, 20, startY + 6);
      doc.text(`Low Stock: ${summary.lowStock}`, 20, startY + 12);
      doc.text(`Out of Stock: ${summary.outOfStock}`, 20, startY + 18);

      // Build rows for table
      const rows = [];
      filteredAndSortedData.forEach(center => {
        (center.vaccines || []).forEach(vaccine => {
          const totalStock = (vaccine.stockEntries || []).reduce((sum, entry) => {
            let val = entry.stock;
            if (typeof val === 'object' && val?.$numberInt !== undefined) val = parseInt(val.$numberInt);
            else if (typeof val === 'object' && val?.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
            else val = Number(val);
            return sum + (isNaN(val) ? 0 : val);
          }, 0);
          rows.push([
            center.centerName || 'N/A',
            vaccine.name || 'N/A',
            vaccine.type || 'N/A',
            vaccine.brand || 'N/A',
            vaccine.stockEntries?.[0]?.branchNo || 'N/A',
            String(totalStock),
            vaccine.stockEntries?.[0]?.expirationDate || 'N/A'
          ]);
        });
      });

      if (autoTableFn) {
        autoTableFn(doc, {
          head: [['Center', 'Vaccine Name', 'Type', 'Brand', 'Batch No.', 'Stock', 'Expiry Date']],
          body: rows,
          startY: startY + 26,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [240, 240, 240], textColor: 20 },
          theme: 'grid',
          didDrawPage: (data) => {
            const page = doc.getNumberOfPages();
            doc.setFontSize(9);
            doc.text(`Page ${page}`, 105, 290, { align: 'center' });
          }
        });
      } else {
        // Fallback simple rendering if autotable is not present
        let y = startY + 26;
        const headers = ['Center', 'Vaccine Name', 'Type', 'Brand', 'Batch No.', 'Stock', 'Expiry Date'];
        const colX = [20, 60, 100, 130, 160, 190, 220];
        doc.setFontSize(8);
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y - 6, 200, 8, 'F');
        headers.forEach((h, i) => doc.text(h, colX[i], y));
        y += 6;
        rows.forEach(r => {
          if (y > 280) { doc.addPage(); y = 20; }
          r.forEach((val, i) => doc.text(String(val), colX[i], y));
          y += 6;
        });
      }

      doc.save('vaccine-stock-report.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Check console for details.');
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'out', label: 'Out of Stock', color: '#ff4757' };
    if (stock <= 10) return { status: 'low', label: 'Low Stock', color: '#ffa502' };
    return { status: 'good', label: 'In Stock', color: '#2ed573' };
  };

  return (
    <div className="superadmin-stock-container">
      {/* Toast */}
      {toast.show && (
        <div className="toast-container" style={{ position:'fixed', top:16, right:16, zIndex:9999 }}>
          <div className={`toast ${toast.type}`} style={{ background: toast.type==='success' ? '#ecfdf5' : toast.type==='error' ? '#fef2f2' : '#eff6ff', color:'#111827', padding:'10px 12px', borderRadius:8, boxShadow:'0 4px 10px rgba(0,0,0,0.1)', border:'1px solid #e5e7eb' }}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="content-header">
          <h2>Stock & Inventory Management</h2>
          <div className="header-actions">
            <button className="btn btn-success" onClick={openAddModal}>
              <i className="fa-solid fa-plus" /> Add Vaccine Stock
            </button>
            <button className="btn btn-primary" onClick={exportToPDF}>
              <i className="fa-solid fa-download" /> Export PDF
            </button>
          </div>
        </div>

        <div className="content-body">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon" style={{ background: 'rgba(0, 123, 255, 0.1)' }}>
                <i className="fa-solid fa-hospital" style={{ color: '#007bff' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Total Centers</div>
                <div className="card-value">{summary.total}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon" style={{ background: 'rgba(255, 165, 2, 0.1)' }}>
                <i className="fa-solid fa-exclamation-triangle" style={{ color: '#ffa502' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Low Stock</div>
                <div className="card-value">{summary.lowStock}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon" style={{ background: 'rgba(255, 71, 87, 0.1)' }}>
                <i className="fa-solid fa-times-circle" style={{ color: '#ff4757' }} />
              </div>
              <div className="card-info">
                <div className="card-title">Out of Stock</div>
                <div className="card-value">{summary.outOfStock}</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <input 
                type="text" 
                placeholder="Search centers, vaccine names, types..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-control">
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-control">
                <option value="">All Status</option>
                <option value="low">Low Stock (≤ 10)</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            <div className="filter-group">
              <button 
                onClick={() => {
                  setSearch('');
                  setTypeFilter('');
                  setStatusFilter('');
                }}
                className="form-control clear-filters-btn"
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  color: '#6c757d',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-times" style={{ marginRight: '8px' }}></i>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filter Results Count */}
          {(search || typeFilter || statusFilter) && (
            <div className="filter-results-info" style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: '#e3f2fd',
              border: '1px solid #bbdefb',
              borderRadius: '8px',
              color: '#1976d2',
              fontSize: '0.9rem'
            }}>
              <i className="fa-solid fa-filter" style={{ marginRight: '8px' }}></i>
              Showing {totalFilteredItems} filtered items
              {(search || typeFilter || statusFilter) && (
                <span style={{ marginLeft: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>
                  (Filtered by: {[
                    search && `Search: "${search}"`,
                    typeFilter && `Type: ${typeFilter}`,
                    statusFilter && `Status: ${statusFilter === 'low' ? 'Low Stock' : 'Out of Stock'}`
                  ].filter(Boolean).join(', ')})
                </span>
              )}
            </div>
          )}

          {/* Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Health Center
                  </th>
                  <th>Total Vaccines</th>
                  <th>Total Stock</th>
                  <th>Low Stock Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="loading-cell">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : filteredAndSortedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      <div className="empty-state">
                        <i className="fa-solid fa-boxes-stacked" />
                        <p>No vaccine stocks found</p>
                        <small>Try adjusting your filters or search terms</small>
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedData.map((center, centerIndex) => {
                  // Calculate center statistics
                  const totalVaccines = center.vaccines?.length || 0;
                  const totalStock = center.vaccines?.reduce((sum, vaccine) => {
                    return sum + (vaccine.stockEntries?.reduce((s, entry) => {
                      let val = entry.stock;
                      if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
                      else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
                      else val = Number(val);
                      return s + (isNaN(val) ? 0 : val);
                    }, 0) || 0);
                  }, 0) || 0;
                  
                  const lowStockItems = center.vaccines?.filter(vaccine => {
                    const vaccineStock = vaccine.stockEntries?.reduce((sum, entry) => {
                      let val = entry.stock;
                      if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
                      else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
                      else val = Number(val);
                      return sum + (isNaN(val) ? 0 : val);
                    }, 0) || 0;
                    return vaccineStock <= 10 && vaccineStock > 0;
                  }).length || 0;
                  
                  const outOfStockItems = center.vaccines?.filter(vaccine => {
                    const vaccineStock = vaccine.stockEntries?.reduce((sum, entry) => {
                      let val = entry.stock;
                      if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
                      else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
                      else val = Number(val);
                      return sum + (isNaN(val) ? 0 : val);
                    }, 0) || 0;
                    return vaccineStock === 0;
                  }).length || 0;
                  
                  const centerStatus = outOfStockItems > 0 ? 'critical' : lowStockItems > 0 ? 'warning' : 'good';
                  const isExpanded = expandedCenters.has(center.centerName);
                  
                  return (
                    <React.Fragment key={centerIndex}>
                      {/* Main center row */}
                      <tr 
                        className="center-row"
                        onClick={() => toggleCenterExpansion(center.centerName)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="center-info">
                            <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`} 
                               style={{ marginRight: '8px', transition: 'transform 0.2s ease' }} />
                            <span className="center-name">{center.centerName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="total-vaccines">{totalVaccines}</span>
                        </td>
                        <td>
                          <span className="total-stock">{totalStock}</span>
                        </td>
                        <td>
                          <span className="low-stock-count">{lowStockItems}</span>
                        </td>
                        <td>
                          <span 
                            className={`center-status-badge status-${centerStatus}`}
                            style={{ 
                              backgroundColor: centerStatus === 'critical' ? '#e74c3c' : 
                                             centerStatus === 'warning' ? '#f39c12' : '#27ae60'
                            }}
                          >
                            {centerStatus === 'critical' ? 'Critical' : 
                             centerStatus === 'warning' ? 'Warning' : 'Good'}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expanded vaccine details */}
                      {isExpanded && (
                        <tr className="vaccine-details-row">
                          <td colSpan={5}>
                            <div className="vaccine-details-container">
                              <div className="vaccine-details-header">
                                <h4>Vaccine Inventory Details</h4>
                              </div>
                              <div className="vaccine-list">
                                {center.vaccines?.map((vaccine, vaccineIndex) => {
                                  const vaccineStock = vaccine.stockEntries?.reduce((sum, entry) => {
                                    let val = entry.stock;
                                    if (typeof val === 'object' && val.$numberInt !== undefined) val = parseInt(val.$numberInt);
                                    else if (typeof val === 'object' && val.$numberDouble !== undefined) val = parseFloat(val.$numberDouble);
                                    else val = Number(val);
                                    return sum + (isNaN(val) ? 0 : val);
                                  }, 0) || 0;
                                  const stockStatus = getStockStatus(vaccineStock);
                                  
                                  const vKey = `${center.centerName}::${vaccine.name}`;
                                  const vExpanded = expandedVaccines.has(vKey);
                                  return (
                                    <div key={vaccineIndex} className="vaccine-item">
                                      <div className="vaccine-info" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <div onClick={() => toggleVaccineExpansion(center.centerName, vaccine.name)} style={{display:'flex', cursor:'pointer'}}>
                                          <i className={`fa-solid fa-chevron-${vExpanded ? 'down' : 'right'}`} style={{ marginRight: '8px' }} />
                                          <div>
                                            <div className="vaccine-name">{vaccine.name}</div>
                                            <div className="vaccine-type">{vaccine.type}</div>
                                            <div className="vaccine-brand">{vaccine.brand}</div>
                                          </div>
                                        </div>
                                        <button
                                          title="Quick add stock"
                                          onClick={(e)=>{ 
                                            e.stopPropagation(); 
                                            // Open empty; user can type an existing Batch No. to auto-fill expiry
                                            setQuickModal({ 
                                              open:true, 
                                              centerName:center.centerName, 
                                              vaccine, 
                                              quantity:'', 
                                              batchNumber:'', 
                                              expiryDate:''
                                            }); 
                                          }}
                                          style={{
                                            border:'none', background:'#eafaf1', color:'#10b981', width:28, height:28, borderRadius:14,
                                            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
                                          }}
                                        >
                                          <i className="fa-solid fa-plus"></i>
                                        </button>
                                      </div>
                                      <div className="vaccine-stock-info">
                                        <div className="stock-details">
                                          <span className="batch-number">
                                            Branch: {vaccine.stockEntries?.[0]?.branchNo || 'N/A'}
                                          </span>
                                          <span className="expiry-date">
                                            Expires: {vaccine.stockEntries?.[0]?.expirationDate || 'N/A'}
                                          </span>
                                        </div>
                                        <div className="stock-quantity">
                                          <span className="stock-level">{vaccineStock}</span>
                                          <span 
                                            className={`status-badge status-${stockStatus.status}`}
                                            style={{ backgroundColor: stockStatus.color }}
                                          >
                                            {stockStatus.label}
                                          </span>
                                        </div>
                                      </div>

                                      {vExpanded && (
                                        <div className="stock-entries">
                                          {(vaccine.stockEntries || []).map((entry, idx) => {
                                            let qty = entry.stock;
                                            if (typeof qty === 'object' && qty?.$numberInt !== undefined) qty = parseInt(qty.$numberInt);
                                            else if (typeof qty === 'object' && qty?.$numberDouble !== undefined) qty = parseFloat(qty.$numberDouble);
                                            else qty = Number(qty);
                                            return (
                                              <div key={idx} className="stock-entry">
                                                <div className="stock-entry-left">
                                                  <div className="stock-entry-branch">Branch #{entry.branchNo || 'N/A'}</div>
                                                  <div className="stock-entry-expiry">Expires: {entry.expirationDate || 'N/A'}</div>
                                                </div>
                                                <div className="stock-entry-right">
                                                  <span className="stock-entry-qty">{isNaN(qty) ? '0' : qty}</span>
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* inline quick-add removed in favor of modal */}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
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

          {filteredAndSortedData.length > 0 && (
            <div className="table-footer">
              <div className="table-info">
                Showing {filteredAndSortedData.length} of {data.length} records
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Vaccine Stock Modal */}
      {showAddModal && (
        <div className="add-modal active">
          <div className="add-modal-overlay" onClick={closeAddModal}></div>
          <div className="add-modal-content">
            <div className="add-modal-header">
              <div className="add-icon-wrapper">
                <i className="fa-solid fa-plus"></i>
              </div>
              <h3>Add Vaccine Stock</h3>
            </div>
            <form onSubmit={handleSubmit} className="add-modal-body">
              <div className="form-group">
                <label htmlFor="center">Health Center *</label>
                <select
                  id="center"
                  name="center"
                  value={formData.center}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  disabled={getUserCenter() && getUserCenter() !== 'all'}
                >
                  <option value="">Select a center</option>
                  {centers.map(center => (
                    <option key={center._id} value={center.centerName}>
                      {center.centerName}
                    </option>
                  ))}
                </select>
                {getUserCenter() && getUserCenter() !== 'all' && (
                  <small className="form-text text-muted">
                    Center is automatically set to your assigned center: {getUserCenter()}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="vaccineName">Vaccine Name *</label>
                <select
                  id="vaccineName"
                  name="vaccineName"
                  value={formData.vaccineName}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                >
                  <option value="">Select a vaccine</option>
                  {availableVaccines.length > 0 ? (
                    availableVaccines.map(vaccine => (
                      <option key={vaccine._id || vaccine.name} value={vaccine.name}>
                        {vaccine.name} ({vaccine.brand})
                    </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading vaccines...</option>
                  )}
                </select>
                {availableVaccines.length === 0 && (
                  <small style={{ color: '#dc2626', marginTop: '4px', display: 'block' }}>
                    No vaccines available. Please check your connection or contact administrator.
                  </small>
                )}
              </div>

              {/* Show vaccine type and brand when vaccine is selected */}
              {formData.vaccineName && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="vaccineType">Vaccine Type</label>
                    <input
                      type="text"
                      id="vaccineType"
                      name="vaccineType"
                      value={formData.vaccineType}
                      readOnly
                      className="form-control"
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="brand">Brand</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Enter brand (optional)"
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantity">Quantity *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="form-control"
                    placeholder="Enter quantity"
                  />
                </div>

                {/* Min Threshold removed per request; server will default to 10 */}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="batchNumber">Batch Number</label>
                  <input
                    type="text"
                    id="batchNumber"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter batch number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>
            </form>
            <div className="add-modal-footer">
              <button className="cancel-btn" onClick={closeAddModal} disabled={formLoading}>
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleSubmit} 
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Adding...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus"></i> Add Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Small Quick Add Modal */}
      {quickModal.open && (
        <div className="add-modal active">
          <div className="add-modal-overlay" onClick={()=>setQuickModal({ open:false, centerName:'', vaccine:null, quantity:'', batchNumber:'', expiryDate:'' })}></div>
          <div className="add-modal-content" style={{ maxWidth: 520 }}>
            <div className="add-modal-header">
              <div className="add-icon-wrapper">
                <i className="fa-solid fa-plus"></i>
              </div>
              <h3>Add Stock - {quickModal.vaccine?.name}</h3>
            </div>
            <div className="add-modal-body">
              <div className="form-group">
                <label>Center</label>
                <input className="form-control" value={quickModal.centerName} readOnly />
              </div>
              <div className="form-group">
                <label>Vaccine</label>
                <input className="form-control" value={quickModal.vaccine?.name || ''} readOnly />
              </div>
              {quickModal.vaccine && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Vaccine Type</label>
                    <input className="form-control" value={quickModal.vaccine?.type || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Brand</label>
                    <input className="form-control" value={quickModal.vaccine?.brand || ''} readOnly />
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" min="0" className="form-control" value={quickModal.quantity} onChange={e=>setQuickModal(m=>({ ...m, quantity:e.target.value }))} />
                </div>
              </div>
            <div className="form-row">
              <div className="form-group">
                <label>Batch No.</label>
                <input
                  type="text"
                  className="form-control"
                  value={quickModal.batchNumber}
                  onChange={e=>{
                    const inputVal = e.target.value;
                    const entries = quickModal.vaccine?.stockEntries || [];
                    const match = entries.find(en => String(en.branchNo || '').trim().toLowerCase() === String(inputVal || '').trim().toLowerCase());
                    setQuickModal(m => ({ ...m, batchNumber: inputVal, expiryDate: match?.expirationDate || '' }));
                  }}
                />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={quickModal.expiryDate}
                  onChange={e=>setQuickModal(m=>({ ...m, expiryDate:e.target.value }))}
                />
              </div>
            </div>
            </div>
            <div className="add-modal-footer">
              <button className="cancel-btn" onClick={()=>setQuickModal({ open:false, centerName:'', vaccine:null, quantity:'', batchNumber:'', expiryDate:'' })} disabled={formLoading}>Cancel</button>
              <button className="confirm-btn" onClick={()=>submitQuickAdd(quickModal.centerName, quickModal.vaccine, { quantity:quickModal.quantity, batchNumber:quickModal.batchNumber, expiryDate:quickModal.expiryDate })} disabled={formLoading}>
                {formLoading ? (<><i className="fa-solid fa-spinner fa-spin"></i> Adding...</>) : (<><i className="fa-solid fa-plus"></i> Add Stock</>)}
              </button>
            </div>
          </div>
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

export default SuperAdminStock;

 