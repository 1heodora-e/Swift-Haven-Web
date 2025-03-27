// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhsSOv3XloPcETwV1YeV96KU4PQUP5ofE",
  authDomain: "cyclewise-2ffbf.firebaseapp.com",
  projectId: "cyclewise-2ffbf",
  storageBucket: "cyclewise-2ffbf.firebasestorage.app",
  messagingSenderId: "662076910806",
  appId: "1:662076910806:web:0715f6016bf8d13ebced77",
  measurementId: "G-CKS9EW8Y1J"
};

// Initialize Firebase
try {
  const app = initializeApp(firebaseConfig);
  console.log('CycleWise Firebase initialized successfully');
  
  // Initialize Firebase services with cross-origin isolation settings
  const auth = getAuth(app);
  auth.settings.appVerificationDisabledForTesting = true; // Only for development
  
  const db = getFirestore(app);
  const analytics = getAnalytics(app);

  // Export for use in other files
  window.auth = auth;
  window.db = db;
  window.analytics = analytics;
} catch (error) {
  console.error('Error initializing CycleWise Firebase:', error);
} 