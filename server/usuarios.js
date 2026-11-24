// Lista y elimina usuarios (solo admins)
import {getFirestore} from 'firebase-admin/firestore';
import {HOST_AUTH, fallo, obtenerApp, responder, verificarUsuario} from './firebaseAdmin.js';

async function pedirAuth(app, projectId, ruta, cuerpo) {
  const token = process.env.FIREBASE_AUTH_EMULATOR_HOST
    ? 'owner'
    : (await app.options.credential.getAccessToken()).access_token;
  const respuesta = await fetch(`${HOST_AUTH}/v1/projects/${projectId}/${ruta}`, {
    method: cuerpo ? 'POST' : 'GET',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    ...(cuerpo && {body: JSON.stringify(cuerpo)})
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (respuesta.ok) return datos;

  if (respuesta.status === 403) {
    throw fallo(500, 'La cuenta de servicio no tiene permiso para administrar usuarios.');
  }
  if (datos.error?.message === 'USER_NOT_FOUND') throw fallo(404, 'Ese usuario ya no existe.');
  throw fallo(502, 'No se pudo consultar Firebase Authentication.');
}

async function listarCuentas(app, projectId) {
  const cuentas = [];
  let pagina = '';
  do {
    const datos = await pedirAuth(
      app,
      projectId,
      `accounts:batchGet?maxResults=500${pagina && `&nextPageToken=${encodeURIComponent(pagina)}`}`
    );
    cuentas.push(...(datos.users ?? []));
    pagina = datos.nextPageToken ?? '';
  } while (pagina);
  return cuentas;
}

const aIso = milisegundos => (Number(milisegundos) ? new Date(Number(milisegundos)).toISOString() : null);

async function listar(app, projectId, db) {
  const [cuentas, admins] = await Promise.all([listarCuentas(app, projectId), db.collection('admins').get()]);
  const idsAdmin = new Set(admins.docs.map(documento => documento.id));

  return cuentas
    .filter(cuenta => cuenta.email)
    .map(cuenta => ({
      uid: cuenta.localId,
      email: cuenta.email,
      nombre: cuenta.displayName || cuenta.email.split('@')[0],
      esAdmin: idsAdmin.has(cuenta.localId),
      creadoEn: aIso(cuenta.createdAt),
      ultimoIngreso: aIso(cuenta.lastLoginAt)
    }))
    .sort((a, b) => Number(b.esAdmin) - Number(a.esAdmin) || a.nombre.localeCompare(b.nombre, 'es'));
}

async function eliminar(app, projectId, db, uid) {
  if (!uid || uid.length > 128 || uid.includes('/')) throw fallo(400, 'El usuario no es válido.');
  const admin = await db.collection('admins').doc(uid).get();
  if (admin.exists) throw fallo(403, 'Los administradores no se pueden eliminar.');

  try {
    await pedirAuth(app, projectId, 'accounts:delete', {localId: uid});
  } catch (error) {
    // Si la cuenta ya no está, igual se limpia su documento
    if (error.estado !== 404) throw error;
  }
  await db.collection('usuarios').doc(uid).delete();
}

export default async function usuarios(peticion, {serviceAccountJson, projectId}) {
  try {
    const app = obtenerApp(serviceAccountJson, projectId);
    const {uid} = await verificarUsuario(peticion);
    const db = getFirestore(app);
    if (!(await db.collection('admins').doc(uid).get()).exists) {
      throw fallo(403, 'Solo los administradores pueden gestionar usuarios.');
    }

    if (peticion.method === 'GET') return responder(200, {usuarios: await listar(app, projectId, db)});
    if (peticion.method === 'DELETE') {
      await eliminar(app, projectId, db, new URL(peticion.url).searchParams.get('uid'));
      return responder(200, {ok: true});
    }
    throw fallo(405, 'Usá GET o DELETE.');
  } catch (error) {
    if (!error.estado) console.error(error);
    return responder(error.estado || 500, {
      error: error.estado ? error.message : 'No se pudo completar la operación.'
    });
  }
}
