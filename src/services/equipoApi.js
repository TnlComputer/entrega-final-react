import {collection, getDocs} from 'firebase/firestore';
import traducir from './erroresFirebase';
import {db} from './firebase';

export async function cargarEquipo() {
  try {
    const equipo = (await getDocs(collection(db, 'equipo'))).docs.map(documento => documento.data());
    return equipo.sort((a, b) => a.orden - b.orden);
  } catch (error) {
    throw traducir(error);
  }
}
