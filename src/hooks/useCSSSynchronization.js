// CSS Synchronization Hook
// Provides CSS synchronization for components to prevent UI breaking

import { useEffect, useCallback } from 'react';
import cssSynchronizer from '../utils/cssSynchronizer';

export const useCSSSynchronization = () => {
  // Synchronize CSS on component mount
  useEffect(() => {
    cssSynchronizer.onComponentMount();
  }, []);

  // Synchronize CSS on filter changes
  const onFilterChange = useCallback(() => {
    cssSynchronizer.onFilterChange();
  }, []);

  // Synchronize CSS on data changes
  const onDataChange = useCallback(() => {
    cssSynchronizer.onFilterChange();
  }, []);

  // Synchronize CSS on modal open/close
  const onModalToggle = useCallback(() => {
    cssSynchronizer.onFilterChange();
  }, []);

  return {
    onFilterChange,
    onDataChange,
    onModalToggle
  };
};
