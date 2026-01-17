/* ==========================================================================
   Medicare - Doctor Module
   Handles doctor dashboard, patient management, and reviews
   ========================================================================== */

/* ==========================================================================
   DOCTOR DASHBOARD
   ========================================================================== */

/**
 * Initialize doctor dashboard
 */
function initDoctorDashboard() {
    // Check authentication and role
    if (!checkAuth() || AuthState.role !== 'doctor') {
        navigateTo('login.html');
        return;
    }

    updateDoctorDisplay();
    loadDashboardStats();
    loadPendingReviews();
}

/**
 * Update doctor display in sidebar
 */
function updateDoctorDisplay() {
    const user = AuthState.user;
    if (!user) return;

    const userName = $('.sidebar-user-name');
    if (userName) {
        userName.textContent = user.name || 'Doctor';
    }

    const welcomeTitle = $('.welcome-card-title');
    if (welcomeTitle) {
        const firstName = user.name ? user.name.split(' ')[1] || user.name : 'Doctor';
        welcomeTitle.textContent = `Welcome, Dr. ${firstName}!`;
    }
}

/**
 * Load dashboard statistics
 */
function loadDashboardStats() {
    // Mock data - will be replaced with Firebase queries
    const stats = {
        totalPatients: 12,
        pendingReviews: 5,
        completedToday: 7,
        thisMonth: 28
    };

    console.log('Doctor dashboard stats:', stats);
}

/**
 * Load patients needing review
 */
function loadPendingReviews() {
    // Mock data - will be replaced with Firebase queries
    const pendingPatients = [
        { id: 'p001', name: 'John Doe', type: 'Blood Glucose', time: '2 hours ago' },
        { id: 'p002', name: 'Jane Wilson', type: 'Blood Pressure', time: '4 hours ago' },
        { id: 'p003', name: 'Robert Chen', type: 'Heart Rate', time: '5 hours ago' }
    ];

    console.log('Pending reviews loaded:', pendingPatients);
}

/* ==========================================================================
   PATIENT REVIEW PAGE
   ========================================================================== */

/**
 * Initialize patient review page
 */
function initPatientReviewPage() {
    if (!checkAuth() || AuthState.role !== 'doctor') {
        navigateTo('login.html');
        return;
    }

    // Get patient ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');

    if (patientId) {
        loadPatientData(patientId);
    }

    setupReviewForm();
}

/**
 * Load patient data for review
 * @param {string} patientId - Patient ID
 */
function loadPatientData(patientId) {
    // Mock data - will be replaced with Firebase queries
    const patientData = {
        id: patientId,
        name: 'John Doe',
        age: 45,
        conditions: ['Hypertension', 'Type 2 Diabetes'],
        latestSubmission: {
            date: '2026-01-11',
            type: 'Blood Glucose Check',
            heartRate: 72,
            bloodPressure: '120/80',
            glucose: 110,
            temperature: 36.6
        },
        aiReport: `Based on the submitted health measurements, here is the AI-generated analysis:

**Blood Glucose Analysis:**
- Fasting blood glucose level: 110 mg/dL
- This reading is slightly above the optimal fasting range (70-100 mg/dL)
- Classified as "pre-diabetic range" according to ADA guidelines

**Cardiovascular Indicators:**
- Heart rate: 72 bpm (Normal range)
- Blood pressure: 120/80 mmHg (Optimal)

**Recommendations:**
- Monitor glucose levels more frequently
- Consider dietary modifications to reduce carbohydrate intake
- Schedule follow-up in 2 weeks to reassess glucose levels`
    };

    console.log('Patient data loaded:', patientData);
    return patientData;
}

/**
 * Set up review form handlers
 */
function setupReviewForm() {
    const form = $('#doctorReviewForm');
    if (!form) return;

    form.addEventListener('submit', handleReviewSubmit);

    // File upload handling
    const uploadArea = $('.file-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.doc,.docx';
            input.onchange = handleFileUpload;
            input.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload({ target: { files } });
            }
        });
    }
}

