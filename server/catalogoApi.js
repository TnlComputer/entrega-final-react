// Plugin de Vite: API del panel admin. Solo existe con `npm run dev`
// (el sitio publicado es estático y no puede modificar el catálogo).
//
//   POST /api/login      {email, contrasenia} → {token, email}
//   GET  /api/sesion     → {email} si el token es válido
//   POST /api/logout
//   PUT  /api/catalogo   {rubros, productos} → guarda public/data/productos.json
//   PUT  /api/anuncio    {activo, texto, desde, hasta} → guarda public/data/anuncio.json
//   POST /api/imagenes   (archivo) → {url} subida a ImgBB (la key queda acá, no en el navegador)
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {validarProducto, validarRubro} from '../src/data/modeloCatalogo.js';
import {prepararAnuncio, validarAnuncio} from '../src/data/modeloAnuncio.js';

const TAMANIO_MAXIMO_JSON = 1024 * 1024; // 1 MB
const TAMANIO_MAXIMO_IMAGEN = 5 * 1024 * 1024; // 5 MB
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const URL_IMGBB = 'https://api.imgbb.com/1/upload';

// Revisa los primeros bytes: el tipo que manda el navegador se puede falsear
function esImagenReal(contenido, tipo) {
  const inicio = contenido.subarray(0, 12);
  if (tipo === 'image/jpeg') return inicio[0] === 0xff && inicio[1] === 0xd8 && inicio[2] === 0xff;
  if (tipo === 'image/png') return inicio.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (tipo === 'image/gif') return inicio.subarray(0, 4).toString('latin1') === 'GIF8';
  if (tipo === 'image/webp') return inicio.subarray(0, 4).toString('latin1') === 'RIFF' && inicio.subarray(8, 12).toString('latin1') === 'WEBP';
  return false;
}

function leerCuerpo(peticion, limite) {
  return new Promise((resolver, rechazar) => {
    const partes = [];
    let total = 0;

    peticion.on('data', parte => {
      total += parte.length;
      if (total > limite) {
        rechazar(Object.assign(new Error('El archivo es demasiado grande.'), {estado: 413}));
        peticion.destroy();
        return;
      }
      partes.push(parte);
    });
    peticion.on('end', () => resolver(Buffer.concat(partes)));
    peticion.on('error', rechazar);
  });
}

async function leerJson(peticion) {
  try {
    return JSON.parse((await leerCuerpo(peticion, TAMANIO_MAXIMO_JSON)).toString('utf8'));
  } catch (error) {
    if (error.estado) throw error;
    throw Object.assign(new Error('Los datos enviados no son JSON válido.'), {estado: 400});
  }
}

function responder(respuesta, estado, datos) {
  respuesta.statusCode = estado;
  respuesta.setHeader('Content-Type', 'application/json; charset=utf-8');
  respuesta.end(JSON.stringify(datos));
}

