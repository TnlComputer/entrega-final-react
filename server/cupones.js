// Cuenta las entradas y reparte los cupones
import {getFirestore} from 'firebase-admin/firestore';
import {ENTRADAS_POR_CUPON, crearCupon, estadoCupon, visitanteValido} from '../src/data/modeloCupones.js';
import {fallo, leerJson, obtenerApp, responder, verificarUsuario} from './firebaseAdmin.js';

export default async function registrarEntrada(peticion, {serviceAccountJson, projectId}) {
  try {
    if (peticion.method !== 'POST') throw fallo(405, 'Usá POST.');

    const cuerpo = await leerJson(peticion);
    const visitante = cuerpo?.visitante;
    if (!visitanteValido(visitante)) throw fallo(400, 'El visitante no es válido.');
    const esNueva = cuerpo.nueva === true;

    const app = obtenerApp(serviceAccountJson, projectId);
    const usuario = peticion.headers.get('authorization') ? await verificarUsuario(peticion) : null;
    const db = getFirestore(app);
    const refContador = db.collection('contadores').doc('entradas');
    const refCupones = db.collection('cupones');

    const resultado = await db.runTransaction(async transaction => {
      const [admin, contador, delVisitante, delUsuario] = await Promise.all([
        usuario && transaction.get(db.collection('admins').doc(usuario.uid)),
        transaction.get(refContador),
        transaction.get(refCupones.where('visitante', '==', visitante)),
        usuario && transaction.get(refCupones.where('uid', '==', usuario.uid))
      ]);
      if (admin?.exists) return {cupon: null, nuevo: false, activos: []};

      const activo = documento => estadoCupon(documento.data()) === 'activo';
      const sinCuenta = delVisitante.docs.filter(documento => activo(documento) && !documento.data().uid);
      const activos = [...sinCuenta, ...(delUsuario?.docs.filter(activo) ?? [])].map(documento => ({
        ...documento.data(),
        ...(usuario && {uid: usuario.uid, email: usuario.email})
      }));

      // Al ingresar, los cupones del visitante pasan a su cuenta
      if (usuario) {
        sinCuenta.forEach(documento =>
          transaction.update(documento.ref, {uid: usuario.uid, email: usuario.email})
        );
      }
      if (!esNueva) return {cupon: null, nuevo: false, activos};

      const total = (contador.exists ? contador.data().total : 0) + 1;
      transaction.set(refContador, {total});
      if (total % ENTRADAS_POR_CUPON !== 0) return {cupon: activos[0] ?? null, nuevo: false, activos};

      const cupon = crearCupon({...usuario, visitante, origen: 'entrada'});
      transaction.create(refCupones.doc(cupon.codigo), cupon);
      return {cupon, nuevo: true, activos: [cupon, ...activos]};
    });

    return responder(200, resultado);
  } catch (error) {
    if (!error.estado) console.error(error);
    return responder(error.estado || 500, {
      error: error.estado ? error.message : 'No se pudo registrar la entrada.'
    });
  }
}
