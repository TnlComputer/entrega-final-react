// Carga los datos iniciales en Firestore (--forzar pisa lo que haya)
import {readFile} from 'node:fs/promises';
import {initializeApp} from 'firebase/app';
import {getAuth, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {collection, doc, getDocs, getFirestore, writeBatch} from 'firebase/firestore';
import {validarProducto, validarRubro} from '../src/data/modeloCatalogo.js';
import {validarAnuncio} from '../src/data/modeloAnuncio.js';
import firebaseConfig from '../src/services/firebaseConfig.js';

process.loadEnvFile('.env.local');
const {env} = process;

const leerJson = async nombre => JSON.parse(await readFile(new URL(`./datos/${nombre}`, import.meta.url), 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  const {rubros, productos} = await leerJson('productos.json');
  const anuncio = await leerJson('anuncio.json');

  // Mismas validaciones que el panel
  for (const rubro of rubros) {
    const errores = validarRubro(rubro, {rubros, id: rubro.id});
    if (Object.keys(errores).length) throw new Error(`Rubro "${rubro.nombre}": ${Object.values(errores)[0]}`);
  }
  for (const producto of productos) {
    const errores = validarProducto(producto, {rubros, productos, id: producto.id});
    if (Object.keys(errores).length) throw new Error(`Producto "${producto.nombre}": ${Object.values(errores)[0]}`);
  }
  if (Object.keys(validarAnuncio(anuncio)).length) throw new Error('El anuncio de scripts/datos/anuncio.json no es válido.');

  await signInWithEmailAndPassword(auth, env.ADMIN_EMAIL, env.ADMIN_PASSWORD);

  const existentes = await getDocs(collection(db, 'productos'));
  if (!existentes.empty && !process.argv.includes('--forzar')) {
    throw new Error(`Firestore ya tiene ${existentes.size} productos. Para pisarlos: npm run cargar-datos -- --forzar`);
  }

  const lote = writeBatch(db);
  rubros.forEach(rubro => lote.set(doc(db, 'rubros', rubro.id), rubro));
  productos.forEach(producto => lote.set(doc(db, 'productos', String(producto.id)), producto));
  lote.set(doc(db, 'config', 'anuncio'), anuncio);
  await lote.commit();

  console.log(`Listo: ${rubros.length} rubros, ${productos.length} productos y el anuncio cargados en Firestore.`);
} catch (error) {
  console.error(`No se pudieron cargar los datos: ${error.code === 'permission-denied'
    ? 'la cuenta no es admin (falta su documento admins/{uid}) o las reglas no están publicadas.'
    : error.message}`);
  process.exitCode = 1;
} finally {
  await signOut(auth).catch(() => {});
  process.exit();
}
