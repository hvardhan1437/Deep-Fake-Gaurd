// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAxV4djMmirIOyKVK4-50ggP8cNVNio6Us",
  authDomain: "deepfake-guard-7105b.firebaseapp.com",
  projectId: "deepfake-guard-7105b",
  storageBucket: "deepfake-guard-7105b.firebasestorage.app",
  messagingSenderId: "325726547519",
  appId: "1:325726547519:web:6534871c05f1672574d28a",
  measurementId: "G-GR83YZ92FD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
