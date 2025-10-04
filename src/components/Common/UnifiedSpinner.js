import React from 'react';
import './UnifiedSpinner.css';

const UnifiedSpinner = ({ 
  size = 'medium', 
  color = '#800000', 
  text = '', 
  fullScreen = false,
  centered = true,
  className = '' 
}) => {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  const spinner = (
    <div className={`unified-spinner ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: text ? '12px' : '0',
      width: centered ? '100%' : 'auto',
      height: centered ? '100%' : 'auto',
      minHeight: centered ? '200px' : 'auto'
    }}>
      <div 
        className="spinner-ring"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `3px solid ${color}20`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {text && (
        <p className="spinner-text" style={{ 
          margin: 0, 
          color: color, 
          fontSize: size === 'small' ? '12px' : '14px', 
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="spinner-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default UnifiedSpinner;
