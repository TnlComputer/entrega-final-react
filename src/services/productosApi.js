import {collection, doc, getDoc, getDocs} from 'firebase/firestore';
import {ANUNCIO_VACIO} from '../data/modeloAnuncio';
import {db} from './firebase';

// El catálogo se pide una sola vez a Firestore: la tienda (ItemListContainer), el carrito
// y el panel admin comparten la misma respuesta.
let pedido = null;

const leerColeccion = async nombre => (await getDocs(collection(db, nombre))).docs.map(documento => documento.data());

export function cargarProductos() {
  if (!pedido) {
    const nuevo = Promise.all([leerColeccion('rubros'), leerColeccion('productos')])
      .then(([rubros, productos]) => ({rubros, productos}))
      .catch(error => {
        throw new Error('No se pudo obtener el catálogo', {cause: error});
      });

    // Si falla, el próximo intento lo vuelve a pedir
    nuevo.catch(() => {
      if (pedido === nuevo) pedido = null;
    });
    pedido = nuevo;
  }

  return pedido;
}

// El panel lo llama después de guardar, para que la tienda muestre lo nuevo
export function actualizarProductos(datos) {
  pedido = Promise.resolve(datos);
}

// El anuncio es un único documento: config/anuncio
export async function cargarAnuncio() {
  const documento = await getDoc(doc(db, 'config', 'anuncio'));
  return documento.exists() ? {...ANUNCIO_VACIO, ...documento.data()} : ANUNCIO_VACIO;
}

export async function cargarEnvios() {
  const documento = await getDoc(doc(db, 'config', 'envios'));
  return documento.exists() ? documento.data().zonas ?? [] : [];
}