/**
 * Handle file upload for prescription
 * @param {Event} e - File input change event
 */
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        showToast('Please upload a PDF or Word document', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
    }

    // Update UI to show uploaded file
    const uploadArea = $('.file-upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="file-uploaded">
                <i data-lucide="file-text" style="width: 32px; height: 32px; color: var(--success-500);"></i>
                <p class="file-name">${file.name}</p>
                <button type="button" class="btn btn-ghost btn-sm" onclick="removeUploadedFile(event)">
                    <i data-lucide="x"></i> Remove
                </button>
            </div>
        `;
        uploadArea.dataset.file = file.name;
        if (window.lucide) lucide.createIcons();
    }

    showToast('File uploaded successfully', 'success');
}

/**
 * Remove uploaded file
 */
function removeUploadedFile(e) {
    e.stopPropagation();
    const uploadArea = $('.file-upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i data-lucide="upload-cloud" class="file-upload-icon"></i>
            <p class="file-upload-text">
                <strong>Click to upload</strong> or drag and drop<br>
                PDF or Word document (max 5MB)
            </p>
        `;
        delete uploadArea.dataset.file;
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Handle review form submission
 * @param {Event} e - Form submit event
 */
async function handleReviewSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const doctorNotes = $('#doctorNotes', form).value.trim();
    const prescriptionNotes = $('#prescriptionNotes', form)?.value.trim() || '';
    const submitBtn = form.querySelector('.btn-primary');

    // Validate
    if (!doctorNotes) {
        showToast('Please add your medical review notes', 'warning');
        $('#doctorNotes').focus();
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Success
        showToast('Review submitted successfully! Patient has been notified.', 'success', 5000);

        // Redirect back to dashboard after delay
        setTimeout(() => {
            navigateTo('doctor-dashboard.html');
        }, 2000);

    } catch (error) {
        console.error('Review submission error:', error);
        showToast('Failed to submit review. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/* ==========================================================================
   PATIENTS LIST PAGE
   ========================================================================== */

/**
 * Initialize patients list page
 */
function initPatientsListPage() {
    if (!checkAuth() || AuthState.role !== 'doctor') {
        navigateTo('login.html');
        return;
    }

    loadAllPatients();
    setupPatientSearch();
    setupPatientFilters();
}

/**
 * Load all patients
 */
function loadAllPatients() {
    // Mock data - will be replaced with Firebase queries
    const patients = [
        { id: 'p001', name: 'John Doe', age: 45, lastCheckup: '2 hours ago', status: 'pending' },
        { id: 'p002', name: 'Jane Wilson', age: 38, lastCheckup: '4 hours ago', status: 'pending' },
        { id: 'p003', name: 'Robert Chen', age: 52, lastCheckup: '5 hours ago', status: 'pending' },
        { id: 'p004', name: 'Emily Brown', age: 61, lastCheckup: '1 day ago', status: 'reviewed' },
        { id: 'p005', name: 'Michael Lee', age: 44, lastCheckup: '2 days ago', status: 'reviewed' }
    ];

    console.log('All patients loaded:', patients);
}

/**
 * Set up patient search functionality
 */
function setupPatientSearch() {
    const searchInput = $('.patients-search input');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase().trim();
        filterPatients(query);
    }, 300));
}

/**
 * Filter patients by search query
 * @param {string} query - Search query
 */
function filterPatients(query) {
    const patientCards = $$('.patient-grid-card, .patient-card');
    
    patientCards.forEach(card => {
        const name = card.querySelector('.patient-card-name, .patient-grid-info h4')?.textContent.toLowerCase() || '';
        const isVisible = name.includes(query);
        card.style.display = isVisible ? '' : 'none';
    });
}

/**
 * Set up patient filter chips
 */
function setupPatientFilters() {
    const filterChips = $$('.filter-chip');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active from all
            filterChips.forEach(c => c.classList.remove('active'));
            // Add active to clicked
            chip.classList.add('active');
            
            const filter = chip.dataset.filter;
            applyPatientFilter(filter);
        });
    });
}

/**
 * Apply patient filter
 * @param {string} filter - Filter type (all, pending, reviewed)
 */
function applyPatientFilter(filter) {
    const patientCards = $$('.patient-grid-card, .patient-card');
    
    patientCards.forEach(card => {
        if (filter === 'all') {
            card.style.display = '';
            return;
        }
        
        const status = card.dataset.status || 'reviewed';
        card.style.display = status === filter ? '' : 'none';
    });
}

/* ==========================================================================
   DOCTOR SETTINGS PAGE
   ========================================================================== */

/**
 * Initialize doctor settings page
 */
function initDoctorSettingsPage() {
    if (!checkAuth() || AuthState.role !== 'doctor') {
        navigateTo('login.html');
        return;
    }

    loadDoctorSettings();
}

/**
 * Load doctor settings
 */
function loadDoctorSettings() {
    const user = AuthState.user;
    if (!user) return;

    const nameInput = $('#settingsName');
    const emailInput = $('#settingsEmail');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
}

/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

onDOMReady(() => {
    const currentPage = getCurrentPage();

    switch (currentPage) {
        case 'doctor-dashboard.html':
            initDoctorDashboard();
            break;
        case 'doctor-review.html':
            initPatientReviewPage();
            break;
        case 'doctor-patients.html':
            initPatientsListPage();
            break;
        case 'doctor-settings.html':
            initDoctorSettingsPage();
            break;
    }
});
