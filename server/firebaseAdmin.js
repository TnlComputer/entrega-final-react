// Lo que comparten las funciones del servidor
import {cert, getApps, initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

export const responder = (estado, datos) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: {'Content-Type': 'application/json; charset=utf-8'}
  });

export function fallo(estado, mensaje, datos = {}) {
  const error = new Error(mensaje);
  error.estado = estado;
  error.datos = datos;
  return error;
}

export function obtenerApp(serviceAccountJson, projectId) {
  if (!serviceAccountJson) throw fallo(500, 'Falta FIREBASE_SERVICE_ACCOUNT_JSON en el servidor.');

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw fallo(500, 'FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido.');
  }

  if (
    !serviceAccount ||
    typeof serviceAccount.project_id !== 'string' ||
    typeof serviceAccount.client_email !== 'string' ||
    typeof serviceAccount.private_key !== 'string' ||
    serviceAccount.project_id !== projectId
  ) {
    throw fallo(500, 'La cuenta de servicio de Firebase no es válida para este proyecto.');
  }

  const existente = getApps().find(app => app.options.projectId === projectId);
  return existente ?? initializeApp({credential: cert(serviceAccount), projectId});
}

// Valida la sesión con el token de Firebase
export async function verificarUsuario(peticion, app) {
  const token = (peticion.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!token) throw fallo(401, 'Iniciá sesión para usar cupones.');

  try {
    const {uid, email = ''} = await getAuth(app).verifyIdToken(token);
    return {uid, email};
  } catch (error) {
    if (!error.code?.startsWith('auth/')) throw error;
    throw fallo(401, 'La sesión venció. Iniciá sesión de nuevo.');
  }
}
