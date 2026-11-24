// Lo que comparten las funciones del servidor
import {cert, getApps, initializeApp} from 'firebase-admin/app';
import firebaseConfig from '../src/services/firebaseConfig.js';

const MAX_BYTES = 16 * 1024;

export const HOST_AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST
  ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com`
  : 'https://identitytoolkit.googleapis.com';

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

export async function leerJson(peticion) {
  if (!peticion.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw fallo(415, 'El contenido de la solicitud debe ser JSON.');
  }
  const longitud = Number(peticion.headers.get('content-length') || 0);
  if (longitud > MAX_BYTES) throw fallo(413, 'La solicitud supera el tamaño permitido.');
  const texto = await peticion.text();
  if (Buffer.byteLength(texto, 'utf8') > MAX_BYTES) throw fallo(413, 'La solicitud supera el tamaño permitido.');
  try {
    return JSON.parse(texto);
  } catch {
    throw fallo(400, 'La solicitud no contiene JSON válido.');
  }
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
export async function verificarUsuario(peticion) {
  const token = (peticion.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!token) throw fallo(401, 'Iniciá sesión para continuar.');

  const respuesta = await fetch(`${HOST_AUTH}/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({idToken: token})
  });
  if (respuesta.status >= 500) throw fallo(502, 'No se pudo validar la sesión. Probá de nuevo.');

  const cuenta = (await respuesta.json().catch(() => ({}))).users?.[0];
  if (!respuesta.ok || !cuenta) throw fallo(401, 'La sesión venció. Iniciá sesión de nuevo.');
  return {uid: cuenta.localId, email: cuenta.email ?? ''};
}
