// CSS Synchronization Utility
// Prevents UI breaking and filtering issues by ensuring proper CSS loading order

class CSSSynchronizer {
  constructor() {
    this.loadedStyles = new Set();
    this.loadingPromises = new Map();
    this.syncQueue = [];
    this.isProcessing = false;
  }

  // Synchronize CSS loading to prevent conflicts
  async synchronizeCSS() {
    if (this.isProcessing) {
      return new Promise((resolve) => {
        this.syncQueue.push(resolve);
      });
    }

    this.isProcessing = true;

    try {
      // Wait for all CSS to be loaded
      await this.waitForCSSLoad();
      
      // Force layout recalculation
      this.forceLayoutRecalculation();
      
      // Ensure consistent styling
      this.ensureConsistentStyling();
      
      // Process queued operations
      this.syncQueue.forEach(resolve => resolve());
      this.syncQueue = [];
      
    } catch (error) {
      console.error('CSS synchronization error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Wait for all CSS files to be loaded
  async waitForCSSLoad() {
    return new Promise((resolve) => {
      const checkCSSLoaded = () => {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        const loadedCount = Array.from(stylesheets).filter(link => 
          link.sheet && link.sheet.cssRules && link.sheet.cssRules.length > 0
        ).length;
        
        if (loadedCount === stylesheets.length) {
          resolve();
        } else {
          setTimeout(checkCSSLoaded, 50);
        }
      };
      
      checkCSSLoaded();
    });
  }

  // Force layout recalculation to prevent UI breaking
  forceLayoutRecalculation() {
    // Force browser to recalculate layout
    void document.body.offsetHeight;
    
    // Trigger reflow for all main content areas
    const mainContents = document.querySelectorAll('.main-content');
    mainContents.forEach(el => {
      el.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        el.style.transform = '';
      });
    });

    // Force reflow for all tables and containers
    const tables = document.querySelectorAll('table, .table-container, .table-responsive');
    tables.forEach(el => {
      el.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        el.style.transform = '';
      });
    });

    // Force reflow for all filters and forms
    const filters = document.querySelectorAll('.filters-container, .filter-controls, .search-box');
    filters.forEach(el => {
      el.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        el.style.transform = '';
      });
    });
  }

  // Ensure consistent styling across all components
  ensureConsistentStyling() {
    // Add consistent classes to prevent layout shifts
    document.body.classList.add('css-synchronized');
    
    // Ensure all main content areas have consistent styling
    const mainContents = document.querySelectorAll('.main-content');
    mainContents.forEach(el => {
      el.classList.add('css-synchronized');
    });

    // Ensure all tables have consistent styling
    const tables = document.querySelectorAll('table, .table-container');
    tables.forEach(el => {
      el.classList.add('css-synchronized');
    });

    // Ensure all filters have consistent styling
    const filters = document.querySelectorAll('.filters-container, .filter-controls');
    filters.forEach(el => {
      el.classList.add('css-synchronized');
    });
  }

  // Synchronize on route changes
  onRouteChange() {
    setTimeout(() => {
      this.synchronizeCSS();
    }, 100);
  }

  // Synchronize on component mount
  onComponentMount() {
    setTimeout(() => {
      this.synchronizeCSS();
    }, 50);
  }

  // Synchronize on filter changes
  onFilterChange() {
    setTimeout(() => {
      this.forceLayoutRecalculation();
    }, 10);
  }

  // Initialize synchronization
  initialize() {
    // Listen for route changes
    window.addEventListener('popstate', () => this.onRouteChange());
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.onRouteChange());
    
    // Initial synchronization
    this.synchronizeCSS();
  }
}

// Create singleton instance
const cssSynchronizer = new CSSSynchronizer();

// Export for use in components
export default cssSynchronizer;

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cssSynchronizer.initialize();
    });
  } else {
    cssSynchronizer.initialize();
  }
}
