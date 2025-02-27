// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBAh_u292F6noSmU2S-axcph__T0zWY6KQ",
  authDomain: "mfu-smart-campus.firebaseapp.com",
  projectId: "mfu-smart-campus",
  storageBucket: "mfu-smart-campus.firebasestorage.app",
  messagingSenderId: "821134449503",
  appId: "1:821134449503:web:f0c51b3a98613c9beaf4ea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
