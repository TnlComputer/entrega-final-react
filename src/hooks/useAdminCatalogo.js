import {useOutletContext} from 'react-router-dom';
import {crearSlug} from '../data/modeloCatalogo';
import {guardarCatalogo} from '../services/adminApi';

// Solo los campos que se guardan (sin rubroNombre ni otros agregados de la tienda)
const CAMPOS_PRODUCTO = [
  'id', 'nombre', 'marca', 'sku', 'descripcion', 'caracteristicas', 'rubro', 'subrubro',
  'precio', 'precioOferta', 'stock', 'imagen', 'clase', 'destacado', 'activo', 'orden', 'actualizadoEn'
];
const limpiarProducto = producto => Object.fromEntries(CAMPOS_PRODUCTO.map(campo => [campo, producto[campo] ?? null]));

function useAdminCatalogo() {
  const {catalogo} = useOutletContext();
  const {rubros, todosLosProductos: productos, cargando, error, reemplazarCatalogo} = catalogo;

  // Guarda el catálogo en Firestore y, si salió bien, actualiza la tienda
  const guardar = async (nuevosRubros, nuevosProductos) => {
    const datos = {rubros: nuevosRubros, productos: nuevosProductos.map(limpiarProducto)};
    await guardarCatalogo(datos);
    reemplazarCatalogo(datos);
  };

  const guardarProducto = async (datos, id = null) => {
    const ahora = new Date().toISOString();

    if (id === null) {
      const nuevoId = Math.max(0, ...productos.map(producto => producto.id)) + 1;
      await guardar(rubros, [...productos, {...datos, id: nuevoId, actualizadoEn: ahora}]);
      return nuevoId;
    }

    await guardar(
      rubros,
      productos.map(producto => (producto.id === id ? {...datos, id, actualizadoEn: ahora} : producto))
    );
    return id;
  };

  const cambiarVisibilidad = id =>
    guardar(
      rubros,
      productos.map(producto => (producto.id === id ? {...producto, activo: !producto.activo} : producto))
    );

  const eliminarProducto = id => guardar(rubros, productos.filter(producto => producto.id !== id));

  const guardarRubro = async (datos, id = null) => {
    if (id === null) {
      await guardar([...rubros, {...datos, id: crearSlug(datos.nombre)}], productos);
      return;
    }

    const nuevosRubros = rubros.map(rubro => (rubro.id === id ? {...datos, id} : rubro));

    // Si el rubro se queda sin subrubros, sus productos pasan a no tener subrubro
    if (datos.subrubros.length === 0) {
      await guardar(
        nuevosRubros,
        productos.map(producto => (producto.rubro === id ? {...producto, subrubro: ''} : producto))
      );
      return;
    }

    // Si se quitó un subrubro en uso, los productos quedarían huérfanos: se avisa antes
    const enUso = productos.filter(
      producto => producto.rubro === id && producto.subrubro && !datos.subrubros.includes(producto.subrubro)
    );
    if (enUso.length) {
      const subrubros = [...new Set(enUso.map(producto => producto.subrubro))].join(', ');
      throw new Error(`No podés quitar "${subrubros}": lo usan ${enUso.length} producto(s). Cambiales el subrubro primero.`);
    }

    // Si el rubro recién ahora tiene subrubros, sus productos toman el primero
    const primero = datos.subrubros[0];
    const sinSubrubro = productos.filter(producto => producto.rubro === id && !producto.subrubro).length;
    await guardar(
      nuevosRubros,
      productos.map(producto => (producto.rubro === id && !producto.subrubro ? {...producto, subrubro: primero} : producto))
    );
    return sinSubrubro ? `${sinSubrubro} producto(s) quedaron en "${primero}". Podés cambiarlos desde Productos.` : null;
  };

  const eliminarRubro = async id => {
    const enUso = productos.filter(producto => producto.rubro === id).length;
    if (enUso) throw new Error(`Este rubro tiene ${enUso} producto(s). Movelos a otro rubro antes de borrarlo.`);
    await guardar(rubros.filter(rubro => rubro.id !== id), productos);
  };

  return {
    rubros,
    productos,
    cargando,
    error,
    guardarProducto,
    cambiarVisibilidad,
    eliminarProducto,
    guardarRubro,
    eliminarRubro
  };
}

export default useAdminCatalogo;
