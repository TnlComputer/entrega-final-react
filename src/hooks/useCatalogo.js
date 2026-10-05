import {useEffect, useState} from 'react';
import {prepararCatalogo} from '../data/modeloCatalogo';
import {actualizarProductos, cargarProductos} from '../services/productosApi';

// Catálogo para el carrito y el panel admin (la tienda lo carga en ItemListContainer)
function useCatalogo() {
  const [catalogo, setCatalogo] = useState({rubros: [], productos: []});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    cargarProductos()
      .then(datos => {
        if (!cancelado) setCatalogo(datos);
      })
      .catch(errorCapturado => {
        if (!cancelado) setError(errorCapturado.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const {rubros, productos: todos} = prepararCatalogo(catalogo);

  return {
    rubros,
    // Para el panel: todos, incluso los ocultos
    todosLosProductos: todos,
    // Para el carrito: solo los activos
    productos: todos.filter(producto => producto.activo),
    cargando,
    error,
    // Lo usa el panel después de guardar en el JSON
    reemplazarCatalogo: datos => {
      actualizarProductos(datos);
      setCatalogo(datos);
    }
  };
}

export default useCatalogo;
