// CSS Loading Utility for Consistent Design Alignment
class CSSLoader {
  constructor() {
    this.loadedStyles = new Set();
    this.loadingPromises = new Map();
  }

  // Preload critical CSS files
  preloadCSS(href) {
    if (this.loadedStyles.has(href)) return Promise.resolve();
    if (this.loadingPromises.has(href)) return this.loadingPromises.get(href);

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = () => {
        // Convert preload to stylesheet
        link.rel = 'stylesheet';
        this.loadedStyles.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  // Load CSS file with proper error handling
  loadCSS(href) {
    if (this.loadedStyles.has(href)) return Promise.resolve();
    if (this.loadingPromises.has(href)) return this.loadingPromises.get(href);

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        this.loadedStyles.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  // Ensure consistent layout classes are applied
  ensureLayoutClasses() {
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
  }

  // Force layout recalculation to prevent alignment issues
  forceLayoutRecalculation() {
    // Force browser to recalculate layout
    void document.body.offsetHeight;
    
    // Trigger reflow for all main content areas
    const mainContents = document.querySelectorAll('.main-content');
    mainContents.forEach(el => {
      el.style.transform = 'translateZ(0)';
      // Remove transform after reflow
      requestAnimationFrame(() => {
        el.style.transform = '';
      });
    });
  }

  // Initialize CSS loading system
  async initialize() {
    try {
      // Preload critical CSS files
      await Promise.all([
        this.preloadCSS('/static/css/main.css'),
        this.preloadCSS('/static/css/769.ddd82acc.chunk.css'), // Responsive CSS
        this.preloadCSS('/static/css/324.ccf29614.chunk.css'), // Component CSS
      ]);

      // Ensure layout classes
      this.ensureLayoutClasses();
      
      // Force layout recalculation
      this.forceLayoutRecalculation();
      
      console.log('CSS loading system initialized successfully');
    } catch (error) {
      console.error('Error initializing CSS loading system:', error);
      // Fallback: ensure layout classes anyway
      this.ensureLayoutClasses();
    }
  }
}

// Create singleton instance
const cssLoader = new CSSLoader();

// Export for use in components
export default cssLoader;

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cssLoader.initialize();
    });
  } else {
    cssLoader.initialize();
  }
}
