// Plugin de Vite: /api/imagenes con `npm run dev`, igual que la Netlify Function del sitio publicado.
import {Readable} from 'node:stream';
import subirImagen from './subirImagen.js';

export default function imagenesDev(opciones) {
  return {
    name: 'imagenes-dev',
    apply: 'serve',

    configureServer(servidor) {
      servidor.middlewares.use('/api/imagenes', async (peticion, respuesta) => {
        // De la petición de Node a una Request estándar, y la Response de vuelta
        const request = new Request(`http://localhost${peticion.originalUrl}`, {
          method: peticion.method,
          headers: peticion.headers,
          body: peticion.method === 'POST' ? Readable.toWeb(peticion) : undefined,
          duplex: 'half'
        });

        const resultado = await subirImagen(request, opciones);
        respuesta.statusCode = resultado.status;
        resultado.headers.forEach((valor, nombre) => respuesta.setHeader(nombre, valor));
        respuesta.end(await resultado.text());
      });
    }
  };
}
