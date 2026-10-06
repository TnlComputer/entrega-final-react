// Conexión con Firebase: Firestore guarda el catálogo y el anuncio; Auth maneja el login del panel.
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import firebaseConfig from './firebaseConfig';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
