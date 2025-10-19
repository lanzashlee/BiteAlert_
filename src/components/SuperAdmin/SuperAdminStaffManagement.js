import React, { useEffect, useMemo, useState } from 'react';
import ResponsiveSidebar from './ResponsiveSidebar';
import { apiFetch } from '../../config/api';
import { fullLogout } from '../../utils/auth';
import UnifiedModal from '../UnifiedModal';
import { getUserCenter, filterByCenter } from '../../utils/userContext';
import './SuperAdminStaffManagement.css';
import UnifiedSpinner from '../Common/UnifiedSpinner';

const SuperAdminStaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [centerOptions, setCenterOptions] = useState([]);
  
  // Determine role: superadmin sees all, admin is limited to their center
  const userCenter = getUserCenter();
  const isSuperAdmin = !userCenter || userCenter === 'all';
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 50;
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Add Staff Modal States
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Staff',
    center: '',
    officeAddress: '',
    isApproved: false,
    isVerified: false,
  });
  const [addStaffError, setAddStaffError] = useState(null);

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

  // Handle password change
  const handlePasswordChange = (staffId) => {
    const staffMember = staff.find(s => s._id === staffId);
    setSelectedStaff(staffMember);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowAdminInfo(false);
    setShowPasswordModal(true);
  };

  // Handle new password input change with real-time validation
  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    setPasswordError(''); // Clear previous errors
    
    // Real-time validation
    if (value.length > 0) {
      const validation = validatePassword(value);
      if (validation) {
        setPasswordError(validation);
      }
    }
  };

  // Handle confirm password change with real-time validation
  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setPasswordError(''); // Clear previous errors
    
    // Real-time validation for password match
    if (value.length > 0 && newPassword.length > 0) {
      if (value !== newPassword) {
        setPasswordError('Passwords do not match');
        } else {
        // Check if new password meets requirements
        const validation = validatePassword(newPassword);
        if (validation) {
          setPasswordError(validation);
        }
      }
    }
  };

  // Validate password
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return '';
  };

  // Confirm password change
  const confirmPasswordChange = async () => {
    try {
      setPasswordError('');
      
      // Validate passwords
      const passwordValidation = validatePassword(newPassword);
      if (passwordValidation) {
        setPasswordError(passwordValidation);
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }

      if (!newPassword || !confirmPassword) {
        setPasswordError('Please fill in both password fields');
        return;
      }

      setIsProcessing(true);

      // Password change initiated for staff

      // API call to change password
      const response = await apiFetch('/api/change-staff-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staffId: selectedStaff._id, 
          newPassword: newPassword 
        })
      });

      // Password change response received

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Password change failed:', errorText);
        throw new Error(`Failed to change password: ${errorText}`);
      }

      const result = await response.json();
      // Password change completed successfully

      // Log audit trail
      await logAuditTrail(selectedStaff._id, `Password changed for staff: ${selectedStaff.fullName}`);

      // Show success message
      showNotification('Password changed successfully', 'success');
      
      // Close modal after 2 seconds
      setTimeout(() => {
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedStaff(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification(error.message || 'Error changing password', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Log audit trail
  const logAuditTrail = async (staffId, action) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      
      apiFetch('/api/audit-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || staffId,
          role: currentUser?.role || 'system',
          fullName: currentUser?.fullName || 'System',
          action,
          timestamp: new Date().toISOString()
        })
      }).catch(error => console.error('Error logging audit trail:', error));
      
      return { success: true };
    } catch (error) {
      console.error('Error in logAuditTrail:', error);
      return { success: false };
    }
  };

  // Close password modal
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedStaff(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowAdminInfo(false);
    setIsProcessing(false);
  };

  // Handle sign out
  const handleSignOut = () => {
    setShowSignoutModal(true);
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

  // Open Add Staff Modal
  const openAddModal = () => {
    setNewStaffData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Staff',
      center: '',
      officeAddress: '',
      isApproved: false,
      isVerified: false,
    });
    setAddStaffError(null);
    setShowAddStaffModal(true);
  };

  // Close Add Staff Modal
  const closeAddModal = () => {
    setShowAddStaffModal(false);
    setNewStaffData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Staff',
      center: '',
      officeAddress: '',
      isApproved: false,
      isVerified: false,
    });
    setAddStaffError(null);
  };

  // Handle Add Staff form submission
  const handleAddStaffSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setAddStaffError(null);

    if (!newStaffData.firstName || !newStaffData.lastName || !newStaffData.email || !newStaffData.role || !newStaffData.center) {
      setAddStaffError('Please fill in all required fields (First Name, Last Name, Email, Role, Center)');
      return;
    }

    if (!validateEmail(newStaffData.email)) {
      setAddStaffError('Please enter a valid email address');
      return;
    }

    if (!validatePhone(newStaffData.phone)) {
      setAddStaffError('Please enter a valid phone number (e.g., 09123456789)');
      return;
    }

    if (!newStaffData.password || !newStaffData.confirmPassword) {
      setAddStaffError('Password fields cannot be empty');
      return;
    }

    if (newStaffData.password !== newStaffData.confirmPassword) {
      setAddStaffError('Passwords do not match');
      return;
    }

    if (!validatePassword(newStaffData.password)) {
      setAddStaffError('Password does not meet requirements');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiFetch('/api/staffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newStaffData.firstName,
          lastName: newStaffData.lastName,
          email: newStaffData.email,
          phone: newStaffData.phone,
          role: (newStaffData.role || 'staff').toString().toLowerCase(),
          center: newStaffData.center,
          officeAddress: newStaffData.officeAddress,
          password: newStaffData.password,
          isApproved: newStaffData.isApproved,
          isVerified: newStaffData.isVerified,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add staff:', errorText);
        throw new Error(`Failed to add staff: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        showNotification('Staff added successfully', 'success');
        closeAddModal();
        // Refresh staff list
        const userCenter = getUserCenter();
        let apiUrl = '/api/staffs';
        if (userCenter && userCenter !== 'all') {
          console.log('Admin center detected, using client-side filtering for center:', userCenter);
        } else if (!userCenter) {
          console.log('No user center detected, fetching all staff for client-side filtering');
        }
        const res = await apiFetch(apiUrl);
        const data = await res.json();
        if (data.success) {
          const allStaff = data.staffs || [];
          const mappedStaff = allStaff.map(staff => ({
            ...staff,
            fullName: staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
            center: staff.center || staff.centerName,
            // Prefer officeAddress array/string for display in the Center column
            officeAddressString: Array.isArray(staff.officeAddress)
              ? staff.officeAddress.filter(Boolean).join(', ')
              : (staff.officeAddress || '')
          }));
          // Apply center filtering - prioritize officeAddress field
          const filteredStaff = mappedStaff.filter(staff => {
            if (userCenter && userCenter !== 'all') {
              const staffCenter = staff.center || staff.centerName || '';
              const officeAddress = staff.officeAddressString || '';
              
              // Primary: Check if office address contains the center name
              let addressMatch = false;
              if (officeAddress) {
                const normalizedAddress = officeAddress.toLowerCase().trim();
                const normalizedUserCenter = userCenter.toLowerCase().trim();
                
                addressMatch = normalizedAddress === normalizedUserCenter ||
                              normalizedAddress.includes(normalizedUserCenter) ||
                              normalizedUserCenter.includes(normalizedAddress) ||
                              // Handle "Balong-Bato" vs "Balong-Bato Center" variations
                              normalizedAddress.replace(/\s*center$/i, '') === normalizedUserCenter ||
                              normalizedUserCenter.includes(normalizedAddress.replace(/\s*center$/i, ''));
              }
              
              // Fallback: Check center field if office address doesn't match
              let centerMatch = false;
              if (!addressMatch && staffCenter) {
                const normalizedCenter = staffCenter.toLowerCase().trim();
                const normalizedUserCenter = userCenter.toLowerCase().trim();
                
                centerMatch = normalizedCenter === normalizedUserCenter ||
                             normalizedCenter.includes(normalizedUserCenter) ||
                             normalizedUserCenter.includes(normalizedCenter) ||
                             normalizedCenter.replace(/\s*center$/i, '') === normalizedUserCenter ||
                             normalizedUserCenter.includes(normalizedCenter.replace(/\s*center$/i, ''));
              }
              
              const matches = addressMatch || centerMatch;
              
              if (!matches) {
                return false;
              }
              return true;
            }
            return true; // Super admin sees all
          });
          setStaff(filteredStaff);
        } else {
          showNotification('Failed to load staff data after adding', 'error');
        }
      } else {
        throw new Error(result.message || 'Failed to add staff');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      showNotification(error.message || 'Error adding staff', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number
  const validatePhone = (phone) => {
    const phoneRegex = /^09\d{9}$/; // Philippine mobile number format
    return phoneRegex.test(phone);
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const userCenter = getUserCenter();
        
        // Build API URL WITHOUT server-side center filtering.
        // We fetch broadly, then apply robust client-side filtering by center
        // to avoid missing data when backend fields vary across records.
        let apiUrl = '/api/staffs';
        if (userCenter && userCenter !== 'all') {
          console.log('Admin center detected, using client-side filtering for center:', userCenter);
        } else if (!userCenter) {
          console.log('No user center detected, fetching all staff for client-side filtering');
        }
        
        const res = await apiFetch(apiUrl);
        const data = await res.json();
        if (data.success) {
          // Apply additional client-side filtering if needed
          const allStaff = data.staffs || [];
          
          // Map the data to match expected field names
          const mappedStaff = allStaff.map(staff => ({
            ...staff,
            fullName: staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
            center: staff.center || staff.centerName,
            // Prefer officeAddress array/string for display in the Center column
            officeAddressString: Array.isArray(staff.officeAddress)
              ? staff.officeAddress.filter(Boolean).join(', ')
              : (staff.officeAddress || '')
          }));
          
          console.log('🔍 STAFF FILTERING DEBUG:');
          console.log('User center:', userCenter);
          console.log('Total staff before filtering:', mappedStaff.length);
          console.log('Sample staff data:', mappedStaff.slice(0, 2));
          
          // Apply center filtering - prioritize officeAddress field
          const filteredStaff = mappedStaff.filter(staff => {
            if (userCenter && userCenter !== 'all') {
              const staffCenter = staff.center || staff.centerName || '';
              const officeAddress = staff.officeAddressString || '';
              
              console.log(`Staff: ${staff.fullName}`);
              console.log(`  - Center field: "${staffCenter}"`);
              console.log(`  - Office address: "${officeAddress}"`);
              console.log(`  - User center: "${userCenter}"`);
              
              // Primary: Check if office address contains the center name
              let addressMatch = false;
              if (officeAddress) {
                // Normalize both strings for comparison
                const normalizedAddress = officeAddress.toLowerCase().trim();
                const normalizedUserCenter = userCenter.toLowerCase().trim();
                
                // Check for exact match or partial match
                addressMatch = normalizedAddress === normalizedUserCenter ||
                              normalizedAddress.includes(normalizedUserCenter) ||
                              normalizedUserCenter.includes(normalizedAddress) ||
                              // Handle "Balong-Bato" vs "Balong-Bato Center" variations
                              normalizedAddress.replace(/\s*center$/i, '') === normalizedUserCenter ||
                              normalizedUserCenter.includes(normalizedAddress.replace(/\s*center$/i, ''));
              }
              
              // Fallback: Check center field if office address doesn't match
              let centerMatch = false;
              if (!addressMatch && staffCenter) {
                const normalizedCenter = staffCenter.toLowerCase().trim();
                const normalizedUserCenter = userCenter.toLowerCase().trim();
                
                centerMatch = normalizedCenter === normalizedUserCenter ||
                             normalizedCenter.includes(normalizedUserCenter) ||
                             normalizedUserCenter.includes(normalizedCenter) ||
                             normalizedCenter.replace(/\s*center$/i, '') === normalizedUserCenter ||
                             normalizedUserCenter.includes(normalizedCenter.replace(/\s*center$/i, ''));
              }
              
              console.log(`  - Address match: ${addressMatch}`);
              console.log(`  - Center match: ${centerMatch}`);
              
              const matches = addressMatch || centerMatch;
              
              if (!matches) {
                console.log('❌ FILTERING OUT:', staff.fullName, '- No officeAddress/center match');
                return false;
              }
              console.log('✅ KEEPING:', staff.fullName, '- officeAddress/center matches');
              return true;
            }
            return true; // Super admin sees all
          });
          
          console.log('🔍 STAFF FILTERING DEBUG: Filtered staff count:', filteredStaff.length);
          setStaff(filteredStaff);
        } else {
          showNotification('Failed to load staff data', 'error');
        }
      } catch (error) {
        showNotification('Error loading staff data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  // Load centers from Center Data Management for the filter dropdown (superadmin only)
  useEffect(() => {
    if (!isSuperAdmin) {
      setCenterOptions([]);
      return;
    }
    
    const fetchCenters = async () => {
      try {
        const res = await apiFetch('/api/centers');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.centers || []);
        const names = Array.from(new Set((list || [])
          .filter(c => !c.isArchived)
          .map(c => String(c.centerName || c.name || '').trim())
          .filter(Boolean))
        ).sort((a,b)=>a.localeCompare(b));
        setCenterOptions(names);
      } catch (_) {
        setCenterOptions([]);
      }
    };
    fetchCenters();
  }, [isSuperAdmin]);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(staff.map(s => s.role).filter(Boolean))];
    return roles.sort();
  }, [staff]);

  // Filtered staff data
  const filteredStaff = useMemo(() => {
    let filteredStaff = staff;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredStaff = filteredStaff.filter(s => 
        [s.fullName, s.email, s.phone, s.role]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(searchLower))
      );
    }

    // Role filter
    if (roleFilter) {
      filteredStaff = filteredStaff.filter(s => 
        s.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter) {
      filteredStaff = filteredStaff.filter(s => {
        if (statusFilter === 'pending') return !s.isApproved || !s.isVerified;
        if (statusFilter === 'active') return s.isApproved;
        if (statusFilter === 'inactive') return s.isApproved === false;
        return true;
      });
    }

    // Center filter
    if (centerFilter) {
      filteredStaff = filteredStaff.filter(s => {
        const haystack = `${s.officeAddressString || ''} ${s.center || ''}`.toLowerCase();
        return haystack.includes(centerFilter.toLowerCase());
      });
    }

    // Calculate pagination
    const total = filteredStaff.length;
    const totalPagesCount = Math.ceil(total / PAGE_SIZE);
    setTotalItems(total);
    setTotalPages(totalPagesCount);
    
    // Apply pagination
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    
    return filteredStaff.slice(startIndex, endIndex);
  }, [searchTerm, roleFilter, statusFilter, centerFilter, staff, page]);

  // Staff actions
  const handleApprove = async (staffId) => {
    try {
      const res = await apiFetch(`/api/staffs/${staffId}/approve`, { method: 'POST' });
      if (res.ok) {
        setStaff(staff.map(s => 
          s._id === staffId ? { ...s, isApproved: true } : s
        ));
        showNotification('Staff approved successfully', 'success');
      } else {
        showNotification('Failed to approve staff', 'error');
      }
    } catch (error) {
      showNotification('Error approving staff', 'error');
    }
  };

  const handleReject = async (staffId) => {
    try {
      const res = await apiFetch(`/api/staffs/${staffId}`, { method: 'DELETE' });
      if (res.ok) {
        setStaff(staff.filter(s => s._id !== staffId));
        showNotification('Staff rejected successfully', 'success');
      } else {
        showNotification('Failed to reject staff', 'error');
      }
    } catch (error) {
      showNotification('Error rejecting staff', 'error');
    }
  };

  const handleActivate = async (staffId) => {
    try {
      const res = await apiFetch(`/api/staffs/${staffId}/activate`, { method: 'POST' });
      if (res.ok) {
        setStaff(staff.map(s => 
          s._id === staffId ? { ...s, isApproved: true } : s
        ));
        showNotification('Staff activated successfully', 'success');
      } else {
        showNotification('Failed to activate staff', 'error');
      }
    } catch (error) {
      showNotification('Error activating staff', 'error');
    }
  };

  const handleDeactivate = async (staffId) => {
    try {
      const res = await apiFetch(`/api/staffs/${staffId}/deactivate`, { method: 'POST' });
      if (res.ok) {
        setStaff(staff.map(s => 
          s._id === staffId ? { ...s, isApproved: false } : s
        ));
        showNotification('Staff deactivated successfully', 'success');
      } else {
        showNotification('Failed to deactivate staff', 'error');
      }
    } catch (error) {
      showNotification('Error deactivating staff', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      <ResponsiveSidebar onSignOut={handleSignOut} />
      <main className="main-content">
        <div className="content-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <h2 style={{ margin:0 }}>Staff Account Management</h2>
          <button 
            className="btn-approve"
            onClick={openAddModal}
            style={{ display:'inline-flex', alignItems:'center', gap:8 }}
            title="Add Staff"
          >
            <i className="fa fa-user-plus"></i>
            <span>Add Staff</span>
          </button>
        </div>

                <div className="accounts-container">
          {/* Search and Filters */}
          <div className="filters-container">
            <div className="search-box">
              <i className="fa fa-search" />
              <input
                type="text"
                placeholder="Search by name, email, phone or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              {isSuperAdmin && (
                <select 
                  value={centerFilter} 
                  onChange={(e) => setCenterFilter(e.target.value)}
                  className="filter-select"
                  aria-label="Filter by health center"
                  title="Filter by center"
                >
                  <option value="">All Centers</option>
                  {centerOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
                             <select 
                 value={roleFilter} 
                 onChange={(e) => setRoleFilter(e.target.value)}
                 className="filter-select"
                 aria-label="Filter by staff role"
                 title="Filter by role"
               >
                 <option value="">All Roles</option>
                 {uniqueRoles.map(role => (
                   <option key={role} value={role}>{role}</option>
                 ))}
               </select>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter by staff status"
                title="Filter by status"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          

          {loading ? (
            <UnifiedSpinner text="Loading staff..." />
          ) : (
            <div className="table-container">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Center</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => {
                    const isPending = !s.isApproved || !s.isVerified;
                    const statusText = isPending ? 'Pending' : (s.isApproved ? 'Active' : 'Inactive');
                    const statusClass = isPending ? 'pending' : (s.isApproved ? 'active' : 'inactive');

                    return (
                      <tr key={s._id}>
                        <td>{s.staffId || '-'}</td>
                        <td>{s.fullName || `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim()}</td>
                        <td>{s.role || '-'}</td>
                        <td>{(s.officeAddressString && s.officeAddressString.trim()) || s.center || '-'}</td>
                        <td>{s.phone || '-'}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {isPending ? (
                              <>
                                <button 
                                  className="btn-approve" 
                                  onClick={() => customConfirm(
                                    'Are you sure you want to approve this staff account?',
                                    { action: () => handleApprove(s._id) }
                                  )}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn-reject" 
                                  onClick={() => customConfirm(
                                    'Are you sure you want to reject this staff account?',
                                    { action: () => handleReject(s._id) }
                                  )}
                                >
                                  Reject
                                </button>
                              </>
                            ) : s.isApproved ? (
                              <>
                                <button
                                  className="btn-deactivate"
                                  onClick={() => customConfirm(
                                    'Are you sure you want to deactivate this staff account?',
                                    { action: () => handleDeactivate(s._id) }
                                  )}
                                >
                                  Deactivate
                                </button>
                                <button
                                  className="btn-password"
                                  onClick={() => handlePasswordChange(s._id)}
                                  title="Change Password"
                                >
                                  <i className="fa-solid fa-key"></i> Password
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn-activate"
                                  onClick={() => customConfirm(
                                    'Are you sure you want to activate this staff account?',
                                    { action: () => handleActivate(s._id) }
                                  )}
                                >
                                  Activate
                                </button>
                                <button
                                  className="btn-password"
                                  onClick={() => handlePasswordChange(s._id)}
                                  title="Change Password"
                                >
                                  <i className="fa-solid fa-key"></i> Password
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredStaff.length > 0 && (
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
          )}
        </div>
      </main>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
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
        title="Change Password"
        message={`Change password for staff account`}
        icon={<i className="fa-solid fa-key"></i>}
        iconType="info"
        confirmText="Change Password"
        cancelText="Cancel"
        onConfirm={confirmPasswordChange}
        isLoading={isProcessing}
        loadingText="Changing Password..."
        size="sm"
        customContent={
          <div className="password-change-form">
            {/* New Password Fields */}
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                placeholder="Enter new password"
                className={`password-input ${passwordError && newPassword.length > 0 ? 'error' : ''}`}
              />
              {newPassword.length > 0 && (
                <div className="password-strength">
                  <div className={`strength-bar ${newPassword.length >= 8 ? 'strong' : newPassword.length >= 4 ? 'medium' : 'weak'}`}></div>
                  <span className="strength-text">
                    {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 4 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                placeholder="Confirm new password"
                className="password-input"
              />
            </div>
            {passwordError && (
              <div className="password-error">
                <i className="fa-solid fa-exclamation-triangle"></i>
                {passwordError}
              </div>
            )}
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character (@$!%*?&)</li>
              </ul>
            </div>
          </div>
        }
      />

      {/* Add Staff Modal */}
      <UnifiedModal
        isOpen={showAddStaffModal}
        onClose={closeAddModal}
        title="Add Staff"
        icon={<i className="fa-solid fa-user-plus"></i>}
        iconType="info"
        confirmText="Create"
        cancelText="Cancel"
        onConfirm={handleAddStaffSubmit}
        isLoading={isProcessing}
        loadingText="Creating..."
        size="md"
        customContent={
          <div className="add-staff-form" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12 }}>
            {addStaffError && (
              <div className="error-message" style={{ gridColumn:'1/-1', color:'#b91c1c', background:'#fee2e2', padding:8, borderRadius:6 }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight:6 }}></i>
                {addStaffError}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="addFirstName">First Name</label>
              <input
                type="text"
                id="addFirstName"
                value={newStaffData.firstName}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="addLastName">Last Name</label>
              <input
                type="text"
                id="addLastName"
                value={newStaffData.lastName}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="addEmail">Email</label>
              <input
                type="email"
                id="addEmail"
                value={newStaffData.email}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="addPhone">Phone</label>
              <input
                type="tel"
                id="addPhone"
                value={newStaffData.phone}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number (e.g., 09123456789)"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="addRole">Role</label>
              <input
                id="addRole"
                type="text"
                className="form-control"
                value={newStaffData.role}
                readOnly
              />
            </div>
            <div className="form-group">
              <label htmlFor="addCenter">Center</label>
              <select
                id="addCenter"
                value={newStaffData.center}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, center: e.target.value }))}
                className="form-control"
                required
              >
                <option value="">Select Center</option>
                {centerOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="addOfficeAddress">Office Address (if applicable)</label>
              <textarea
                id="addOfficeAddress"
                value={newStaffData.officeAddress}
                onChange={(e) => setNewStaffData(prev => ({ ...prev, officeAddress: e.target.value }))}
                placeholder="Enter office address (e.g., 123 Main St, Manila)"
                className="form-control"
              />
            </div>
            {/* Auto-set status; no manual checkboxes to keep UI clean */}
          </div>
        }
      />
    </div>
  );
};

export default SuperAdminStaffManagement;
