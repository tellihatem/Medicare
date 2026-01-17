/* ==========================================================================
   Medicare - Patient Module
   Handles patient dashboard, checkups, and history
   ========================================================================== */

/* ==========================================================================
   PATIENT DASHBOARD
   ========================================================================== */

/**
 * Initialize patient dashboard
 * Loads user data and sets up event listeners
 */
function initPatientDashboard() {
    // Check authentication
    if (!checkAuth()) {
        navigateTo('login.html');
        return;
    }

    // Update user info in sidebar
    updateUserDisplay();
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up event listeners
    setupDashboardListeners();
}

/**
 * Update user display in sidebar and mobile header
 */
function updateUserDisplay() {
    const user = AuthState.user;
    if (!user) return;

    // Update sidebar user name
    const userName = $('.sidebar-user-name');
    if (userName) {
        userName.textContent = user.name || 'Patient';
    }

    // Update welcome message
    const welcomeTitle = $('.welcome-card-title');
    if (welcomeTitle) {
        const greeting = getGreeting();
        const firstName = user.name ? user.name.split(' ')[0] : 'there';
        welcomeTitle.textContent = `${greeting}, ${firstName}!`;
    }
}

/**
 * Get time-based greeting
 * @returns {string} - Greeting based on current time
 */
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

/**
 * Load dashboard data
 * In production, this will fetch from Firebase
 */
function loadDashboardData() {
    // Mock data - will be replaced with Firebase queries
    const mockHealthData = {
        heartRate: { value: 72, unit: 'bpm', status: 'optimal' },
        bloodPressure: { value: '120/80', unit: 'mmHg', status: 'optimal' },
        glucose: { value: 95, unit: 'mg/dL', status: 'optimal' },
        temperature: { value: 36.6, unit: '°C', status: 'optimal' }
    };

    // Update stat cards with data
    updateStatCards(mockHealthData);
}

/**
 * Update stat cards with health data
 * @param {object} data - Health measurement data
 */
function updateStatCards(data) {
    // This function will update the stat cards with real data
    // For now, the HTML has static demo values
    console.log('Dashboard data loaded:', data);
}

/**
 * Set up dashboard event listeners
 */
function setupDashboardListeners() {
    // Stat card clicks - could show detailed history
    $$('.stat-card.card-clickable').forEach(card => {
        card.addEventListener('click', handleStatCardClick);
    });

    // Notification bell click
    const notificationBtn = $('.mobile-header-actions .btn-icon');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            showToast('No new notifications', 'info');
        });
    }
}

/**
 * Handle stat card click
 * Shows detailed view or history for that measurement
 */
function handleStatCardClick(e) {
    const card = e.currentTarget;
    const label = card.querySelector('.stat-card-label')?.textContent;
    
    // Navigate to new checkup with pre-selected measurement type
    // For now, just show a toast
    showToast(`View ${label} history`, 'info');
}

/* ==========================================================================
   NEW CHECKUP PAGE
   ========================================================================== */

/**
 * Initialize new checkup page
 */
function initNewCheckupPage() {
    if (!checkAuth()) {
        navigateTo('login.html');
        return;
    }

    setupCheckupCards();
    setupModalHandlers();
}

/**
 * Set up checkup measurement cards
 */
function setupCheckupCards() {
    const measurementCards = $$('.measurement-card');
    
    measurementCards.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            openMeasurementModal(type);
        });
    });
}

/**
 * Open measurement input modal
 * @param {string} type - Measurement type (heartRate, bloodPressure, glucose, temperature)
 */
function openMeasurementModal(type) {
    const modalContent = getMeasurementModalContent(type);
    
    // Get or create modal elements
    let backdrop = $('.modal-backdrop');
    let modal = $('#measurementModal');
    
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);
    }
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'measurementModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = modalContent;
    
    // Show modal
    showModal('measurementModal');
    
    // Initialize Lucide icons
    if (window.lucide) lucide.createIcons();
    
    // Set up form submission
    const form = $('#measurementForm');
    if (form) {
        form.addEventListener('submit', (e) => handleMeasurementSubmit(e, type));
    }
    
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => hideModal('measurementModal'));
    }
    
    // Backdrop click to close
    backdrop.addEventListener('click', () => hideModal('measurementModal'));
}

