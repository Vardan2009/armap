// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Make sure this is here!
import { getDatabase } from "firebase/database"; // 1. Add this

// // // TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBe_hV2TKi0CmJNJijxQGqOZ6XrhWHa90c",
  authDomain: "armap-a7bfc.firebaseapp.com",
  projectId: "armap-a7bfc",
  storageBucket: "armap-a7bfc.firebasestorage.app",
  messagingSenderId: "20633518709",
  appId: "1:20633518709:web:7ce7183b806cea65556e3c",
  measurementId: "G-539MS9LH31"
};

// 1. Initialize the app
const app = initializeApp(firebaseConfig);

// 2. Export the auth tool so TheSidebar.vue can "catch" it
export const auth = getAuth(app);
export const db = getDatabase(app, "https://armap-a7bfc-default-rtdb.firebaseio.com/"); // 2. Add this