function textosIguales(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

// Revisa todo el catálogo antes de escribirlo, con las mismas reglas que el formulario.
function validarCatalogo(catalogo) {
  if (!catalogo || !Array.isArray(catalogo.rubros) || !Array.isArray(catalogo.productos)) {
    return 'El catálogo tiene que tener "rubros" y "productos".';
  }

  for (const rubro of catalogo.rubros) {
    const errores = validarRubro(rubro, {rubros: catalogo.rubros, id: rubro.id});
    if (!rubro.id || Object.keys(errores).length) return `Rubro inválido "${rubro.nombre}": ${Object.values(errores)[0] || 'falta el id'}`;
  }

  const ids = new Set();
  for (const producto of catalogo.productos) {
    if (!Number.isInteger(producto.id) || ids.has(producto.id)) return `Producto con id inválido o repetido: ${producto.id}`;
    ids.add(producto.id);

    const errores = validarProducto(producto, {rubros: catalogo.rubros, productos: catalogo.productos, id: producto.id});
    if (Object.keys(errores).length) return `Producto inválido "${producto.nombre}": ${Object.values(errores)[0]}`;
  }

  return null;
}

async function subirAImgbb(contenido, clave) {
  let respuesta;
  try {
    respuesta = await fetch(`${URL_IMGBB}?key=${encodeURIComponent(clave)}`, {
      method: 'POST',
      body: new URLSearchParams({image: contenido.toString('base64')})
    });
  } catch {
    throw Object.assign(new Error('No se pudo conectar con ImgBB. Revisá internet.'), {estado: 502});
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !datos.success) {
    const motivo = datos.error?.message || `respuesta ${respuesta.status}`;
    throw Object.assign(new Error(`ImgBB rechazó la imagen: ${motivo}`), {estado: 502});
  }
  return datos.data.url;
}

export default function catalogoApi({email, contrasenia, claveImgbb}) {
  const tokens = new Map(); // token → email (se borran al reiniciar el servidor)

  return {
    name: 'catalogo-api',
    apply: 'serve',

    configureServer(servidor) {
      const publico = servidor.config.publicDir;
      const rutaCatalogo = path.join(publico, 'data', 'productos.json');
      const rutaAnuncio = path.join(publico, 'data', 'anuncio.json');

      // Se escribe en un temporal y se renombra, para no dejar el JSON a medias
      const escribirJson = async (ruta, datos) => {
        const temporal = `${ruta}.tmp`;
        await writeFile(temporal, `${JSON.stringify(datos, null, 2)}\n`);
        await rename(temporal, ruta);
      };

      const sesionDe = peticion => {
        const token = (peticion.headers.authorization || '').replace(/^Bearer /, '');
        return tokens.get(token) || null;
      };

      servidor.middlewares.use('/api', async (peticion, respuesta) => {
        try {
          const ruta = peticion.url.split('?')[0];

          if (peticion.method === 'POST' && ruta === '/login') {
            if (!email || !contrasenia) {
              return responder(respuesta, 500, {error: 'Faltan ADMIN_EMAIL y ADMIN_PASSWORD en .env.local'});
            }
            const datos = await leerJson(peticion);
            const coincide =
              textosIguales(String(datos.email || '').trim().toLowerCase(), email.toLowerCase()) &&
              textosIguales(datos.contrasenia || '', contrasenia);

            if (!coincide) return responder(respuesta, 401, {error: 'Email o contraseña incorrectos.'});

            const token = randomBytes(32).toString('hex');
            tokens.set(token, email);
            return responder(respuesta, 200, {token, email});
          }

          if (peticion.method === 'GET' && ruta === '/sesion') {
            const sesion = sesionDe(peticion);
            return sesion ? responder(respuesta, 200, {email: sesion}) : responder(respuesta, 401, {error: 'Sesión vencida.'});
          }

          if (peticion.method === 'POST' && ruta === '/logout') {
            tokens.delete((peticion.headers.authorization || '').replace(/^Bearer /, ''));
            return responder(respuesta, 200, {ok: true});
          }

          // Desde acá, todo requiere sesión
          if (!sesionDe(peticion)) return responder(respuesta, 401, {error: 'Iniciá sesión de nuevo.'});

          if (peticion.method === 'PUT' && ruta === '/catalogo') {
            const catalogo = await leerJson(peticion);
            const error = validarCatalogo(catalogo);
            if (error) return responder(respuesta, 400, {error});

            await escribirJson(rutaCatalogo, {rubros: catalogo.rubros, productos: catalogo.productos});
            return responder(respuesta, 200, {ok: true});
          }

          if (peticion.method === 'PUT' && ruta === '/anuncio') {
            const datos = await leerJson(peticion);
            if (!datos || typeof datos.texto !== 'string') return responder(respuesta, 400, {error: 'Falta el texto del anuncio.'});

            const anuncio = prepararAnuncio(datos);
            const errores = validarAnuncio(anuncio);
            if (Object.keys(errores).length) return responder(respuesta, 400, {error: Object.values(errores)[0]});

            await escribirJson(rutaAnuncio, anuncio);
            return responder(respuesta, 200, anuncio);
          }

          if (peticion.method === 'POST' && ruta === '/imagenes') {
            if (!claveImgbb) return responder(respuesta, 500, {error: 'Falta IMGBB_KEY en .env.local'});

            const tipo = peticion.headers['content-type'];
            if (!TIPOS_IMAGEN.includes(tipo)) return responder(respuesta, 400, {error: 'La imagen tiene que ser JPG, PNG, WEBP o GIF.'});

            const contenido = await leerCuerpo(peticion, TAMANIO_MAXIMO_IMAGEN);
            if (!esImagenReal(contenido, tipo)) {
              return responder(respuesta, 400, {error: 'El archivo no es una imagen válida.'});
            }
            return responder(respuesta, 201, {url: await subirAImgbb(contenido, claveImgbb)});
          }

          responder(respuesta, 404, {error: 'Ruta no encontrada.'});
        } catch (error) {
          responder(respuesta, error.estado || 500, {error: error.estado ? error.message : 'Error del servidor.'});
          if (!error.estado) servidor.config.logger.error(error.stack);
        }
      });
    }
  };
}