/**
 * Get modal content based on measurement type
 * @param {string} type - Measurement type
 * @returns {string} - Modal HTML content
 */
function getMeasurementModalContent(type) {
    const configs = {
        heartRate: {
            title: 'Heart Rate',
            icon: 'heart-pulse',
            fields: `
                <div class="form-group">
                    <label for="heartRateValue" class="form-label required">Heart Rate (BPM)</label>
                    <input type="number" id="heartRateValue" name="value" class="form-input" 
                           placeholder="e.g., 72" min="40" max="200" required>
                    <p class="form-hint">Normal range: 60-100 bpm</p>
                </div>
            `
        },
        bloodPressure: {
            title: 'Blood Pressure',
            icon: 'activity',
            fields: `
                <div class="form-group">
                    <label for="systolic" class="form-label required">Systolic (mmHg)</label>
                    <input type="number" id="systolic" name="systolic" class="form-input" 
                           placeholder="e.g., 120" min="70" max="250" required>
                </div>
                <div class="form-group">
                    <label for="diastolic" class="form-label required">Diastolic (mmHg)</label>
                    <input type="number" id="diastolic" name="diastolic" class="form-input" 
                           placeholder="e.g., 80" min="40" max="150" required>
                    <p class="form-hint">Normal: 120/80 mmHg</p>
                </div>
            `
        },
        glucose: {
            title: 'Blood Glucose',
            icon: 'droplets',
            fields: `
                <div class="form-group">
                    <label for="glucoseValue" class="form-label required">Blood Glucose (mg/dL)</label>
                    <input type="number" id="glucoseValue" name="value" class="form-input" 
                           placeholder="e.g., 95" min="20" max="600" required>
                    <p class="form-hint">Fasting: 70-100 mg/dL | After meal: up to 140 mg/dL</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Measurement Time</label>
                    <div class="flex gap-4">
                        <label class="form-check">
                            <input type="radio" name="measureTime" value="fasting" class="form-check-input" checked>
                            <span class="form-check-label">Fasting</span>
                        </label>
                        <label class="form-check">
                            <input type="radio" name="measureTime" value="afterMeal" class="form-check-input">
                            <span class="form-check-label">After Meal</span>
                        </label>
                    </div>
                </div>
            `
        },
        temperature: {
            title: 'Body Temperature',
            icon: 'thermometer',
            fields: `
                <div class="form-group">
                    <label for="tempValue" class="form-label required">Temperature (°C)</label>
                    <input type="number" id="tempValue" name="value" class="form-input" 
                           placeholder="e.g., 36.6" min="35" max="42" step="0.1" required>
                    <p class="form-hint">Normal range: 36.1-37.2 °C</p>
                </div>
            `
        }
    };

    const config = configs[type];
    if (!config) return '';

    return `
        <div class="modal-header">
            <h2 class="modal-title">
                <i data-lucide="${config.icon}" style="width: 24px; height: 24px; margin-right: 8px;"></i>
                ${config.title}
            </h2>
            <button class="modal-close" aria-label="Close">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="measurementForm" novalidate>
                ${config.fields}
                <div class="form-group">
                    <label for="notes" class="form-label">Notes (Optional)</label>
                    <textarea id="notes" name="notes" class="form-input form-textarea" 
                              placeholder="Any additional notes..."></textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="hideModal('measurementModal')">Cancel</button>
            <button type="submit" form="measurementForm" class="btn btn-primary">
                <i data-lucide="send"></i>
                Submit
            </button>
        </div>
    `;
}

/**
 * Handle measurement form submission
 * @param {Event} e - Form submit event
 * @param {string} type - Measurement type
 */
async function handleMeasurementSubmit(e, type) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.closest('.modal').querySelector('.modal-footer .btn-primary');
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validate measurement
    let validationResult;
    if (type === 'bloodPressure') {
        validationResult = validateMeasurement(type, Number(data.systolic), Number(data.diastolic));
    } else {
        validationResult = validateMeasurement(type, Number(data.value));
    }
    
    if (!validationResult.isValid) {
        showToast(validationResult.message, 'error');
        return;
    }
    
    // Show loading
    setButtonLoading(submitBtn, true);
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Success - close modal and show message
        hideModal('measurementModal');
        
        showToast('Measurement submitted! AI report generated and sent to doctor for review.', 'success', 5000);
        
        // Optionally refresh dashboard data
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Submission error:', error);
        showToast('Failed to submit measurement. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Set up modal close handlers
 */
function setupModalHandlers() {
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = $('.modal.active');
            if (activeModal) {
                hideModal(activeModal.id);
            }
        }
    });
}

