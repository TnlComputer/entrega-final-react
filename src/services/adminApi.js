// API del panel admin (Firebase)
import {collection, doc, getDocs, query, setDoc, where, writeBatch} from 'firebase/firestore';
import {obtenerToken} from './authApi';
import traducir from './erroresFirebase';
import {db} from './firebase';

// Guarda el catálogo completo y borra lo que ya no está
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

// Devuelve el anuncio guardado
export async function guardarAnuncio(anuncio) {
  try {
    await setDoc(doc(db, 'config', 'anuncio'), anuncio);
    return anuncio;
  } catch (error) {
    throw traducir(error);
  }
}

export async function guardarZonasEnvio(zonas) {
  try {
    await setDoc(doc(db, 'config', 'envios'), {zonas});
    return zonas;
  } catch (error) {
    throw traducir(error);
  }
}

export async function subirImagen(archivo) {
  const token = await obtenerToken();

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
