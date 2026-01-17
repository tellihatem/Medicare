/* ==========================================================================
   Medicare - Authentication Module
   Handles login, signup, password reset, and OTP verification
   ========================================================================== */

/**
 * Authentication state management
 * Stores current user session info locally (will connect to Firebase later)
 */
const AuthState = {
    user: null,
    isAuthenticated: false,
    role: null // 'patient' or 'doctor'
};

/* ==========================================================================
   LOGIN FUNCTIONALITY
   ========================================================================== */

/**
 * Initialize login page
 * Sets up form validation and submission handlers
 */
function initLoginPage() {
    const loginForm = $('#loginForm');
    if (!loginForm) return;

    // Form submission handler
    loginForm.addEventListener('submit', handleLogin);

    // Password visibility toggle
    const passwordToggle = $('.password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }

    // Real-time email validation
    const emailInput = $('#email');
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmailField);
    }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = $('#email', form).value.trim();
    const password = $('#password', form).value;
    const rememberMe = $('#rememberMe', form)?.checked || false;
    const submitBtn = $('.btn-primary', form);

    // Clear previous errors
    clearFormErrors(form);

    // Validate inputs
    let hasError = false;

    if (!email) {
        showFieldError('#email', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showFieldError('#email', 'Please enter a valid email address');
        hasError = true;
    }

    if (!password) {
        showFieldError('#password', 'Password is required');
        hasError = true;
    }

    if (hasError) return;

    // Show loading state
    setButtonLoading(submitBtn, true);

    try {
        // Simulate API call (will be replaced with Firebase auth)
        await simulateAuthDelay();

        // Mock authentication - check for demo accounts
        const authResult = mockAuthenticate(email, password);
        
        if (authResult.success) {
            // Store auth state
            AuthState.user = authResult.user;
            AuthState.isAuthenticated = true;
            AuthState.role = authResult.user.role;

            // Always save to storage for session persistence
            // "Remember Me" can later control session vs persistent storage
            storage.set('medicare_user', authResult.user);

            showToast('Login successful! Redirecting...', 'success');

            // Redirect based on role
            setTimeout(() => {
                if (authResult.user.role === 'doctor') {
                    navigateTo('doctor-dashboard.html');
                } else {
                    navigateTo('dashboard.html');
                }
            }, 1000);
        } else {
            showToast(authResult.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/* ==========================================================================
   SIGNUP FUNCTIONALITY
   ========================================================================== */

/**
 * Initialize signup page
 */
function initSignupPage() {
    const signupForm = $('#signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', handleSignup);

    // Password strength indicator
    const passwordInput = $('#password');
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
    }

    // Password visibility toggles
    $$('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', togglePasswordVisibility);
    });

    // Confirm password validation
    const confirmPassword = $('#confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('blur', validateConfirmPassword);
    }
}

/**
 * Handle signup form submission
 * @param {Event} e - Form submit event
 */
async function handleSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const fullName = $('#fullName', form).value.trim();
    const email = $('#email', form).value.trim();
    const password = $('#password', form).value;
    const confirmPassword = $('#confirmPassword', form).value;
    const agreeTerms = $('#agreeTerms', form)?.checked || false;
    const submitBtn = $('.btn-primary', form);

    // Clear previous errors
    clearFormErrors(form);

    // Validate inputs
    let hasError = false;

    if (!fullName || fullName.length < 2) {
        showFieldError('#fullName', 'Please enter your full name');
        hasError = true;
    }

    if (!email) {
        showFieldError('#email', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showFieldError('#email', 'Please enter a valid email address');
        hasError = true;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        showFieldError('#password', passwordValidation.message);
        hasError = true;
    }

    if (password !== confirmPassword) {
        showFieldError('#confirmPassword', 'Passwords do not match');
        hasError = true;
    }

    if (!agreeTerms) {
        showToast('Please agree to the Terms and Privacy Policy', 'warning');
        hasError = true;
    }

    if (hasError) return;

    // Show loading state
    setButtonLoading(submitBtn, true);

    try {
        await simulateAuthDelay();

        // Mock signup (will be replaced with Firebase)
        const signupResult = mockSignup(fullName, email, password);

        if (signupResult.success) {
            // Store pending verification email
            storage.set('pending_verification_email', email);
            
            showToast('Account created! Please verify your email.', 'success');
            
            // Redirect to OTP verification page
            setTimeout(() => {
                navigateTo('verify-email.html');
            }, 1000);
        } else {
            showToast(signupResult.message, 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Update password strength indicator
 * @param {Event} e - Input event
 */
function updatePasswordStrength(e) {
    const password = e.target.value;
    const strengthBar = $('.password-strength-bar');
    const strengthText = $('.password-strength-text');
    
    if (!strengthBar || !strengthText) return;

    let strength = 0;
    let text = 'Weak';
    let color = 'var(--error-500)';

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength >= 4) {
        text = 'Strong';
        color = 'var(--success-500)';
    } else if (strength >= 3) {
        text = 'Medium';
        color = 'var(--warning-500)';
    }

    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}

/* ==========================================================================
   OTP VERIFICATION
   ========================================================================== */

/**
 * Initialize OTP verification page
 */
function initOTPPage() {
    const otpInputs = $$('.otp-input');
    if (otpInputs.length === 0) return;

    // Auto-focus and navigation between OTP inputs
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => handleOTPInput(e, index, otpInputs));
        input.addEventListener('keydown', (e) => handleOTPKeydown(e, index, otpInputs));
        input.addEventListener('paste', handleOTPPaste);
    });

    // Verify button
    const verifyBtn = $('#verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', handleOTPVerification);
    }

    // Resend OTP
    const resendLink = $('.otp-resend-link');
    if (resendLink) {
        startResendTimer(resendLink, 60);
    }

    // Focus first input
    otpInputs[0]?.focus();
}