/* ==========================================================================
   TREATMENT HISTORY PAGE
   ========================================================================== */

/**
 * Initialize treatment history page
 */
function initHistoryPage() {
    if (!checkAuth()) {
        navigateTo('login.html');
        return;
    }

    loadTreatmentHistory();
    setupHistoryListeners();
}

/**
 * Load treatment history from storage/Firebase
 */
function loadTreatmentHistory() {
    // Mock data - will be replaced with Firebase queries
    const mockHistory = [
        {
            id: 'th_001',
            date: '2026-01-10',
            type: 'Regular Checkup',
            status: 'reviewed',
            isRead: false,
            aiReport: 'Blood pressure and heart rate are within normal range. Blood glucose slightly elevated.',
            doctorReview: 'Patient is in good health. Continue current medication. Monitor glucose levels.',
            prescription: 'prescription_001.pdf'
        },
        {
            id: 'th_002',
            date: '2026-01-05',
            type: 'Blood Glucose Check',
            status: 'reviewed',
            isRead: true,
            aiReport: 'Fasting blood glucose: 110 mg/dL - slightly above normal range.',
            doctorReview: 'Recommend dietary adjustments. Schedule follow-up in 2 weeks.',
            prescription: null
        }
    ];

    renderHistoryList(mockHistory);
}

/**
 * Render treatment history list
 * @param {array} history - Array of treatment records
 */
function renderHistoryList(history) {
    const container = $('.history-list');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="file-x" class="empty-state-icon"></i>
                <h3 class="empty-state-title">No Treatment History</h3>
                <p class="empty-state-description">Your treatment records will appear here after your first checkup.</p>
                <a href="new-checkup.html" class="btn btn-primary">Start First Checkup</a>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = history.map(record => `
        <div class="history-card card ${record.isRead ? '' : 'unread'}" data-id="${record.id}">
            <div class="history-card-header">
                <div class="history-card-date">
                    <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                    ${formatDate(record.date)}
                </div>
                ${!record.isRead ? '<span class="badge badge-primary">New</span>' : ''}
            </div>
            <h4 class="history-card-title">${record.type}</h4>
            <p class="history-card-preview">${record.aiReport.substring(0, 100)}...</p>
            <div class="history-card-footer">
                <span class="badge badge-success">
                    <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
                    Doctor Reviewed
                </span>
                ${record.prescription ? `
                    <button class="btn btn-ghost btn-sm" onclick="downloadPrescription('${record.prescription}')">
                        <i data-lucide="download"></i>
                        Prescription
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

/**
 * Set up history page event listeners
 */
function setupHistoryListeners() {
    // History card click to view details
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.history-card');
        if (card && !e.target.closest('.btn')) {
            const id = card.dataset.id;
            viewHistoryDetail(id);
        }
    });
}

/**
 * View treatment history detail
 * @param {string} id - Record ID
 */
