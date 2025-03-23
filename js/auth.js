/**
 * AuthenticationHandler Class
 * Manages user authentication using JWT for the Enhanced Business To-Do List Application
 */
class AuthenticationHandler {
    constructor() {
        this.TOKEN_KEY = 'auth_token';
        this.USER_KEY = 'auth_user';
        this.USERS_REGISTRY_KEY = 'auth_users_registry';
        this.API_URL = 'https://your-api-endpoint.com'; // Replace with your actual API endpoint
        
        // Initialize authentication state
        this.initializeAuth();
        
        // Initialize users registry if not exists
        this.initializeUsersRegistry();
    }

    /**
     * Initialize the authentication state
     */
    initializeAuth() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const userJson = localStorage.getItem(this.USER_KEY);
        
        if (token && userJson) {
            try {
                this.user = JSON.parse(userJson);
                this.token = token;
                this.isAuthenticated = true;
                console.log('User authenticated:', this.user.email);
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        } else {
            this.isAuthenticated = false;
            this.user = null;
            this.token = null;
        }
    }
    
    /**
     * Initialize users registry for local authentication
     */
    initializeUsersRegistry() {
        if (!localStorage.getItem(this.USERS_REGISTRY_KEY)) {
            localStorage.setItem(this.USERS_REGISTRY_KEY, JSON.stringify([]));
        }
    }
    
    /**
     * Get users registry
     * @returns {Array} Users array
     */
    getUsersRegistry() {
        try {
            return JSON.parse(localStorage.getItem(this.USERS_REGISTRY_KEY)) || [];
        } catch (error) {
            console.error('Error getting users registry:', error);
            return [];
        }
    }
    
    /**
     * Save users registry
     * @param {Array} users Users array
     */
    saveUsersRegistry(users) {
        localStorage.setItem(this.USERS_REGISTRY_KEY, JSON.stringify(users));
    }

    /**
     * Check if the user is authenticated
     * @returns {boolean} Authentication status
     */
    isUserAuthenticated() {
        return this.isAuthenticated && !!this.token;
    }

    /**
     * Get the current user
     * @returns {Object|null} User object or null if not authenticated
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Login user with email and password
     * @param {string} email User email
     * @param {string} password User password
     * @returns {Promise<Object>} Login result
     */
    async login(email, password) {
        try {
            // In a real application, this would be an API call
            // For this local implementation, check against stored users
            const users = this.getUsersRegistry();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (!user) {
                return { success: false, message: 'User not found. Please register first.' };
            }
            
            if (user.password !== password) {
                return { success: false, message: 'Invalid password' };
            }
            
            // Create a JWT-like token (simulated)
            this.token = this.generateToken(email);
            this.user = {
                email: email,
                name: user.name || email.split('@')[0],
                id: user.id
            };
            
            // Store authentication data
            localStorage.setItem(this.TOKEN_KEY, this.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(this.user));
            
            this.isAuthenticated = true;
            return { success: true, user: this.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Register a new user
     * @param {string} email User email
     * @param {string} password User password
     * @param {string} name User name (optional)
     * @returns {Promise<Object>} Registration result
     */
    async register(email, password, name = '') {
        try {
            // Validate email format
            if (!this.validateEmail(email)) {
                return { success: false, message: 'Invalid email format' };
            }
            
            // For this local implementation, check if user already exists
            const users = this.getUsersRegistry();
            const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (existingUser) {
                return { success: false, message: 'User already exists' };
            }
            
            // Create new user
            const userId = this.generateId();
            const newUser = {
                id: userId,
                email: email,
                password: password, // In a real app, this would be hashed
                name: name
            };
            
            // Add to registry
            users.push(newUser);
            this.saveUsersRegistry(users);
            
            return { success: true, message: 'Registration successful. Please login.' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Validate email format
     * @param {string} email Email to validate
     * @returns {boolean} Is valid email
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Logout the current user
     */
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.isAuthenticated = false;
        this.user = null;
        this.token = null;
    }

    /**
     * Generate a simple token
     * @param {string} email User email
     * @returns {string} Generated token
     */
    generateToken(email) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { 
            email: email, 
            iat: Date.now(),
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };
        
        // In a real app, this would use proper cryptographic signing
        // This is just a simulation
        const base64Header = btoa(JSON.stringify(header));
        const base64Payload = btoa(JSON.stringify(payload));
        const signature = this.generateSimpleHash(base64Header + '.' + base64Payload);
        
        return `${base64Header}.${base64Payload}.${signature}`;
    }
    
    /**
     * Generate a simple hash (NOT cryptographically secure - for demo only)
     * @param {string} str String to hash
     * @returns {string} Simple hash
     */
    generateSimpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return btoa(hash.toString());
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
    }
}

// Create a global instance of AuthenticationHandler
const authHandler = new AuthenticationHandler();