import {cabeceraSesion} from './authApi';
import {obtenerVisitante} from './visitante';

export async function confirmarCompraSimulada(compra) {
  // La sesión o el visitante prueban de quién es el cupón
  const sesion = compra.cupon ? await cabeceraSesion() : {};
  let respuesta;
  try {
    respuesta = await fetch('/api/compras', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...sesion},
      body: JSON.stringify({...compra, visitante: obtenerVisitante()})
    });
  } catch (error) {
    throw new Error('No hay conexión con el servidor para confirmar el stock.', {cause: error});
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const mensajeServidor = datos.error || 'No se pudo confirmar la compra simulada.';
    const error = new Error(
      respuesta.status >= 500
        ? `El servidor no pudo procesar la compra. ${mensajeServidor} Revisá la configuración de Netlify Functions.`
        : mensajeServidor
    );
    error.stocks = datos.stocks;
    throw error;
  }
  return datos;
}
