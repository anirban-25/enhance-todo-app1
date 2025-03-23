/**
 * AuthUIHandler Class
 * Manages the authentication UI for the Enhanced Business To-Do List Application
 */
class AuthUIHandler {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the authentication UI
     */
    initialize() {
        if (this.initialized) return;
        
        this.initializeElements();
        this.bindEvents();
        this.checkAuthentication();
        
        // Set default theme to light
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        this.updateThemeIcon('light');
        
        this.initialized = true;
    }

    /**
     * Initialize UI elements
     */
    initializeElements() {
        // Auth modal elements
        this.authModal = document.getElementById('authModal');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        
        // Login form elements
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        this.loginBtn = document.getElementById('loginBtn');
        this.showRegisterBtn = document.getElementById('showRegisterBtn');
        
        // Register form elements
        this.registerName = document.getElementById('registerName');
        this.registerEmail = document.getElementById('registerEmail');
        this.registerPassword = document.getElementById('registerPassword');
        this.registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
        this.registerBtn = document.getElementById('registerBtn');
        this.showLoginBtn = document.getElementById('showLoginBtn');
        
        // Profile elements
        this.profileBtn = document.getElementById('profileBtn');
        this.profileDropdown = document.getElementById('profileDropdown');
        this.profileUserName = document.getElementById('profileUserName');
        this.profileUserEmail = document.getElementById('profileUserEmail');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.themeToggleProfile = document.getElementById('themeToggleProfile');
        
        // App container
        this.appContainer = document.querySelector('.container');
    }

