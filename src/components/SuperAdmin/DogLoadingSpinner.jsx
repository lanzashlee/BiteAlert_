import React from 'react';
import './DogLoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner" aria-label="Loading">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
