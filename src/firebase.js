import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Masukkan config dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAcCbH6MltXtOpCNgJjQnSL2S7odl0r_LA",
  authDomain: "tumithebat.firebaseapp.com",
  databaseURL: "https://tumithebat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tumithebat",
  storageBucket: "tumithebat.firebasestorage.app",
  messagingSenderId: "339694970123",
  appId: "1:339694970123:web:6a780efed4b7e40dc0ae0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };