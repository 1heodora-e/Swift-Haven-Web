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

// Import Firebase functions
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore, doc, set, get, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Get Firebase instances
const auth = getAuth();
const db = getFirestore();

// Import Firebase config
importScripts('/js/firebase-config.js');

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');

// Tab Switching
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    // Update active tab
    authTabs.forEach(t => {
      if (t === tab) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
    
    // Update active form
    authForms.forEach(form => {
      if (form.id === `${targetTab}-form`) {
        form.classList.add('active');
      } else {
        form.classList.remove('active');
      }
    });
    
    // Clear any existing error messages
    loginError.textContent = '';
    loginError.classList.remove('active');
    signupError.textContent = '';
    signupError.classList.remove('active');
  });
});

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user data in Firestore
    await set(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp()
    }, { merge: true });
    
    // Redirect to tracker page
    window.location.href = '/pages/tracker.html';
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.add('active');
  }
});

// Signup Form Handler
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  
  if (password !== confirmPassword) {
    signupError.textContent = 'Passwords do not match';
    signupError.classList.add('active');
    return;
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user data in Firestore
    await set(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    
    // Redirect to tracker page
    window.location.href = '/pages/tracker.html';
  } catch (error) {
    signupError.textContent = error.message;
    signupError.classList.add('active');
  }
});

// Check authentication state
onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in, redirect to tracker page
    window.location.href = '/pages/tracker.html';
  }
});

class AuthManager {
    constructor() {
        this.setupAuthUI();
        this.setupAuthStateListener();
        this.redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index';
        
        // Check if user is already logged in
        onAuthStateChanged(auth, user => {
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
        onAuthStateChanged(auth, user => {
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
            await signInWithEmailAndPassword(auth, email, password);
            this.showMessage('Login successful!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async signUpWithEmail(email, password, name) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
        const provider = new GoogleAuthProvider();
        try {
            console.log('Current domain:', window.location.hostname);
            const result = await signInWithPopup(auth, provider);
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
            console.error('Full auth error:', error);
            throw error;
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            this.showMessage('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            throw error;
        }
    }

    async createUserProfile(userId, userData) {
        try {
            await set(doc(db, 'users', userId), {
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
            const docRef = doc(db, 'users', userId);
            const docSnap = await get(docRef);
            return docSnap.exists ? docSnap.data() : null;
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