/**
 * Handle OTP input
 */
function handleOTPInput(e, index, inputs) {
    const value = e.target.value;
    
    // Only allow single digit
    if (value.length > 1) {
        e.target.value = value[0];
    }

    // Add filled class for styling
    e.target.classList.toggle('filled', value.length > 0);

    // Move to next input
    if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
    }

    // Check if all inputs are filled
    checkOTPComplete(inputs);
}

/**
 * Handle OTP keydown for backspace navigation
 */
function handleOTPKeydown(e, index, inputs) {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
    }
}

/**
 * Handle OTP paste
 */
function handleOTPPaste(e) {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const inputs = $$('.otp-input');
    
    paste.split('').forEach((char, i) => {
        if (inputs[i]) {
            inputs[i].value = char;
            inputs[i].classList.add('filled');
        }
    });

    // Focus last filled or next empty
    const focusIndex = Math.min(paste.length, inputs.length - 1);
    inputs[focusIndex]?.focus();
    
    checkOTPComplete(inputs);
}

/**
 * Check if OTP is complete and enable verify button
 */
function checkOTPComplete(inputs) {
    const otp = Array.from(inputs).map(i => i.value).join('');
    const verifyBtn = $('#verifyBtn');
    
    if (verifyBtn) {
        verifyBtn.disabled = otp.length !== 6;
    }
}

/**
 * Handle OTP verification
 */
