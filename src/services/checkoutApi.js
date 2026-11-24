import {obtenerToken} from './authApi';

export async function confirmarCompraSimulada(compra) {
  // La sesión solo hace falta para usar un cupón
  const token = compra.cupon ? await obtenerToken() : null;
  let respuesta;
  try {
    respuesta = await fetch('/api/compras', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...(token && {Authorization: `Bearer ${token}`})},
      body: JSON.stringify(compra)
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
