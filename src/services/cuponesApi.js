import {collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, where} from 'firebase/firestore';
import {crearCupon} from '../data/modeloCupones';
import {obtenerToken} from './authApi';
import traducir from './erroresFirebase';
import {db} from './firebase';

const refCupones = collection(db, 'cupones');

const observar = (consulta, alCambiar, alFallar) =>
  onSnapshot(
    consulta,
    snapshot => alCambiar(snapshot.docs.map(documento => documento.data())),
    error => alFallar(traducir(error))
  );

export const observarCupones = (alCambiar, alFallar) => observar(refCupones, alCambiar, alFallar);

export const observarCuponesDe = (uid, alCambiar, alFallar) =>
  observar(query(refCupones, where('uid', '==', uid)), alCambiar, alFallar);

// El servidor decide si toca cupón
export async function registrarEntrada() {
  const respuesta = await fetch('/api/cupones', {
    method: 'POST',
    headers: {Authorization: `Bearer ${await obtenerToken()}`}
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'No se pudo registrar la entrada.');
  return datos;
}

export async function guardarCupon(datos) {
  try {
    const cupon = crearCupon({...datos, origen: 'manual'});
    await setDoc(doc(refCupones, cupon.codigo), cupon);
    return cupon;
  } catch (error) {
    throw traducir(error);
  }
}

export async function eliminarCupon(codigo) {
  try {
    await deleteDoc(doc(refCupones, codigo));
  } catch (error) {
    throw traducir(error);
  }
}

export async function listarUsuarios() {
  try {
    const usuarios = (await getDocs(collection(db, 'usuarios'))).docs.map(documento => documento.data());
    return usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  } catch (error) {
    throw traducir(error);
  }
}