    /**
     * Bind events to UI elements
     */
    bindEvents() {
        // Login form events
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        if (this.showRegisterBtn) {
            this.showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
        }
        
        // Register form events
        if (this.registerBtn) {
            this.registerBtn.addEventListener('click', () => this.handleRegister());
        }
        
        if (this.showLoginBtn) {
            this.showLoginBtn.addEventListener('click', () => this.showLoginForm());
        }
        
        // Profile events
        if (this.profileBtn) {
            this.profileBtn.addEventListener('click', () => this.toggleProfileDropdown());
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Theme toggle in profile dropdown
        if (this.themeToggleProfile) {
            this.themeToggleProfile.addEventListener('click', () => {
                this.toggleTheme();
                this.toggleProfileDropdown(); // Close dropdown after toggling theme
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.profileDropdown && !this.profileDropdown.classList.contains('hidden') && 
                !this.profileDropdown.contains(e.target) && e.target !== this.profileBtn) {
                this.profileDropdown.classList.add('hidden');
            }
        });
        
        // Handle Enter key press in login and register forms
        if (this.loginEmail && this.loginPassword) {
            this.loginEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.loginPassword.focus();
            });
            
            this.loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        
        // Add enter key handlers for registration form fields
        if (this.registerName && this.registerEmail && this.registerPassword && this.registerPasswordConfirm) {
            this.addEnterKeyHandler([
                this.registerName, 
                this.registerEmail, 
                this.registerPassword, 
                this.registerPasswordConfirm
            ]);
        }
        
        // Close modal when clicking the close button
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (!authHandler.isUserAuthenticated()) {
                    // Don't close if not authenticated
                    this.showMessage(this.loginForm, 'Please login to continue', 'error');
                    return;
                }
                if (this.authModal) {
                    this.authModal.classList.add('hidden');
                }
            });
        });
    }

    /**
     * Add enter key handler to form fields
     * @param {Array} fields Array of form field elements
     */
    addEnterKeyHandler(fields) {
        for (let i = 0; i < fields.length; i++) {
            fields[i].addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (i < fields.length - 1) {
                        fields[i + 1].focus();
                    } else {
                        this.handleRegister();
                    }
                }
            });
        }
    }

    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
        if (authHandler.isUserAuthenticated()) {
            this.updateProfileUI();
            this.showApp();
            
            // Create and dispatch userAuthenticated event
            const event = new CustomEvent('userAuthenticated', {
                detail: { user: authHandler.getCurrentUser() }
            });
            document.dispatchEvent(event);
        } else {
            this.showLoginModal();
        }
    }
    
    /**
     * Show login modal
     */
    showLoginModal() {
        if (this.authModal) {
            this.authModal.classList.remove('hidden');
        }
        this.showLoginForm();
        
        // Prevent closing the modal if not authenticated
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                if (!authHandler.isUserAuthenticated()) {
                    e.stopPropagation();
                    this.showMessage(this.loginForm, 'Please login to continue', 'error');
                }
            });
        });
    }

    /**
     * Show register form
     */
    showRegisterForm() {
        if (this.loginForm) {
            this.loginForm.classList.add('hidden');
        }
        if (this.registerForm) {
            this.registerForm.classList.remove('hidden');
            if (this.registerEmail) {
                this.registerEmail.focus();
            }
        }
    }

    /**
     * Show login form
     */
    showLoginForm() {
        if (this.registerForm) {
            this.registerForm.classList.add('hidden');
        }
        if (this.loginForm) {
            this.loginForm.classList.remove('hidden');
            if (this.loginEmail) {
                this.loginEmail.focus();
            }
        }
    }

    /**
     * Handle login
     */
    async handleLogin() {
        if (!this.loginEmail || !this.loginPassword) return;
        
        const email = this.loginEmail.value.trim();
        const password = this.loginPassword.value;
        
        if (!email || !password) {
            this.showMessage(this.loginForm, 'Please enter email and password', 'error');
            return;
        }
        
        // Show loading state
        this.loginBtn.disabled = true;
        this.loginBtn.innerHTML = '<span class="auth-loading"></span> Logging in...';
        
        const result = await authHandler.login(email, password);
        
        // Reset button state
        this.loginBtn.disabled = false;
        this.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        
        if (result.success) {
            this.showMessage(this.loginForm, 'Login successful!', 'success');
            this.updateProfileUI();
            
            // Create and dispatch userAuthenticated event
            const event = new CustomEvent('userAuthenticated', {
                detail: { user: authHandler.getCurrentUser() }
            });
            document.dispatchEvent(event);
            
            // Hide auth modal after short delay
            setTimeout(() => {
                if (this.authModal) {
                    this.authModal.classList.add('hidden');
                }
                this.showApp();
            }, 1000);
        } else {
            this.showMessage(this.loginForm, result.message || 'Login failed', 'error');
        }
    }

    /**
     * Handle registration
     */
    async handleRegister() {
        if (!this.registerEmail || !this.registerPassword || !this.registerPasswordConfirm) return;
        
        const name = this.registerName ? this.registerName.value.trim() : '';
        const email = this.registerEmail.value.trim();
        const password = this.registerPassword.value;
        const passwordConfirm = this.registerPasswordConfirm.value;
        
        if (!email || !password) {
            this.showMessage(this.registerForm, 'Please enter email and password', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            this.showMessage(this.registerForm, 'Passwords do not match', 'error');
            return;
        }
        
        // Show loading state
        this.registerBtn.disabled = true;
        this.registerBtn.innerHTML = '<span class="auth-loading"></span> Registering...';
        
        const result = await authHandler.register(email, password, name);
        
        // Reset button state
        this.registerBtn.disabled = false;
        this.registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        
        if (result.success) {
            this.showMessage(this.registerForm, result.message || 'Registration successful!', 'success');
            
            // Switch to login form after successful registration
            setTimeout(() => {
                this.showLoginForm();
                if (this.loginEmail) {
                    this.loginEmail.value = email;
                }
            }, 1500);
        } else {
            this.showMessage(this.registerForm, result.message || 'Registration failed', 'error');
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            authHandler.logout();
            this.toggleProfileDropdown();
            this.showLoginModal();
            
            // Create and dispatch userLoggedOut event
            const event = new CustomEvent('userLoggedOut');
            document.dispatchEvent(event);
        }
    }

    /**
     * Toggle profile dropdown
     */
    toggleProfileDropdown() {
        if (this.profileDropdown) {
            this.profileDropdown.classList.toggle('hidden');
        }
    }

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    /**
     * Update theme icon based on current theme
     * @param {string} theme Current theme ('light' or 'dark')
     */
    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggleProfile i');
        if (icon) {
            if (theme === 'dark') {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            } else {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    /**
     * Update profile UI with user information
     */
    updateProfileUI() {
        const user = authHandler.getCurrentUser();
        if (user && this.profileUserName && this.profileUserEmail) {
            this.profileUserName.textContent = user.name || user.email.split('@')[0];
            this.profileUserEmail.textContent = user.email;
        }
        
        // Update theme icon based on current theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.updateThemeIcon(currentTheme);
    }

    /**
     * Show message in specified container
     * @param {HTMLElement} container Container element
     * @param {string} message Message text
     * @param {string} type Message type ('error' or 'success')
     */
    showMessage(container, message, type = 'error') {
        if (!container) return;
        
        // Remove any existing messages
        const existingMessage = container.querySelector('.auth-error, .auth-success');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = type === 'error' ? 'auth-error' : 'auth-success';
        messageEl.textContent = message;
        
        // Insert at the top of the container
        container.insertBefore(messageEl, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);
    }

    /**
     * Show the application UI
     */
    showApp() {
        // Remove any existing auth overlay
        const existingOverlay = document.querySelector('.auth-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        if (this.appContainer) {
            this.appContainer.style.display = 'block';
        }
    }
}

// Initialize auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const authUI = new AuthUIHandler();
    authUI.initialize();
    window.authUI = authUI;
});