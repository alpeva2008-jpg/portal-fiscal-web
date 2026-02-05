import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tus datos reales de la consola
const firebaseConfig = {
  apiKey: "AIzaSyByL-hoXRu8gstYT4g4ykjeaCaDLXVPBWU",
  authDomain: "portalclientesdespacho.firebaseapp.com",
  projectId: "portalclientesdespacho",
  storageBucket: "portalclientesdespacho.firebasestorage.app",
  messagingSenderId: "414604245683",
  appId: "1:414604245683:web:7bd27e095721c1fde7cec6",
  measurementId: "G-4MB87CCE2E"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos las herramientas para usarlas en las pantallas
export const auth = getAuth(app);
export const db = getFirestore(app);