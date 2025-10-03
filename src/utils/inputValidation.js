/**
 * Input validation utilities for the BiteAlert application
 * Provides comprehensive validation for all user inputs
 */

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^09\d{9}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  name: /^[a-zA-Z\s\-'\.]+$/,
  address: /^[a-zA-Z0-9\s\-'\.\,]+$/,
  patientId: /^[A-Z]{2,3}-[A-Z]{2}\d{8}$/,
  adminId: /^AD\d{3}$/,
  superAdminId: /^SA\d{3}$/,
  staffId: /^ST\d{3}$/,
  centerId: /^C\d{3}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
};

// Input sanitization
export const sanitizeInput = (input, type = 'text') => {
  if (typeof input !== 'string') return input;
  
  let sanitized = input.trim();
  
  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:text\/html/gi, '') // Remove data: HTML
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
  
  // Type-specific sanitization
  switch (type) {
    case 'email':
      sanitized = sanitized.toLowerCase();
      break;
    case 'name':
      sanitized = sanitized.replace(/[^a-zA-Z\s\-'\.]/g, '');
      break;
    case 'phone':
      sanitized = sanitized.replace(/[^\d]/g, '');
      break;
    case 'numeric':
      sanitized = sanitized.replace(/[^\d]/g, '');
      break;
    case 'alphanumeric':
      sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
      break;
    case 'address':
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-'\.\,]/g, '');
      break;
    default:
      // General text sanitization
      sanitized = sanitized.replace(/[<>\"'&]/g, '');
  }
  
  return sanitized;
};

// Validation functions
export const validateEmail = (email) => {
  const sanitized = sanitizeInput(email, 'email');
  return {
    valid: patterns.email.test(sanitized),
    value: sanitized,
    message: patterns.email.test(sanitized) ? 'Valid email' : 'Please enter a valid email address'
  };
};

export const validatePhone = (phone) => {
  const sanitized = sanitizeInput(phone, 'phone');
  return {
    valid: patterns.phone.test(sanitized),
    value: sanitized,
    message: patterns.phone.test(sanitized) ? 'Valid phone number' : 'Please enter a valid phone number (09XXXXXXXXX)'
  };
};

export const validateName = (name, fieldName = 'Name') => {
  const sanitized = sanitizeInput(name, 'name');
  if (!sanitized || sanitized.length < 2) {
    return {
      valid: false,
      value: sanitized,
      message: `${fieldName} must be at least 2 characters long`
    };
  }
  if (sanitized.length > 50) {
    return {
      valid: false,
      value: sanitized,
      message: `${fieldName} must be less than 50 characters`
    };
  }
  return {
    valid: patterns.name.test(sanitized),
    value: sanitized,
    message: patterns.name.test(sanitized) ? `Valid ${fieldName.toLowerCase()}` : `${fieldName} contains invalid characters`
  };
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character'
    };
  }
  
  return {
    valid: true,
    message: 'Password is strong'
  };
};

export const validatePatientId = (patientId) => {
  const sanitized = sanitizeInput(patientId, 'alphanumeric');
  return {
    valid: patterns.patientId.test(sanitized),
    value: sanitized,
    message: patterns.patientId.test(sanitized) ? 'Valid patient ID' : 'Please enter a valid patient ID (e.g., PAT-LJ20250001)'
  };
};

export const validateAdminId = (adminId) => {
  const sanitized = sanitizeInput(adminId, 'alphanumeric');
  return {
    valid: patterns.adminId.test(sanitized),
    value: sanitized,
    message: patterns.adminId.test(sanitized) ? 'Valid admin ID' : 'Please enter a valid admin ID (e.g., AD001)'
  };
};

export const validateAge = (age) => {
  const sanitized = sanitizeInput(age, 'numeric');
  const ageNum = parseInt(sanitized);
  
  if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
    return {
      valid: false,
      value: sanitized,
      message: 'Please enter a valid age (0-150)'
    };
  }
  
  return {
    valid: true,
    value: sanitized,
    message: 'Valid age'
  };
};

export const validateWeight = (weight) => {
  const sanitized = sanitizeInput(weight, 'numeric');
  const weightNum = parseFloat(sanitized);
  
  if (isNaN(weightNum) || weightNum < 0 || weightNum > 500) {
    return {
      valid: false,
      value: sanitized,
      message: 'Please enter a valid weight (0-500 kg)'
    };
  }
  
  return {
    valid: true,
    value: sanitized,
    message: 'Valid weight'
  };
};

export const validateAddress = (address) => {
  const sanitized = sanitizeInput(address, 'address');
  
  if (!sanitized || sanitized.length < 5) {
    return {
      valid: false,
      value: sanitized,
      message: 'Address must be at least 5 characters long'
    };
  }
  
  if (sanitized.length > 200) {
    return {
      valid: false,
      value: sanitized,
      message: 'Address must be less than 200 characters'
    };
  }
  
  return {
    valid: true,
    value: sanitized,
    message: 'Valid address'
  };
};

// Form validation
export const validateForm = (formData, validationRules) => {
  const errors = {};
  const sanitizedData = {};
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];
    const sanitized = sanitizeInput(value, rules.type || 'text');
    sanitizedData[field] = sanitized;
    
    // Required field check
    if (rules.required && (!sanitized || sanitized.trim() === '')) {
      errors[field] = `${rules.label || field} is required`;
      continue;
    }
    
    // Skip validation if field is empty and not required
    if (!sanitized && !rules.required) {
      continue;
    }
    
    // Custom validation function
    if (rules.validate) {
      const result = rules.validate(sanitized);
      if (!result.valid) {
        errors[field] = result.message;
      }
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(sanitized)) {
      errors[field] = rules.message || `${rules.label || field} format is invalid`;
    }
    
    // Length validation
    if (rules.minLength && sanitized.length < rules.minLength) {
      errors[field] = `${rules.label || field} must be at least ${rules.minLength} characters`;
    }
    
    if (rules.maxLength && sanitized.length > rules.maxLength) {
      errors[field] = `${rules.label || field} must be less than ${rules.maxLength} characters`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
};

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    validate: validateEmail,
    label: 'Email'
  },
  phone: {
    required: true,
    validate: validatePhone,
    label: 'Phone Number'
  },
  firstName: {
    required: true,
    validate: (name) => validateName(name, 'First Name'),
    label: 'First Name'
  },
  lastName: {
    required: true,
    validate: (name) => validateName(name, 'Last Name'),
    label: 'Last Name'
  },
  password: {
    required: true,
    validate: validatePassword,
    label: 'Password'
  },
  age: {
    required: false,
    validate: validateAge,
    label: 'Age'
  },
  weight: {
    required: false,
    validate: validateWeight,
    label: 'Weight'
  },
  address: {
    required: true,
    validate: validateAddress,
    label: 'Address'
  }
};
