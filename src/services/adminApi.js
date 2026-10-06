// Operaciones del panel admin contra Firebase.
//   Login: Firebase Auth (email y contraseña). Es admin quien tenga un documento admins/{uid}.
//   Catálogo: colecciones "rubros" (id = slug) y "productos" (id = número como texto).
//   Anuncio: documento config/anuncio.
//   Imágenes: /api/imagenes (Netlify Function), que sube a ImgBB con la clave oculta.
// Quién puede escribir lo deciden las reglas de Firestore (firestore.rules), no este archivo.
import {onAuthStateChanged, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch} from 'firebase/firestore';
import {auth, db} from './firebase';

const MENSAJES_FIREBASE = {
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisá internet.',
  'permission-denied': 'No tenés permiso para hacer cambios. Iniciá sesión de nuevo.',
  unavailable: 'No hay conexión con la base de datos. Revisá internet.'
};

// Pasa los errores de Firebase a un mensaje para mostrar
const traducir = error => new Error(MENSAJES_FIREBASE[error.code] || error.message || 'Algo salió mal.', {cause: error});

async function esAdmin(usuario) {
  try {
    return (await getDoc(doc(db, 'admins', usuario.uid))).exists();
  } catch {
    return false;
  }
}

// Avisa cada vez que cambia la sesión: callback(email) o callback(null).
// Firebase recuerda la sesión al recargar la página. Devuelve la función para dejar de escuchar.
export function observarSesion(callback) {
  return onAuthStateChanged(auth, async usuario => {
    callback(usuario && (await esAdmin(usuario)) ? usuario.email : null);
  });
}

export async function iniciarSesion(email, contrasenia) {
  let credencial;
  try {
    credencial = await signInWithEmailAndPassword(auth, email, contrasenia);
  } catch (error) {
    throw traducir(error);
  }

  if (!(await esAdmin(credencial.user))) {
    await signOut(auth);
    throw new Error('Esta cuenta no tiene permiso para entrar al panel.');
  }
  return credencial.user.email;
}

export function cerrarSesion() {
  return signOut(auth);
}

// Recibe el catálogo completo (como lo arma useAdminCatalogo) y deja Firestore igual:
// escribe cada rubro y producto, y borra los que ya no están. Todo junto o nada.
export async function guardarCatalogo({rubros, productos}) {
  try {
    const lote = writeBatch(db);
    const [rubrosGuardados, productosGuardados] = await Promise.all([
      getDocs(collection(db, 'rubros')),
      getDocs(collection(db, 'productos'))
    ]);

    const idsRubros = new Set(rubros.map(rubro => rubro.id));
    const idsProductos = new Set(productos.map(producto => String(producto.id)));

    rubrosGuardados.docs.filter(d => !idsRubros.has(d.id)).forEach(d => lote.delete(d.ref));
    productosGuardados.docs.filter(d => !idsProductos.has(d.id)).forEach(d => lote.delete(d.ref));
    rubros.forEach(rubro => lote.set(doc(db, 'rubros', rubro.id), rubro));
    productos.forEach(producto => lote.set(doc(db, 'productos', String(producto.id)), producto));

    await lote.commit();
  } catch (error) {
    throw traducir(error);
  }
}

// Devuelve el anuncio tal como quedó guardado
export async function guardarAnuncio(anuncio) {
  try {
    await setDoc(doc(db, 'config', 'anuncio'), anuncio);
    return anuncio;
  } catch (error) {
    throw traducir(error);
  }
}

export async function subirImagen(archivo) {
  if (!auth.currentUser) throw new Error('Iniciá sesión de nuevo.');
  const token = await auth.currentUser.getIdToken();

  let respuesta;
  try {
    respuesta = await fetch('/api/imagenes', {
      method: 'POST',
      body: archivo,
      headers: {Authorization: `Bearer ${token}`, 'Content-Type': archivo.type}
    });
  } catch (error) {
    throw new Error('No hay conexión con el servidor.', {cause: error});
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'No se pudo subir la imagen.');
  return datos.url;
}

async function idImagen(url) {
  const contenido = new TextEncoder().encode(url);
  const resumen = await crypto.subtle.digest('SHA-256', contenido);
  return Array.from(new Uint8Array(resumen), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function listarImagenesGaleria(rubro) {
  if (!rubro) return [];
  try {
    const imagenes = await getDocs(query(collection(db, 'imagenes'), where('rubro', '==', rubro)));
    return imagenes.docs
      .map(imagen => imagen.data())
      .sort((a, b) => (b.creadaEn ?? '').localeCompare(a.creadaEn ?? ''));
  } catch (error) {
    throw traducir(error);
  }
}

export async function guardarImagenGaleria({url, rubro, nombre}) {
  if (!url || !rubro) return;
  try {
    const id = await idImagen(url);
    await setDoc(
      doc(db, 'imagenes', id),
      {url, rubro, nombre: nombre || 'Imagen guardada', creadaEn: new Date().toISOString()},
      {merge: true}
    );
  } catch (error) {
    throw traducir(error);
  }
}
