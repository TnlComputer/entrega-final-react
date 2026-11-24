// Carga el equipo en Firestore
import {readFile} from 'node:fs/promises';
import {initializeApp} from 'firebase/app';
import {getAuth, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {doc, getFirestore, writeBatch} from 'firebase/firestore';
import {crearSlug} from '../src/data/modeloCatalogo.js';
import firebaseConfig from '../src/services/firebaseConfig.js';

process.loadEnvFile('.env.local');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  const {equipo} = JSON.parse(await readFile(new URL('./datos/equipo.json', import.meta.url), 'utf8'));

  await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);

  const lote = writeBatch(db);
  equipo.forEach(persona => lote.set(doc(db, 'equipo', crearSlug(persona.nombre)), persona));
  await lote.commit();

  console.log(`Listo: ${equipo.length} integrantes cargados en Firestore.`);
} catch (error) {
  console.error(`No se pudo cargar el equipo: ${error.code === 'permission-denied'
    ? 'la cuenta no es admin o las reglas nuevas no están publicadas.'
    : error.message}`);
  process.exitCode = 1;
} finally {
  await signOut(auth).catch(() => {});
  process.exit();
}
