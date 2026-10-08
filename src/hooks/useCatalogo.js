import {useEffect, useRef, useState} from 'react';
import {collection, onSnapshot} from 'firebase/firestore';
import {prepararCatalogo} from '../data/modeloCatalogo';
import {db} from '../services/firebase';
import {actualizarProductos, cargarProductos} from '../services/productosApi';

function useCatalogo() {
  const [catalogo, setCatalogo] = useState({rubros: [], productos: []});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const catalogoRef = useRef(catalogo);

  useEffect(() => {
    let cancelado = false;
    let dejarDeObservar = () => {};

    cargarProductos()
      .then(datos => {
        if (cancelado) return;
        catalogoRef.current = datos;
        setCatalogo(datos);
        dejarDeObservar = onSnapshot(
          collection(db, 'productos'),
          snapshot => {
            const productos = snapshot.docs.map(documento => {
              const dato = documento.data();
              return {...dato, id: dato.id ?? documento.id};
            });
            const catalogoActualizado = {...catalogoRef.current, productos};
            catalogoRef.current = catalogoActualizado;
            actualizarProductos(catalogoActualizado);
            setCatalogo(catalogoActualizado);
          },
          errorCapturado => setError(`No se pudo actualizar el stock: ${errorCapturado.message}`)
        );
      })
      .catch(errorCapturado => {
        if (!cancelado) setError(errorCapturado.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
      dejarDeObservar();
    };
  }, []);

  const {rubros, productos: todos} = prepararCatalogo(catalogo);

  return {
    rubros,
    // Todos, incluso los ocultos
    todosLosProductos: todos,
    // Solo los activos
    productos: todos.filter(producto => producto.activo),
    cargando,
    error,
    // Se usa al guardar en el panel
    reemplazarCatalogo: datos => {
      catalogoRef.current = datos;
      actualizarProductos(datos);
      setCatalogo(datos);
    },
    actualizarStocks: stocks => {
      const stocksPorId = new Map(stocks.map(item => [String(item.id), item.stock]));
      const datos = {
        ...catalogoRef.current,
        productos: catalogoRef.current.productos.map(producto =>
          stocksPorId.has(String(producto.id))
            ? {...producto, stock: stocksPorId.get(String(producto.id))}
            : producto
        )
      };
      catalogoRef.current = datos;
      actualizarProductos(datos);
      setCatalogo(datos);
    }
  };
}

export default useCatalogo;
