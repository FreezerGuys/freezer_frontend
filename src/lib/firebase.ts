// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyFSGD_hGaUHrhiT7n1LAHT0XH2vzCJKk",
  authDomain: "freezer-poc.firebaseapp.com",
  projectId: "freezer-poc",
  storageBucket: "freezer-poc.firebasestorage.app",
  messagingSenderId: "986088841113",
  appId: "1:986088841113:web:7dcb4d0094877db78ffd08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };