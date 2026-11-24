// Cuenta las entradas y reparte los cupones
import {getFirestore} from 'firebase-admin/firestore';
import {ENTRADAS_POR_CUPON, HORAS_VALIDEZ, crearCupon, estadoCupon} from '../src/data/modeloCupones.js';
import {fallo, obtenerApp, responder, verificarUsuario} from './firebaseAdmin.js';

export default async function registrarEntrada(peticion, {serviceAccountJson, projectId}) {
  try {
    if (peticion.method !== 'POST') throw fallo(405, 'Usá POST.');

    const app = obtenerApp(serviceAccountJson, projectId);
    const usuario = await verificarUsuario(peticion, app);
    const db = getFirestore(app);
    const refContador = db.collection('contadores').doc('entradas');
    const refCupones = db.collection('cupones');

    const resultado = await db.runTransaction(async transaction => {
      const [admin, contador, propios] = await Promise.all([
        transaction.get(db.collection('admins').doc(usuario.uid)),
        transaction.get(refContador),
        transaction.get(refCupones.where('uid', '==', usuario.uid))
      ]);
      if (admin.exists) return {cupon: null, nuevo: false};

      const cupones = propios.docs.map(documento => documento.data());
      const activo = cupones.find(cupon => estadoCupon(cupon) === 'activo');
      if (activo) return {cupon: activo, nuevo: false};

      // Un solo cupón por usuario en cada período
      const desde = Date.now() - HORAS_VALIDEZ * 60 * 60 * 1000;
      const yaRecibio = cupones.some(
        cupon => cupon.origen === 'entrada' && new Date(cupon.creadoEn).getTime() > desde
      );
      if (yaRecibio) return {cupon: null, nuevo: false};

      const total = (contador.exists ? contador.data().total : 0) + 1;
      transaction.set(refContador, {total});
      if (total % ENTRADAS_POR_CUPON !== 0) return {cupon: null, nuevo: false};

      const cupon = crearCupon({...usuario, origen: 'entrada'});
      transaction.create(refCupones.doc(cupon.codigo), cupon);
      return {cupon, nuevo: true};
    });

    return responder(200, resultado);
  } catch (error) {
    if (!error.estado) console.error(error);
    return responder(error.estado || 500, {
      error: error.estado ? error.message : 'No se pudo registrar la entrada.'
    });
  }
}
