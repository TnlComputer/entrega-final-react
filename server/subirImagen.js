// Sube la imagen a ImgBB (solo admins)

const TAMANIO_MAXIMO_IMAGEN = 5 * 1024 * 1024; // 5 MB
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const URL_IMGBB = 'https://api.imgbb.com/1/upload';

const responder = (estado, datos) =>
  new Response(JSON.stringify(datos), {status: estado, headers: {'Content-Type': 'application/json; charset=utf-8'}});

// Valida la imagen por sus primeros bytes
function esImagenReal(contenido, tipo) {
  const inicio = contenido.subarray(0, 12);
  if (tipo === 'image/jpeg') return inicio[0] === 0xff && inicio[1] === 0xd8 && inicio[2] === 0xff;
  if (tipo === 'image/png') return inicio.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (tipo === 'image/gif') return inicio.subarray(0, 4).toString('latin1') === 'GIF8';
  if (tipo === 'image/webp') return inicio.subarray(0, 4).toString('latin1') === 'RIFF' && inicio.subarray(8, 12).toString('latin1') === 'WEBP';
  return false;
}

// Es admin si puede leer su documento admins/{uid}
async function esAdmin(token, proyecto) {
  let uid;
  try {
    uid = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).user_id;
  } catch {
    return false;
  }
  if (!uid) return false;

  const url = `https://firestore.googleapis.com/v1/projects/${proyecto}/databases/(default)/documents/admins/${encodeURIComponent(uid)}`;
  const respuesta = await fetch(url, {headers: {Authorization: `Bearer ${token}`}});
  return respuesta.ok;
}

async function subirAImgbb(contenido, clave) {
  let respuesta;
  try {
    respuesta = await fetch(`${URL_IMGBB}?key=${encodeURIComponent(clave)}`, {
      method: 'POST',
      body: new URLSearchParams({image: contenido.toString('base64')})
    });
  } catch {
    throw Object.assign(new Error('No se pudo conectar con ImgBB.'), {estado: 502});
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !datos.success) {
    const motivo = datos.error?.message || `respuesta ${respuesta.status}`;
    throw Object.assign(new Error(`ImgBB rechazó la imagen: ${motivo}`), {estado: 502});
  }
  return datos.data.url;
}

export default async function subirImagen(peticion, {claveImgbb, proyectoFirebase}) {
  try {
    if (peticion.method !== 'POST') return responder(405, {error: 'Usá POST.'});
    if (!claveImgbb) return responder(500, {error: 'Falta IMGBB_KEY en el servidor.'});
    if (!proyectoFirebase) return responder(500, {error: 'Falta el projectId de Firebase (src/services/firebaseConfig.js).'});

    const token = (peticion.headers.get('authorization') || '').replace(/^Bearer /, '');
    if (!token || !(await esAdmin(token, proyectoFirebase))) {
      return responder(401, {error: 'Iniciá sesión de nuevo.'});
    }

    const tipo = peticion.headers.get('content-type');
    if (!TIPOS_IMAGEN.includes(tipo)) return responder(400, {error: 'La imagen tiene que ser JPG, PNG, WEBP o GIF.'});
    if (Number(peticion.headers.get('content-length')) > TAMANIO_MAXIMO_IMAGEN) {
      return responder(413, {error: 'El archivo es demasiado grande (máximo 5 MB).'});
    }

    const contenido = Buffer.from(await peticion.arrayBuffer());
    if (contenido.length > TAMANIO_MAXIMO_IMAGEN) return responder(413, {error: 'El archivo es demasiado grande (máximo 5 MB).'});
    if (!esImagenReal(contenido, tipo)) return responder(400, {error: 'El archivo no es una imagen válida.'});

    return responder(201, {url: await subirAImgbb(contenido, claveImgbb)});
  } catch (error) {
    if (!error.estado) console.error(error);
    return responder(error.estado || 500, {error: error.estado ? error.message : 'Error del servidor.'});
  }
}
