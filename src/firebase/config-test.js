// Archivo temporal para testing - src/firebase/config-test.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración directa para testing
const firebaseConfig = {
  apiKey: "AIzaSyB8uxM6yGzLaI4Lc6idPiYJlRhifjn9eCU",
  authDomain: "alimentacion-a07c8.firebaseapp.com",
  projectId: "alimentacion-a07c8",
  storageBucket: "alimentacion-a07c8.firebasestorage.app",
  messagingSenderId: "157989325906",
  appId: "1:157989325906:web:e113cc6f53456c2821638b"
};

console.log('Direct Firebase Config loaded');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore Database
export const db = getFirestore(app);

// Inicializar Authentication
export const auth = getAuth(app);

export default app;