async function handleOTPVerification() {
    const inputs = $$('.otp-input');
    const otp = Array.from(inputs).map(i => i.value).join('');
    const verifyBtn = $('#verifyBtn');

    if (otp.length !== 6) {
        showToast('Please enter the complete 6-digit code', 'warning');
        return;
    }

    setButtonLoading(verifyBtn, true);

    try {
        await simulateAuthDelay();

        // Mock OTP verification (will be replaced with Firebase)
        if (otp === '123456') { // Demo OTP
            showToast('Email verified successfully!', 'success');
            storage.remove('pending_verification_email');
            
            setTimeout(() => {
                navigateTo('login.html');
            }, 1000);
        } else {
            showToast('Invalid verification code', 'error');
            // Clear inputs
            inputs.forEach(i => {
                i.value = '';
                i.classList.remove('filled');
            });
            inputs[0]?.focus();
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        setButtonLoading(verifyBtn, false);
    }
}

/**
 * Start resend OTP timer
 */
function startResendTimer(resendLink, seconds) {
    const timerSpan = $('.otp-timer');
    resendLink.classList.add('disabled');
    
    let remaining = seconds;
    
    const interval = setInterval(() => {
        remaining--;
        if (timerSpan) {
            timerSpan.textContent = `(${remaining}s)`;
        }
        
        if (remaining <= 0) {
            clearInterval(interval);
            resendLink.classList.remove('disabled');
            if (timerSpan) {
                timerSpan.textContent = '';
            }
            
            // Add click handler for resend
            resendLink.addEventListener('click', () => {
                showToast('New verification code sent!', 'success');
                startResendTimer(resendLink, 60);
            }, { once: true });
        }
    }, 1000);
}

/* ==========================================================================
   FORGOT PASSWORD
   ========================================================================== */

/**
 * Initialize forgot password page
 */
function initForgotPasswordPage() {
    const forgotForm = $('#forgotPasswordForm');
    if (!forgotForm) return;

    forgotForm.addEventListener('submit', handleForgotPassword);
}

/**
 * Handle forgot password form
 */
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = $('#email', form).value.trim();
    const submitBtn = $('.btn-primary', form);

    clearFormErrors(form);

    if (!email) {
        showFieldError('#email', 'Email is required');
        return;
    }

    if (!isValidEmail(email)) {
        showFieldError('#email', 'Please enter a valid email address');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        await simulateAuthDelay();

        // Always show success (security best practice - don't reveal if email exists)
        showToast('Password reset link sent to your email', 'success');
        
        // Show success state
        const formContainer = $('.auth-card-body');
        if (formContainer) {
            formContainer.innerHTML = `
                <div class="forgot-illustration forgot-success-icon">
                    <i data-lucide="mail-check"></i>
                </div>
                <h3 class="text-center mb-4">Check your email</h3>
                <p class="text-center text-muted mb-6">
                    We've sent a password reset link to <strong>${email}</strong>
                </p>
                <a href="login.html" class="btn btn-primary btn-full">Back to Login</a>
            `;
            if (window.lucide) lucide.createIcons();
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const input = button.parentElement.querySelector('input');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Validate email field on blur
 */
function validateEmailField(e) {
    const email = e.target.value.trim();
    if (email && !isValidEmail(email)) {
        showFieldError('#email', 'Please enter a valid email address');
    } else {
        clearFieldError('#email');
    }
}

/**
 * Validate confirm password matches
 */
function validateConfirmPassword() {
    const password = $('#password').value;
    const confirmPassword = $('#confirmPassword').value;
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError('#confirmPassword', 'Passwords do not match');
    } else {
        clearFieldError('#confirmPassword');
    }
}

/**
 * Show error for a form field
 */
function showFieldError(selector, message) {
    const input = $(selector);
    if (!input) return;

    input.classList.add('error');
    
    // Remove existing error
    const existingError = input.parentElement.querySelector('.form-error');
    if (existingError) existingError.remove();

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = `<i data-lucide="alert-circle"></i><span>${message}</span>`;
    input.parentElement.appendChild(errorDiv);
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Clear error for a form field
 */
function clearFieldError(selector) {
    const input = $(selector);
    if (!input) return;

    input.classList.remove('error');
    const error = input.parentElement.querySelector('.form-error');
    if (error) error.remove();
}

/**
 * Clear all form errors
 */
function clearFormErrors(form) {
    $$('.form-error', form).forEach(e => e.remove());
    $$('.form-input.error', form).forEach(i => i.classList.remove('error'));
}

/**
 * Simulate network delay for demo purposes
 */
function simulateAuthDelay() {
    return new Promise(resolve => setTimeout(resolve, 1500));
}

/**
 * Mock authentication (will be replaced with Firebase)
 */
function mockAuthenticate(email, password) {
    // Demo accounts
    const accounts = {
        'patient@medicare.com': { password: 'Patient123', role: 'patient', name: 'John Doe' },
        'doctor@medicare.com': { password: 'Doctor123', role: 'doctor', name: 'Dr. Sarah Smith' }
    };

    const account = accounts[email.toLowerCase()];
    
    if (!account) {
        return { success: false, message: 'Account not found' };
    }
    
    if (account.password !== password) {
        return { success: false, message: 'Incorrect password' };
    }

    return {
        success: true,
        user: {
            email,
            name: account.name,
            role: account.role,
            id: 'user_' + Date.now()
        }
    };
}

/**
 * Mock signup (will be replaced with Firebase)
 */
function mockSignup(name, email, password) {
    // Check if email already exists (demo)
    if (email.toLowerCase() === 'patient@medicare.com' || 
        email.toLowerCase() === 'doctor@medicare.com') {
        return { success: false, message: 'Email already registered' };
    }

    return { success: true };
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const savedUser = storage.get('medicare_user');
    if (savedUser) {
        AuthState.user = savedUser;
        AuthState.isAuthenticated = true;
        AuthState.role = savedUser.role;
        return true;
    }
    return false;
}

/**
 * Logout user
 */
function logout() {
    AuthState.user = null;
    AuthState.isAuthenticated = false;
    AuthState.role = null;
    storage.remove('medicare_user');
    navigateTo('login.html');
}

/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

onDOMReady(() => {
    const currentPage = getCurrentPage();
    
    switch (currentPage) {
        case 'index.html':
        case 'login.html':
            initLoginPage();
            break;
        case 'signup.html':
            initSignupPage();
            break;
        case 'verify-email.html':
            initOTPPage();
            break;
        case 'forgot-password.html':
            initForgotPasswordPage();
            break;
    }
});
