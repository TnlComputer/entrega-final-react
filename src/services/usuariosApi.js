import {obtenerToken} from './authApi';

async function pedir(metodo, consulta = '') {
  const token = await obtenerToken();
  let respuesta;
  try {
    respuesta = await fetch(`/api/usuarios${consulta}`, {method: metodo, headers: {Authorization: `Bearer ${token}`}});
  } catch (error) {
    throw new Error('No hay conexión con el servidor.', {cause: error});
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'No se pudo completar la operación.');
  return datos;
}

export const listarUsuarios = async () => (await pedir('GET')).usuarios ?? [];

export const eliminarUsuario = uid => pedir('DELETE', `?uid=${encodeURIComponent(uid)}`);