function viewHistoryDetail(id) {
    // Mark as read
    const card = $(`.history-card[data-id="${id}"]`);
    if (card) {
        card.classList.remove('unread');
        const badge = card.querySelector('.badge-primary');
        if (badge) badge.remove();
    }

    // Get record data (mock - will be from Firebase)
    const mockRecords = {
        'th_001': {
            date: 'January 10, 2026',
            type: 'Regular Health Checkup',
            measurements: { heartRate: '72 bpm', bloodPressure: '120/80 mmHg', glucose: '110 mg/dL', temperature: '36.6°C' },
            aiReport: 'Blood pressure and heart rate are within normal range. Blood glucose at 110 mg/dL is slightly elevated above the optimal fasting range (70-100 mg/dL). Temperature is normal.',
            doctorReview: 'Patient is in good health overall. Blood glucose slightly elevated - recommend dietary adjustments to reduce refined carbohydrate intake. Continue current medication regimen. Schedule follow-up in 2 weeks to reassess glucose levels.',
            doctorName: 'Dr. Sarah Smith',
            prescription: 'prescription_001.pdf'
        },
        'th_002': {
            date: 'January 5, 2026',
            type: 'Blood Glucose Monitoring',
            measurements: { glucose: '95 mg/dL' },
            aiReport: 'Fasting blood glucose: 95 mg/dL - within normal range. Post-meal reading at 130 mg/dL is acceptable.',
            doctorReview: 'Glucose levels have improved. Continue current Metformin dosage. Maintain dietary changes. Good progress!',
            doctorName: 'Dr. Sarah Smith',
            prescription: null
        },
        'th_003': {
            date: 'December 28, 2025',
            type: 'Blood Pressure Check',
            measurements: { bloodPressure: '125/82 mmHg', heartRate: '78 bpm' },
            aiReport: 'Blood pressure reading: 125/82 mmHg - slightly elevated. Heart rate: 78 bpm - normal.',
            doctorReview: 'Blood pressure slightly elevated. Recommended to reduce sodium intake and increase physical activity. Continue Lisinopril 10mg daily.',
            doctorName: 'Dr. Sarah Smith',
            prescription: 'prescription_002.pdf'
        },
        'th_004': {
            date: 'December 20, 2025',
            type: 'Temperature Check',
            measurements: { temperature: '37.1°C' },
            aiReport: 'Body temperature: 37.1°C - slightly elevated but within normal variation. No concerning symptoms detected.',
            doctorReview: 'Temperature within acceptable range. Monitor for any additional symptoms. Rest recommended.',
            doctorName: 'Dr. Sarah Smith',
            prescription: null
        }
    };

    const record = mockRecords[id];
    if (!record) {
        showToast('Record not found', 'error');
        return;
    }

    // Show detail modal
    openHistoryDetailModal(record);
}

/**
 * Open history detail modal
 * @param {object} record - Treatment record data
 */
function openHistoryDetailModal(record) {
    // Build measurements HTML
    const measurementsHtml = Object.entries(record.measurements).map(([key, value]) => {
        const labels = { heartRate: 'Heart Rate', bloodPressure: 'Blood Pressure', glucose: 'Blood Glucose', temperature: 'Temperature' };
        return `<div class="detail-stat"><span class="detail-stat-label">${labels[key] || key}</span><span class="detail-stat-value">${value}</span></div>`;
    }).join('');

    const modalContent = `
        <div class="modal-header">
            <h2 class="modal-title">${record.type}</h2>
            <button class="modal-close" onclick="hideModal('historyDetailModal')" aria-label="Close">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="detail-date">
                <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                ${record.date}
            </div>
            
            <div class="detail-section">
                <h4 class="detail-section-title">Measurements</h4>
                <div class="detail-stats-grid">${measurementsHtml}</div>
            </div>
            
            <div class="detail-section">
                <h4 class="detail-section-title">
                    <i data-lucide="stethoscope" style="width: 16px; height: 16px;"></i>
                    Doctor's Review
                </h4>
                <p class="detail-text">${record.doctorReview}</p>
                <p class="detail-doctor">— ${record.doctorName}</p>
            </div>
            
            ${record.prescription ? `
                <div class="detail-section">
                    <button class="btn btn-secondary btn-full" onclick="downloadPrescription('${record.prescription}')">
                        <i data-lucide="download"></i>
                        Download Prescription
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    // Create or get modal elements
    let backdrop = $('.modal-backdrop');
    let modal = $('#historyDetailModal');

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);
    }

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'historyDetailModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = modalContent;
    showModal('historyDetailModal');

    if (window.lucide) lucide.createIcons();

    // Close on backdrop click
    backdrop.onclick = () => hideModal('historyDetailModal');
}

/**
 * Download prescription PDF
 * @param {string} filename - Prescription filename
 */
function downloadPrescription(filename) {
    showToast('Downloading prescription...', 'info');
    // In production, this will trigger actual file download from Firebase Storage
}

/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

