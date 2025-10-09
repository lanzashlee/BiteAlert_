// Standardized CSS Import Utility
// This ensures all components load CSS in the correct order

// Standard CSS import order for all SuperAdmin components
export const standardCSSImports = [
  '../GlobalResponsive.css',
  './ResponsiveSidebar.css'
];

// Function to dynamically import CSS files in the correct order
export const loadStandardCSS = async () => {
  try {
    // Load CSS files in the correct order
    for (const cssPath of standardCSSImports) {
      await import(cssPath);
    }
  } catch (error) {
    console.warn('Error loading standard CSS:', error);
  }
};

// CSS class utilities for consistent styling
export const CSS_CLASSES = {
  DASHBOARD_CONTAINER: 'dashboard-container',
  MAIN_CONTENT: 'main-content',
  CONTENT_HEADER: 'content-header',
  TABLE_CONTAINER: 'table-container',
  MODAL_CONTAINER: 'modal-container',
  RESPONSIVE_GRID: 'responsive-grid',
  RESPONSIVE_FLEX: 'responsive-flex'
};

// Layout utility functions
export const layoutUtils = {
  // Force layout recalculation
  forceLayoutRecalculation: () => {
    // Force browser to recalculate layout
    document.body.offsetHeight;
    
    // Trigger reflow for all main content areas
    const mainContents = document.querySelectorAll('.main-content');
    mainContents.forEach(el => {
      el.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        el.style.transform = '';
      });
    });
  },

  // Ensure consistent layout classes
  ensureLayoutClasses: () => {
    const body = document.body;
    const app = document.querySelector('.App');
    
    // Add consistent layout classes
    body.classList.add('loaded');
    if (app) app.classList.add('loaded');
    
    // Remove loading states
    body.classList.remove('loading');
    document.querySelectorAll('.loading').forEach(el => {
      el.classList.remove('loading');
      el.classList.add('loaded');
    });
  },

  // Prevent layout shifts
  preventLayoutShifts: () => {
    // Add loading class to prevent FOUC
    document.body.classList.add('loading');
    
    // Remove loading class after a short delay
    setTimeout(() => {
      document.body.classList.remove('loading');
      document.body.classList.add('loaded');
    }, 100);
  }
};

// Hook for components to use standardized CSS loading
export const useStandardizedCSS = () => {
  const initializeCSS = async () => {
    await loadStandardCSS();
    layoutUtils.ensureLayoutClasses();
    layoutUtils.forceLayoutRecalculation();
  };

  return { initializeCSS };
};
