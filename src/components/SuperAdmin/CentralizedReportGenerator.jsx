import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveSidebar from './ResponsiveSidebar';
import LoadingSpinner from './DogLoadingSpinner';
import { getUserCenter } from '../../utils/userContext';
import { apiFetch, apiConfig } from '../../config/api';
import './SuperAdminGenerate.css';

const CentralizedReportGenerator = () => {
  // Centralized state
  const [reportType, setReportType] = useState('general');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Universal filters
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    center: 'all',
    barangay: 'all',
    sex: 'all',
    ageGroup: 'all',
    status: 'all',
    vaccineType: 'all',
    animalType: 'all',
    severity: 'all',
    riskLevel: 'all',
    search: ''
  });

  // Available report types
  const reportTypes = [
    { value: 'general', label: 'General Report', icon: 'fas fa-file-alt', description: 'Comprehensive overview of all cases' },
    { value: 'cases', label: 'Cases Report', icon: 'fas fa-exclamation-triangle', description: 'Detailed case information and status' },
    { value: 'patients', label: 'Patients Report', icon: 'fas fa-users', description: 'Patient demographics and information' },
    { value: 'vaccination', label: 'Vaccination Report', icon: 'fas fa-syringe', description: 'Vaccination schedules and completion' },
    { value: 'staff', label: 'Staff Report', icon: 'fas fa-user-md', description: 'Staff information and assignments' },
    { value: 'barangay', label: 'Barangay Report', icon: 'fas fa-map-marker-alt', description: 'Geographic distribution and risk analysis' },
    { value: 'demographics', label: 'Demographics Report', icon: 'fas fa-chart-pie', description: 'Population statistics and trends' },
    { value: 'utilization', label: 'Vaccine Utilization', icon: 'fas fa-vial', description: 'Vaccine usage and inventory' }
  ];

  // Filter options
  const filterOptions = {
    center: ['all', 'San Juan Center', 'Balong-Bato Center', 'Salapan Center'],
    barangay: ['all', 'San Juan', 'Balong-Bato', 'Salapan', 'Other'],
    sex: ['all', 'Male', 'Female'],
    ageGroup: ['all', '0-12', '13-17', '18-30', '31-50', '51-65', '65+'],
    status: ['all', 'pending', 'in_progress', 'completed', 'cancelled'],
    vaccineType: ['all', 'SPEEDA', 'VAXIRAB', 'PCEC', 'PVRV'],
    animalType: ['all', 'Dog', 'Cat', 'Other'],
    severity: ['all', 'Mild', 'Moderate', 'Severe'],
    riskLevel: ['all', 'Low', 'Medium', 'High', 'Critical']
  };

  // Load data based on report type
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      let queryParams = new URLSearchParams();

      // Add common filters
      if (filters.from) queryParams.append('startDate', filters.from);
      if (filters.to) queryParams.append('endDate', filters.to);
      if (filters.center !== 'all') queryParams.append('center', filters.center);
      if (filters.barangay !== 'all') queryParams.append('barangay', filters.barangay);
      if (filters.sex !== 'all') queryParams.append('sex', filters.sex);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      // Set endpoint based on report type
      switch (reportType) {
        case 'general':
          endpoint = '/api/reports/general';
          break;
        case 'cases':
          endpoint = '/api/reports/cases';
          break;
        case 'patients':
          endpoint = '/api/reports/patients';
          break;
        case 'vaccination':
          endpoint = '/api/reports/vaccination';
          break;
        case 'staff':
          endpoint = '/api/reports/staff';
          break;
        case 'barangay':
          endpoint = '/api/reports/barangay';
          break;
        case 'demographics':
          endpoint = '/api/reports/demographics';
          break;
        case 'utilization':
          endpoint = '/api/reports/utilization';
          break;
        default:
          endpoint = '/api/reports/general';
      }

      const url = `${endpoint}?${queryParams.toString()}`;
      const response = await apiFetch(url);
      const result = await response.json();

      if (result.success || result.data) {
        setData(Array.isArray(result.data) ? result.data : result);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          filters,
          data
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          filters,
          data
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate Excel');
      }
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Failed to export Excel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      from: '',
      to: '',
      center: 'all',
      barangay: 'all',
      sex: 'all',
      ageGroup: 'all',
      status: 'all',
      vaccineType: 'all',
      animalType: 'all',
      severity: 'all',
      riskLevel: 'all',
      search: ''
    });
  };

  // Load data when report type or filters change
  useEffect(() => {
    if (reportType) {
      loadData();
    }
  }, [reportType, filters]);

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="content-header">
          <h2>Centralized Report Generator</h2>
          <p className="subtitle">Generate comprehensive reports with advanced filtering</p>
        </div>

        {/* Universal Filters */}
        <div className="filters-section">
          <div className="filters-header">
            <h3>Filters</h3>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>

          <div className="filters-grid">
            {/* Date Range */}
            <div className="filter-group">
              <label>Date Range</label>
              <div className="date-range">
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({...filters, from: e.target.value})}
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({...filters, to: e.target.value})}
                  placeholder="To Date"
                />
              </div>
            </div>

            {/* Center */}
            <div className="filter-group">
              <label>Center</label>
              <select
                value={filters.center}
                onChange={(e) => setFilters({...filters, center: e.target.value})}
              >
                {filterOptions.center.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Centers' : option}
                  </option>
                ))}
              </select>
            </div>

            {/* Barangay */}
            <div className="filter-group">
              <label>Barangay</label>
              <select
                value={filters.barangay}
                onChange={(e) => setFilters({...filters, barangay: e.target.value})}
              >
                {filterOptions.barangay.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Barangays' : option}
                  </option>
                ))}
              </select>
            </div>

            {/* Sex */}
            <div className="filter-group">
              <label>Sex</label>
              <select
                value={filters.sex}
                onChange={(e) => setFilters({...filters, sex: e.target.value})}
              >
                {filterOptions.sex.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All' : option}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Group */}
            <div className="filter-group">
              <label>Age Group</label>
              <select
                value={filters.ageGroup}
                onChange={(e) => setFilters({...filters, ageGroup: e.target.value})}
              >
                {filterOptions.ageGroup.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Ages' : option}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                {filterOptions.status.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Status' : option}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="filter-group search-group">
              <label>Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Search records..."
              />
            </div>
          </div>
        </div>

        {/* Export Controls */}
        <div className="export-controls">
          <div className="export-buttons">
            <button 
              className="btn btn-primary" 
              onClick={exportToPDF}
              disabled={loading || data.length === 0}
            >
              <i className="fas fa-file-pdf"></i> Export PDF
            </button>
            <button 
              className="btn btn-success" 
              onClick={exportToExcel}
              disabled={loading || data.length === 0}
            >
              <i className="fas fa-file-excel"></i> Export Excel
            </button>
          </div>
          <div className="data-info">
            <span>Records: {data.length}</span>
            <span>Report: {reportTypes.find(t => t.value === reportType)?.label}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && <LoadingSpinner />}

        {/* Data Display */}
        {!loading && data.length > 0 && (
          <div className="data-preview">
            <h3>Data Preview</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(data[0] || {}).map((key, index) => (
                      <th key={index}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex}>{value || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!loading && data.length === 0 && !error && (
          <div className="no-data">
            <i className="fas fa-inbox"></i>
            <h3>No Data Found</h3>
            <p>Try adjusting your filters or select a different report type.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CentralizedReportGenerator;


