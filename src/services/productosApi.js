import {collection, doc, getDoc, getDocs} from 'firebase/firestore';
import {ANUNCIO_VACIO} from '../data/modeloAnuncio';
import {db} from './firebase';

// Se pide una sola vez y se comparte
let pedido = null;

const leerColeccion = async nombre => (await getDocs(collection(db, nombre))).docs.map(documento => documento.data());

export function cargarProductos() {
  if (!pedido) {
    const nuevo = Promise.all([leerColeccion('rubros'), leerColeccion('productos')])
      .then(([rubros, productos]) => ({rubros, productos}))
      .catch(error => {
        throw new Error('No se pudo obtener el catálogo', {cause: error});
      });

    // Si falla, se vuelve a pedir
    nuevo.catch(() => {
      if (pedido === nuevo) pedido = null;
    });
    pedido = nuevo;
  }

  return pedido;
}

// Recarga después de guardar en el panel
export function actualizarProductos(datos) {
  pedido = Promise.resolve(datos);
}

export async function cargarAnuncio() {
  const documento = await getDoc(doc(db, 'config', 'anuncio'));
  return documento.exists() ? {...ANUNCIO_VACIO, ...documento.data()} : ANUNCIO_VACIO;
}

export async function cargarEnvios() {
  const documento = await getDoc(doc(db, 'config', 'envios'));
  return documento.exists() ? documento.data().zonas ?? [] : [];
}
