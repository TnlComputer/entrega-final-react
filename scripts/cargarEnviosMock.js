import {initializeApp} from 'firebase/app';
import {getAuth, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {doc, getDoc, getFirestore, setDoc} from 'firebase/firestore';
import {validarZonaEnvio, ZONAS_ENVIO_MOCK} from '../src/data/modeloEnvios.js';
import firebaseConfig from '../src/services/firebaseConfig.js';

process.loadEnvFile('.env.local');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const refEnvios = doc(db, 'config', 'envios');

try {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('Completá ADMIN_EMAIL y ADMIN_PASSWORD en .env.local.');
  }

  for (const zona of ZONAS_ENVIO_MOCK) {
    const errores = validarZonaEnvio(zona, ZONAS_ENVIO_MOCK, zona.id);
    if (Object.keys(errores).length) {
      throw new Error(`La zona demo "${zona.nombre}" no es válida: ${Object.values(errores)[0]}`);
    }
  }

  await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);

  const existente = await getDoc(refEnvios);
  const zonasExistentes = existente.exists() ? existente.data().zonas : [];
  if (Array.isArray(zonasExistentes) && zonasExistentes.length > 0) {
    throw new Error(
      `No se modificó config/envios: ya hay ${zonasExistentes.length} zona(s). Revisalas en Admin → Envíos para evitar sobrescribir tarifas reales.`
    );
  }

  await setDoc(refEnvios, {zonas: ZONAS_ENVIO_MOCK});

  const verificacion = await getDoc(refEnvios);
  const zonasCargadas = verificacion.exists() ? verificacion.data().zonas : null;
  if (JSON.stringify(zonasCargadas) !== JSON.stringify(ZONAS_ENVIO_MOCK)) {
    throw new Error('Firestore aceptó la escritura, pero la verificación de las zonas no coincide.');
  }

  console.log(`Cargadas y verificadas ${zonasCargadas.length} zonas de envío en config/envios:`);
  zonasCargadas.forEach(zona =>
    console.log(
      `- ${zona.nombre}: CP ${zona.codigoDesde}-${zona.codigoHasta}, ${zona.localidades.length} localidades, $${zona.precio}`
    )
  );
} catch (error) {
  console.error(
    `No se pudieron cargar las zonas demo: ${
      error.code === 'permission-denied'
        ? 'la cuenta no es admin (falta su documento admins/{uid}) o las reglas no permiten guardar config/envios.'
        : error.message
    }`
  );
  process.exitCode = 1;
} finally {
  await signOut(auth).catch(() => {});
}
