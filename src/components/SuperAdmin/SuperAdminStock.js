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
    batchNumber: '',
    minThreshold: '10'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [expandedCenters, setExpandedCenters] = useState(new Set());
  const [expandedVaccines, setExpandedVaccines] = useState(new Set());

  // Centers will be loaded from Center Data Management

  // Load centers on component mount
  useEffect(() => {
    loadCenters();
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
    const response = await apiFetch('/api/centers');
      const result = await response.json();
      if (result.success) {
        setCenters(result.data);
      }
    } catch (error) {
      console.error('Error loading centers:', error);
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
        setAvailableVaccines([]);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        vaccineName: '',
        vaccineType: '',
        brand: ''
      }));
    } else if (name === 'vaccineName') {
      // When vaccine changes, set the type and brand
      const selectedVaccine = availableVaccines.find(v => v.name === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        vaccineType: selectedVaccine ? selectedVaccine.type : '',
        brand: selectedVaccine ? selectedVaccine.brand : ''
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
        centerName: formData.center,
        vaccineName: formData.vaccineName,
        vaccineType: formData.vaccineType,
        brand: formData.brand,
        quantity: parseInt(formData.quantity),
        expiryDate: formData.expiryDate,
        batchNumber: formData.batchNumber,
        minThreshold: parseInt(formData.minThreshold)
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
          batchNumber: '',
          minThreshold: '10'
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
      batchNumber: '',
      minThreshold: '10'
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
                                      <div className="vaccine-info" onClick={() => toggleVaccineExpansion(center.centerName, vaccine.name)} style={{cursor:'pointer'}}>
                                        <i className={`fa-solid fa-chevron-${vExpanded ? 'down' : 'right'}`} style={{ marginRight: '8px' }} />
                                        <div>
                                        <div className="vaccine-name">{vaccine.name}</div>
                                        <div className="vaccine-type">{vaccine.type}</div>
                                        <div className="vaccine-brand">{vaccine.brand}</div>
                                        </div>
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
                  {availableVaccines.map(vaccine => (
                    <option key={vaccine._id} value={vaccine.name}>
                      {vaccine.name} ({vaccine.brand})
                    </option>
                  ))}
                </select>
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
                      readOnly
                      className="form-control"
                      style={{ backgroundColor: '#f8f9fa' }}
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

                <div className="form-group">
                  <label htmlFor="minThreshold">Minimum Threshold</label>
                  <input
                    type="number"
                    id="minThreshold"
                    name="minThreshold"
                    value={formData.minThreshold}
                    onChange={handleInputChange}
                    min="0"
                    className="form-control"
                    placeholder="10"
                  />
                </div>
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

 