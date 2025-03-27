// IMPORTANT: Replace this config with the one from your Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

class AuthManager {
    constructor() {
        this.setupAuthUI();
        this.setupAuthStateListener();
        this.redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index';
        
        // Check if user is already logged in
        auth.onAuthStateChanged(user => {
            if (user && window.location.pathname.includes('login.html')) {
                this.handleRedirect();
            }
        });
    }

    setupAuthUI() {
        // Tab switching is now handled in login.html

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                try {
                    this.showMessage('Logging in...', 'info');
                    await this.loginWithEmail(email, password);
                } catch (error) {
                    this.showMessage(error.message, 'error');
                }
            });
        }

        // Sign up form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (password !== confirmPassword) {
                    this.showMessage('Passwords do not match', 'error');
                    return;
                }

                if (password.length < 6) {
                    this.showMessage('Password should be at least 6 characters', 'error');
                    return;
                }

                try {
                    this.showMessage('Creating your account...', 'info');
                    await this.signUpWithEmail(email, password, name);
                } catch (error) {
                    this.showMessage(error.message, 'error');
                }
            });
        }

        // Google auth
        const googleButton = document.querySelector('.google-auth-button');
        if (googleButton) {
            googleButton.addEventListener('click', async () => {
                try {
                    this.showMessage('Connecting to Google...', 'info');
                    await this.signInWithGoogle();
                } catch (error) {
                    this.showMessage(error.message, 'error');
                }
            });
        }

        // Forgot password
        const forgotPassword = document.querySelector('.forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                if (!email) {
                    this.showMessage('Please enter your email address', 'error');
                    return;
                }
                try {
                    this.showMessage('Sending reset email...', 'info');
                    await this.resetPassword(email);
                } catch (error) {
                    this.showMessage(error.message, 'error');
                }
            });
        }
    }

    setupAuthStateListener() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                this.getUserData(user.uid).then(userData => {
                    if (userData) {
                        // Store user data in localStorage
                        localStorage.setItem('userData', JSON.stringify(userData));
                        // Redirect based on the redirect parameter
                        this.handleRedirect();
                    }
                });
            }
        });
    }

    handleRedirect() {
        switch (this.redirectUrl) {
            case 'tracker':
                window.location.href = 'tracker.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    async loginWithEmail(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            this.showMessage('Login successful!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async signUpWithEmail(email, password, name) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await this.createUserProfile(userCredential.user.uid, {
                name,
                email,
                createdAt: new Date().toISOString()
            });
            this.showMessage('Account created successfully!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if user profile exists
            const userProfile = await this.getUserData(user.uid);
            if (!userProfile) {
                // Create new profile for Google users
                await this.createUserProfile(user.uid, {
                    name: user.displayName,
                    email: user.email,
                    createdAt: new Date().toISOString()
                });
            }
            
            this.showMessage('Login successful!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            this.showMessage('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            throw error;
        }
    }

    async createUserProfile(userId, userData) {
        try {
            await db.collection('users').doc(userId).set({
                ...userData,
                cycles: [],
                settings: {
                    notifications: true,
                    theme: 'light',
                    language: 'en'
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async getUserData(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    showMessage(message, type) {
        const messageDiv = document.getElementById('auth-message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `auth-message ${type}`;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize authentication
const authManager = new AuthManager();
