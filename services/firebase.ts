import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions"; // Importujeme

// TOTO JE VAŠA KONFIGURÁCIA:
// Fix: Export firebaseConfig to make it available for import in other files.
export const firebaseConfig = {
  apiKey: "AIzaSyARuwcn4hMmt7MD5tTTp_r2HVqSu8Zno20",
  authDomain: "character-studio-comics.firebaseapp.com",
  projectId: "character-studio-comics",
  storageBucket: "character-studio-comics.appspot.com", // Používame .appspot.com
  messagingSenderId: "673014807195",
  appId: "1:673014807195:web:979046c375fe0b7e26e43e",
  measurementId: "G-4BT7DFW596"
};
export const projectId = firebaseConfig.projectId;

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
// EXPLICITNÉ NASTAVENIE REGIÓNU (ZABRÁNI CORS CHYBE)
const functions = getFunctions(app, 'us-central1'); 

export { auth, db, storage, functions, googleProvider, httpsCallable };