// productos.json se pide una sola vez: la tienda (ItemListContainer), el carrito
// y el panel admin comparten la misma respuesta.
let pedido = null;

export function cargarProductos() {
  if (!pedido) {
    // no-store: después de editar en el panel queremos el archivo nuevo
    const nuevo = fetch(`${import.meta.env.BASE_URL}data/productos.json`, {cache: 'no-store'})
      .then(respuesta => {
        if (!respuesta.ok) {
          throw new Error('No se pudo obtener el catálogo');
        }

        return respuesta.json();
      })
      .then(datos => ({rubros: datos.rubros, productos: datos.productos}));

    // Si falla, el próximo intento lo vuelve a pedir
    nuevo.catch(() => {
      if (pedido === nuevo) pedido = null;
    });
    pedido = nuevo;
  }

  return pedido;
}

// El panel lo llama después de guardar, para que la tienda muestre lo nuevo
export function actualizarProductos(datos) {
  pedido = Promise.resolve(datos);
}
