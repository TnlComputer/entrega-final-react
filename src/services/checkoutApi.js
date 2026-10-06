export async function confirmarCompraSimulada(compra) {
  let respuesta;
  try {
    respuesta = await fetch('/api/compras', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(compra)
    });
  } catch (error) {
    throw new Error('No hay conexión con el servidor para confirmar el stock.', {cause: error});
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(datos.error || 'No se pudo confirmar la compra simulada.');
    error.stocks = datos.stocks;
    throw error;
  }
  return datos;
}
