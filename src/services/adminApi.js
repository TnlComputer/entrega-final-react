// Cliente de la API del panel admin (server/catalogoApi.js).
// Esa API existe solo con `npm run dev`; en el sitio publicado no hay.
const CLAVE_TOKEN = 'admin-token';

// MODO DEMOSTRACIÓN (por ahora, en el sitio publicado):
// - el login acepta cualquier email y contraseña, sin validarlos, para que se pueda ver el panel;
// - guardar productos, rubros, anuncio o subir imágenes no hace nada (avisa que es una demo).
// En local (`npm run dev`) sigue todo como siempre: login con .env.local y cambios que se guardan.
// Para volver a usar el login real también en el sitio publicado (con un backend), poner false.
export const MODO_DEMO = import.meta.env.PROD;
const PREFIJO_DEMO = 'demo:';
const avisoDemo = () =>
  Promise.reject(new Error('Modo demostración: los cambios no se guardan. El panel se puede recorrer, pero no modifica el catálogo.'));


export function leerToken() {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardarToken(token) {
  try {
    if (token) sessionStorage.setItem(CLAVE_TOKEN, token);
    else sessionStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Sin sessionStorage la sesión dura hasta recargar la página
  }
}

async function pedir(ruta, {method = 'GET', body, headers = {}} = {}) {
  const token = leerToken();
  let respuesta;

  try {
    respuesta = await fetch(`/api${ruta}`, {
      method,
      body,
      headers: {...(token && {Authorization: `Bearer ${token}`}), ...headers}
    });
  } catch (error) {
    throw new Error('No hay conexión con el servidor de desarrollo.', {cause: error});
  }

  const tipo = respuesta.headers.get('content-type') || '';
  if (!tipo.includes('application/json')) {
    // En el sitio publicado /api no existe y el servidor devuelve otra cosa
    throw new Error('El panel de administración solo funciona corriendo el proyecto en local (npm run dev).');
  }

  const datos = await respuesta.json();
  if (!respuesta.ok) {
    if (respuesta.status === 401) guardarToken(null);
    throw Object.assign(new Error(datos.error || 'Algo salió mal.'), {estado: respuesta.status});
  }
  return datos;
}

export async function iniciarSesion(email, contrasenia) {
  if (MODO_DEMO) {
    // Sin validar: cualquier email y contraseña entran al panel
    guardarToken(`${PREFIJO_DEMO}${email}`);
    return email;
  }

  const datos = await pedir('/login', {
    method: 'POST',
    body: JSON.stringify({email, contrasenia}),
    headers: {'Content-Type': 'application/json'}
  });
  guardarToken(datos.token);
  return datos.email;
}

export async function consultarSesion() {
  const token = leerToken();
  if (!token) return null;
  if (MODO_DEMO) return token.startsWith(PREFIJO_DEMO) ? token.slice(PREFIJO_DEMO.length) : null;

  try {
    return (await pedir('/sesion')).email;
  } catch {
    return null;
  }
}

export async function cerrarSesion() {
  if (MODO_DEMO) {
    guardarToken(null);
    return;
  }

  try {
    await pedir('/logout', {method: 'POST'});
  } finally {
    guardarToken(null);
  }
}

export function guardarCatalogo(catalogo) {
  if (MODO_DEMO) return avisoDemo();

  return pedir('/catalogo', {
    method: 'PUT',
    body: JSON.stringify(catalogo),
    headers: {'Content-Type': 'application/json'}
  });
}

// Devuelve el anuncio tal como quedó guardado
export function guardarAnuncio(anuncio) {
  if (MODO_DEMO) return avisoDemo();

  return pedir('/anuncio', {
    method: 'PUT',
    body: JSON.stringify(anuncio),
    headers: {'Content-Type': 'application/json'}
  });
}

export async function subirImagen(archivo) {
  if (MODO_DEMO) return avisoDemo();

  const datos = await pedir('/imagenes', {
    method: 'POST',
    body: archivo,
    headers: {'Content-Type': archivo.type}
  });
  return datos.url;
}
