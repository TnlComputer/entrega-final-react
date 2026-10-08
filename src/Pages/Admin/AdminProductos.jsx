import {useState} from 'react';
import {Alert, Badge, Button, Form, Table} from 'react-bootstrap';
import {Link, useLocation} from 'react-router-dom';
import {urlImagen} from '../../data/modeloCatalogo';
import useAdminCatalogo from '../../hooks/useAdminCatalogo';
import styles from './Admin.module.css';

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

const FILTROS_ESTADO = {
  todos: {nombre: 'Todos', cumple: () => true},
  activos: {nombre: 'Visibles', cumple: producto => producto.activo},
  ocultos: {nombre: 'Ocultos', cumple: producto => !producto.activo},
  destacados: {nombre: 'Destacados', cumple: producto => producto.destacado},
  oferta: {nombre: 'En oferta', cumple: producto => producto.precioOferta !== null},
  pocoStock: {nombre: 'Stock bajo (≤ 5)', cumple: producto => producto.stock <= 5}
};

const ORDENES = {
  catalogo: {nombre: 'Como en la tienda', comparar: null},
  nombre: {nombre: 'Nombre (A-Z)', comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es')},
  precioAsc: {nombre: 'Precio: menor a mayor', comparar: (a, b) => a.precio - b.precio},
  precioDesc: {nombre: 'Precio: mayor a menor', comparar: (a, b) => b.precio - a.precio},
  stock: {nombre: 'Stock: menor a mayor', comparar: (a, b) => a.stock - b.stock},
  recientes: {
    nombre: 'Últimos modificados',
    comparar: (a, b) => (b.actualizadoEn ?? '').localeCompare(a.actualizadoEn ?? '')
  }
};

function AdminProductos() {
  const {rubros, productos, cargando, error, cambiarVisibilidad, eliminarProducto} = useAdminCatalogo();
  const ubicacion = useLocation();

  const [busqueda, setBusqueda] = useState('');
  const [rubro, setRubro] = useState('');
  const [estado, setEstado] = useState('todos');
  const [orden, setOrden] = useState('catalogo');
  const [aviso, setAviso] = useState(ubicacion.state?.aviso ?? null);
  const [ocupado, setOcupado] = useState(null);

  if (cargando) return <p>Cargando catálogo…</p>;
  if (error) return <Alert variant="danger">No pudimos cargar el catálogo: {error}</Alert>;

  const termino = busqueda.trim().toLowerCase();
  const filtrados = productos.filter(
    producto =>
      (!rubro || producto.rubro === rubro) &&
      FILTROS_ESTADO[estado].cumple(producto) &&
      (!termino ||
        [producto.nombre, producto.marca, producto.sku, producto.subrubro].join(' ').toLowerCase().includes(termino))
  );
  const comparar = ORDENES[orden].comparar;
  const lista = comparar ? [...filtrados].sort(comparar) : filtrados;

  const ejecutar = async (id, accion, mensajeExito) => {
    setOcupado(id);
    setAviso(null);
    try {
      await accion();
      setAviso({tipo: 'success', texto: mensajeExito});
    } catch (errorCapturado) {
      setAviso({tipo: 'danger', texto: errorCapturado.message});
    } finally {
      setOcupado(null);
    }
  };

  const alternar = producto =>
    ejecutar(
      producto.id,
      () => cambiarVisibilidad(producto.id),
      `"${producto.nombre}" ahora está ${producto.activo ? 'oculto en la tienda' : 'visible en la tienda'}.`
    );

  const borrar = producto => {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? No se puede deshacer.\n\nSi solo querés sacarlo de la tienda, usá "Ocultar".`)) {
      return;
    }
    ejecutar(producto.id, () => eliminarProducto(producto.id), `Eliminamos "${producto.nombre}".`);
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <p className={styles.resumen}>
          {lista.length} de {productos.length} productos
        </p>
        <Button as={Link} to="/admin/productos/nuevo" variant="dark">
          + Nuevo producto
        </Button>
      </div>

      {aviso && (
        <Alert variant={aviso.tipo} dismissible onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      <div className={styles.filtros}>
        <Form.Control
          type="search"
          placeholder="Buscar por nombre, marca o código…"
          aria-label="Buscar productos"
          value={busqueda}
          onChange={evento => setBusqueda(evento.target.value)}
        />
        <Form.Select aria-label="Filtrar por rubro" value={rubro} onChange={evento => setRubro(evento.target.value)}>
          <option value="">Todos los rubros</option>
          {rubros.map(opcion => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.nombre}
            </option>
          ))}
        </Form.Select>
        <Form.Select aria-label="Filtrar por estado" value={estado} onChange={evento => setEstado(evento.target.value)}>
          {Object.entries(FILTROS_ESTADO).map(([clave, filtro]) => (
            <option key={clave} value={clave}>
              {filtro.nombre}
            </option>
          ))}
        </Form.Select>
        <Form.Select aria-label="Ordenar" value={orden} onChange={evento => setOrden(evento.target.value)}>
          {Object.entries(ORDENES).map(([clave, opcion]) => (
            <option key={clave} value={clave}>
              {opcion.nombre}
            </option>
          ))}
        </Form.Select>
      </div>

      {lista.length === 0 ? (
        <p className={styles.vacio}>No hay productos con estos filtros.</p>
      ) : (
        <Table responsive hover className={styles.tabla}>
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Rubro</th>
              <th scope="col" className="text-end">
                Precio
              </th>
              <th scope="col" className="text-end">
                Stock
              </th>
              <th scope="col">Estado</th>
              <th scope="col" className="text-end">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map(producto => (
              <tr key={producto.id} className={producto.activo ? '' : styles.filaOculta}>
                <td>
                  <div className={styles.celdaProducto}>
                    <img src={urlImagen(producto.imagen, 160)} alt="" loading="lazy" />
                    <div>
                      <strong>{producto.nombre}</strong>
                      <small>
                        {[producto.marca, producto.sku && `Cód. ${producto.sku}`].filter(Boolean).join(' · ') || '—'}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  {producto.rubroNombre}
                  <small className="d-block text-muted">{producto.subrubro}</small>
                </td>
                <td className="text-end text-nowrap">
                  {producto.precioOferta !== null ? (
                    <>
                      <del className="d-block text-muted small">{formatoPrecio.format(producto.precio)}</del>
                      {formatoPrecio.format(producto.precioOferta)}
                    </>
                  ) : (
                    formatoPrecio.format(producto.precio)
                  )}
                </td>
                <td className={`text-end ${producto.stock <= 5 ? styles.stockBajo : ''}`}>{producto.stock}</td>
                <td>
                  <div className={styles.estados}>
                    {producto.activo ? <Badge bg="success">Visible</Badge> : <Badge bg="secondary">Oculto</Badge>}
                    {producto.destacado && (
                      <Badge bg="warning" text="dark">
                        Destacado
                      </Badge>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.acciones}>
                    <Button as={Link} to={`/admin/productos/${producto.id}`} size="sm" variant="outline-dark">
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      disabled={ocupado !== null}
                      onClick={() => alternar(producto)}>
                      {producto.activo ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={ocupado !== null}
                      aria-label={`Eliminar ${producto.nombre}`}
                      onClick={() => borrar(producto)}>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default AdminProductos;