onDOMReady(() => {
    const currentPage = getCurrentPage();
    
    switch (currentPage) {
        case 'dashboard.html':
            initPatientDashboard();
            break;
        case 'new-checkup.html':
            initNewCheckupPage();
            break;
        case 'history.html':
            initHistoryPage();
            break;
        case 'settings.html':
            initSettingsPage();
            break;
    }
});

/**
 * Initialize settings page
 */
function initSettingsPage() {
    if (!checkAuth()) {
        navigateTo('login.html');
        return;
    }
    
    // Load user settings
    loadUserSettings();
}

/**
 * Load user settings
 */
function loadUserSettings() {
    const user = AuthState.user;
    if (!user) return;

    // Populate form fields with user data
    const nameInput = $('#settingsName');
    const emailInput = $('#settingsEmail');
    const birthDateInput = $('#settingsBirthDate');
    const ageInput = $('#settingsAge');
    
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    
    // Calculate age from birth date
    if (birthDateInput) {
        birthDateInput.addEventListener('change', updateAgeFromBirthDate);
        updateAgeFromBirthDate();
    }
}

/**
 * Calculate and update age from birth date
 */
function updateAgeFromBirthDate() {
    const birthDateInput = $('#settingsBirthDate');
    const ageInput = $('#settingsAge');
    
    if (!birthDateInput || !ageInput) return;
    
    const birthDate = new Date(birthDateInput.value);
    if (isNaN(birthDate.getTime())) {
        ageInput.value = '--';
        return;
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    ageInput.value = `${age} years`;
}

/**
 * View doctor profile modal
 */
function viewDoctorProfile() {
    const doctorData = {
        name: 'Dr. Sarah Smith',
        specialty: 'Internal Medicine',
        experience: '15+ years',
        hospital: 'Medicare General Hospital',
        email: 'dr.smith@medicare.com',
        phone: '+1 (555) 987-6543',
        education: 'MD - Harvard Medical School',
        bio: 'Board-certified Internal Medicine physician specializing in chronic disease management, diabetes care, and preventive medicine.'
    };

    const modalContent = `
        <div class="modal-header">
            <h2 class="modal-title">Doctor Profile</h2>
            <button class="modal-close" onclick="hideModal('doctorProfileModal')" aria-label="Close">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="doctor-profile-header">
                <img src="../assets/images/doctor-avatar.svg" alt="${doctorData.name}" class="doctor-profile-avatar" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22%3E%3Ccircle cx=%2240%22 cy=%2240%22 r=%2240%22 fill=%22%237C3AED%22/%3E%3Ccircle cx=%2240%22 cy=%2230%22 r=%2214%22 fill=%22%23FCD9B6%22/%3E%3Cellipse cx=%2240%22 cy=%2262%22 rx=%2224%22 ry=%2216%22 fill=%22white%22/%3E%3C/svg%3E'">
                <div>
                    <h3 class="doctor-profile-name">${doctorData.name}</h3>
                    <p class="doctor-profile-specialty">${doctorData.specialty}</p>
                    <span class="badge badge-success">Available</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4 class="detail-section-title">About</h4>
                <p class="detail-text">${doctorData.bio}</p>
            </div>
            
            <div class="detail-section">
                <h4 class="detail-section-title">Information</h4>
                <div class="doctor-info-grid">
                    <div class="doctor-info-item">
                        <i data-lucide="graduation-cap" style="width: 16px; height: 16px;"></i>
                        <span>${doctorData.education}</span>
                    </div>
                    <div class="doctor-info-item">
                        <i data-lucide="briefcase" style="width: 16px; height: 16px;"></i>
                        <span>${doctorData.experience} experience</span>
                    </div>
                    <div class="doctor-info-item">
                        <i data-lucide="building-2" style="width: 16px; height: 16px;"></i>
                        <span>${doctorData.hospital}</span>
                    </div>
                    <div class="doctor-info-item">
                        <i data-lucide="mail" style="width: 16px; height: 16px;"></i>
                        <span>${doctorData.email}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    let backdrop = $('.modal-backdrop');
    let modal = $('#doctorProfileModal');

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);
    }

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'doctorProfileModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = modalContent;
    showModal('doctorProfileModal');

    if (window.lucide) lucide.createIcons();
    backdrop.onclick = () => hideModal('doctorProfileModal');
}
