import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBedqwAr6gEoSf-nSZcf_zLn2Xe5MGVn80",
  authDomain: "bestsite-e1453.firebaseapp.com",
  projectId: "bestsite-e1453",
  storageBucket: "bestsite-e1453.appspot.com",
  messagingSenderId: "62210888916",
  appId: "1:62210888916:web:e4eb1f3d1c9559503a1741",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { auth, googleProvider };
