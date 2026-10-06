// Plugin de Vite: las rutas /api/* usan los mismos handlers que las Netlify Functions.
import {Readable} from 'node:stream';
import subirImagen from './subirImagen.js';
import comprar from './comprar.js';

export default function imagenesDev(opciones) {
  return {
    name: 'api-dev',
    apply: 'serve',

    configureServer(servidor) {
      const rutas = {
        '/api/imagenes': (request, config) => subirImagen(request, config),
        '/api/compras': (request, config) => comprar(request, config)
      };

      for (const [ruta, handler] of Object.entries(rutas)) {
        servidor.middlewares.use(ruta, async (peticion, respuesta) => {
          const request = new Request(`http://localhost${peticion.originalUrl}`, {
            method: peticion.method,
            headers: peticion.headers,
            body: peticion.method === 'POST' ? Readable.toWeb(peticion) : undefined,
            duplex: 'half'
          });

          const resultado = await handler(request, configFor(ruta, opciones));
          respuesta.statusCode = resultado.status;
          resultado.headers.forEach((valor, nombre) => respuesta.setHeader(nombre, valor));
          respuesta.end(await resultado.text());
        });
      }
    }
  };
}

function configFor(ruta, opciones) {
  if (ruta === '/api/compras') {
    return {
      serviceAccountJson: opciones.cuentaServicioFirebase,
      projectId: opciones.proyectoFirebase
    };
  }
  return opciones;
}
