// Form validation and enhancements
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Add real-time validation
    if (emailInput) emailInput.addEventListener('blur', validateEmail);
    if (passwordInput) passwordInput.addEventListener('blur', validatePassword);

    function validateEmail() {
        if (!emailInput) return true;
        const email = emailInput.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            showError(emailInput, 'Please enter a valid email address');
            return false;
        } else {
            clearError(emailInput);
            return true;
        }
    }

    function validatePassword() {
        if (!passwordInput) return true;
        const password = passwordInput.value;
        
        if (password.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            return false;
        } else {
            clearError(passwordInput);
            return true;
        }
    }

    function showError(input, message) {
        clearError(input);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#e53e3e';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
        input.style.borderColor = '#e53e3e';
    }

    function clearError(input) {
        const errorDiv = input.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        input.style.borderColor = '#e2e8f0';
    }

    // Form submission validation
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const isEmailValid = validateEmail();
            const isPasswordValid = validatePassword();

            if (!isEmailValid || !isPasswordValid) {
                e.preventDefault();
            }
        });
    }

    // Google button click handler
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            alert('Google Sign In functionality would be implemented here');
            // Implement Google OAuth here
        });
    }
});
