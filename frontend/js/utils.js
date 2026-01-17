/* ==========================================================================
   Medicare - Utility Functions
   Common helper functions used across the application
   ========================================================================== */

/**
 * DOM Ready Handler
 * Executes callback when DOM is fully loaded
 * @param {Function} callback - Function to execute when DOM is ready
 */
function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

/**
 * Query Selector Shorthand
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element|null} - Found element or null
 */
function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query Selector All Shorthand
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {NodeList} - Found elements
 */
function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/* ==========================================================================
   VALIDATION UTILITIES
   ========================================================================== */

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates password strength
 * Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and message
 */
function validatePassword(password) {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: 'Password is strong' };
}

/**
 * Validates medical measurement ranges
 * @param {string} type - Type of measurement (heartRate, bloodPressure, glucose, temperature)
 * @param {number} value - Measurement value
 * @param {number} value2 - Second value for blood pressure (diastolic)
 * @returns {object} - Validation result with isValid, status, and message
 */
function validateMeasurement(type, value, value2 = null) {
    const ranges = {
        heartRate: { min: 40, max: 200, optimalMin: 60, optimalMax: 100, unit: 'bpm' },
        glucose: { min: 20, max: 600, optimalMin: 70, optimalMax: 140, unit: 'mg/dL' },
        temperature: { min: 35, max: 42, optimalMin: 36.1, optimalMax: 37.2, unit: '°C' },
        systolic: { min: 70, max: 250, optimalMin: 90, optimalMax: 120, unit: 'mmHg' },
        diastolic: { min: 40, max: 150, optimalMin: 60, optimalMax: 80, unit: 'mmHg' }
    };

    // Blood pressure special handling
    if (type === 'bloodPressure') {
        const systolicResult = validateMeasurement('systolic', value);
        const diastolicResult = validateMeasurement('diastolic', value2);
        
        if (!systolicResult.isValid || !diastolicResult.isValid) {
            return { 
                isValid: false, 
                status: 'error',
                message: 'Blood pressure values seem incorrect. Please check your readings.' 
            };
        }
        
        // Determine overall status
        if (systolicResult.status === 'optimal' && diastolicResult.status === 'optimal') {
            return { isValid: true, status: 'optimal', message: 'Blood pressure is optimal' };
        } else if (systolicResult.status === 'critical' || diastolicResult.status === 'critical') {
            return { isValid: true, status: 'critical', message: 'Blood pressure needs attention' };
        }
        return { isValid: true, status: 'warning', message: 'Blood pressure is slightly off' };
    }

    const range = ranges[type];
    if (!range) {
        return { isValid: false, status: 'error', message: 'Unknown measurement type' };
    }

    // Check if value is within valid range
    if (value < range.min || value > range.max) {
        return { 
            isValid: false, 
            status: 'error',
            message: `Value seems incorrect. Expected ${range.min}-${range.max} ${range.unit}` 
        };
    }

    // Determine status
    if (value >= range.optimalMin && value <= range.optimalMax) {
        return { isValid: true, status: 'optimal', message: 'Value is in optimal range' };
    } else if (value < range.optimalMin * 0.8 || value > range.optimalMax * 1.3) {
        return { isValid: true, status: 'critical', message: 'Value needs medical attention' };
    }
    return { isValid: true, status: 'warning', message: 'Value is slightly outside optimal range' };
}

/* ==========================================================================
   UI UTILITIES
   ========================================================================== */

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
    // Get or create toast container
    let container = $('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon based on type
    const icons = {
        success: '<i data-lucide="check-circle"></i>',
        error: '<i data-lucide="x-circle"></i>',
        warning: '<i data-lucide="alert-triangle"></i>',
        info: '<i data-lucide="info"></i>'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">
            <i data-lucide="x"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Initialize Lucide icons in toast
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));
    
    // Auto remove after duration
    setTimeout(() => removeToast(toast), duration);
}

/**
 * Removes a toast element with animation
 * @param {Element} toast - Toast element to remove
 */
function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
}

/**
 * Shows/hides loading state on a button
 * @param {Element} button - Button element
 * @param {boolean} isLoading - Whether to show loading state
 */
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

/**
 * Shows a modal
 * @param {string} modalId - ID of the modal element
 */
function showModal(modalId) {
    const modal = $(`#${modalId}`);
    const backdrop = $('.modal-backdrop');
    
    if (modal && backdrop) {
        backdrop.classList.add('active');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input in modal
        const firstInput = $('input, button', modal);
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Hides a modal
 * @param {string} modalId - ID of the modal element
 */
function hideModal(modalId) {
    const modal = $(`#${modalId}`);
    const backdrop = $('.modal-backdrop');
    
    if (modal && backdrop) {
        backdrop.classList.remove('active');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Formats a date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type (short, long, time, datetime)
 * @returns {string} - Formatted date string
 */
function formatDate(date, format = 'short') {
    const d = new Date(date);
    const options = {
        short: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
        datetime: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    };
    
    return d.toLocaleDateString('en-US', options[format] || options.short);
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Local storage wrapper with JSON support
 */
const storage = {
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    }
};

/* ==========================================================================
   NAVIGATION UTILITIES
   ========================================================================== */

/**
 * Navigate to a page
 * @param {string} page - Page filename (e.g., 'dashboard.html')
 */
function navigateTo(page) {
    window.location.href = page;
}

/**
 * Get current page name
 * @returns {string} - Current page filename
 */
function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
}

/**
 * Set active navigation item based on current page
 */
function setActiveNavItem() {
    const currentPage = getCurrentPage();
    
    // Update bottom nav
    $$('.bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('href') === currentPage);
    });
    
    // Update sidebar nav
    $$('.sidebar-nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('href') === currentPage);
    });
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

// Initialize Lucide icons when DOM is ready
onDOMReady(() => {
    if (window.lucide) {
        lucide.createIcons();
    }
    setActiveNavItem();
});
