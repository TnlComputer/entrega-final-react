// Conexión con Firebase: Firestore guarda el catálogo y el anuncio; Auth maneja el login del panel.
// La configuración web de Firebase no es secreta (identifica al proyecto); lo que protege
// los datos son las reglas de Firestore (firestore.rules).
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const configuracion = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

if (!configuracion.projectId) {
  console.error('Falta la configuración de Firebase (VITE_FIREBASE_* en .env.local o en Netlify).');
}

const app = initializeApp(configuracion);

export const auth = getAuth(app);
export const db = getFirestore(app);
