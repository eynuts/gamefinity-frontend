// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database
import { getFunctions } from "firebase/functions"; // <-- Functions

const firebaseConfig = {
    apiKey: "AIzaSyBPL0Lx3BDf2njgUY6WA1kgl9QhZHVVxVA",
    authDomain: "gamefinity-21d3e.firebaseapp.com",
    databaseURL: "https://gamefinity-21d3e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gamefinity-21d3e",
    storageBucket: "gamefinity-21d3e.appspot.com",
    messagingSenderId: "216637690198",
    appId: "1:216637690198:web:a788c521d4e7f03a2486f7",
    measurementId: "G-KM4HXBMKWM"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Exports
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app); // Realtime Database reference
export const functions = getFunctions(app); // Firebase Functions reference
