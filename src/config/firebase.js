// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔐 Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_6C6bG3I3MmRdPtkmOk0JeOgIkFbHXyk",
  authDomain: "sikopifasta-database.firebaseapp.com",
  projectId: "sikopifasta-database",
  storageBucket: "sikopifasta-database.firebasestorage.app",
  messagingSenderId: "637428904100",
  appId: "1:637428904100:web:ac5c0640d30df430567631",
  measurementId: "G-TLZKB7FVDW",
};

// 🔥 Init Firebase
const app = initializeApp(firebaseConfig);

// 🔑 Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
