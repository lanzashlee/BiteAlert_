import React from 'react';
import './GlobalModal.css';

const UnifiedModal = ({
  isOpen,
  onClose,
  title,
  message,
  subtitle,
  icon,
  iconType = 'default', // default, warning, danger, success, info
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  loadingText = 'Processing...',
  showCancel = true,
  confirmButtonClass = 'confirm-btn',
  cancelButtonClass = 'cancel-btn',
  customContent = null,
  size = 'md' // 'sm' | 'md' | 'lg'
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('unified-modal-overlay')) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm && !isLoading) {
      onConfirm();
    }
  };

  const contentStyle = size === 'sm'
    ? { maxWidth: '460px', width: '92%' }
    : size === 'lg'
      ? { maxWidth: '900px', width: '95%' }
      : {};

  return (
    <div className="unified-modal active">
      <div className="unified-modal-overlay" onClick={handleOverlayClick}></div>
      <div className={`unified-modal-content ${customContent ? 'has-custom-content' : ''}`} style={contentStyle}>
        <div className="unified-modal-header">
          {icon && (
            <div className={`unified-modal-icon-wrapper ${iconType}`}>
              {icon}
            </div>
          )}
          <h3>{title}</h3>
        </div>
        <div className="unified-modal-body">
          {customContent ? (
            customContent
          ) : (
            <>
              <p>{message}</p>
              {subtitle && <span className="unified-modal-subtitle">{subtitle}</span>}
            </>
          )}
        </div>
        <div className="unified-modal-footer">
          {showCancel && (
            <button 
              className={`cancel-btn ${cancelButtonClass}`} 
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}
          <button 
            className={`confirm-btn ${confirmButtonClass}`} 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedModal;
