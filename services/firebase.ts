
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TOTO JE VAŠA KONFIGURÁCIA:
const firebaseConfig = {
  apiKey: "AIzaSyARuwcn4hMmt7MD5tTTp_r2HVqSu8Zno20", // Replace with your actual API key if needed, but it's public
  authDomain: "character-studio-comics.firebaseapp.com",
  projectId: "character-studio-comics",
  storageBucket: "character-studio-comics.appspot.com",
  messagingSenderId: "673014807195",
  appId: "1:673014807195:web:979046c375fe0b7e26e43e",
  measurementId: "G-4BT7DFW596"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider, firebaseConfig };
