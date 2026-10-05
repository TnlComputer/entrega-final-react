import {useEffect, useState} from 'react';
import {prepararCatalogo} from '../../data/modeloCatalogo';
import {cargarProductos} from '../../services/productosApi';
import ItemList from '../ItemList/ItemList';
import styles from './ItemListContainer.module.css';

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

const CLAVE_FAVORITOS = 'favoritos';

function leerFavoritosGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || {};
  } catch {
    return {};
  }
}

function ItemListContainer({onAgregarAlCarrito}) {
  const [catalogo, setCatalogo] = useState({rubros: [], productos: []});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [favoritos, setFavoritos] = useState(leerFavoritosGuardados);

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

  useEffect(() => {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
  }, [favoritos]);

  const alternarFavorito = id => {
    setFavoritos(favoritosActuales => {
      const favoritosNuevos = {...favoritosActuales};
      if (favoritosNuevos[id]) {
        delete favoritosNuevos[id];
      } else {
        favoritosNuevos[id] = true;
      }
      return favoritosNuevos;
    });
  };

  // En la tienda solo se ven los activos
  const productos = prepararCatalogo(catalogo).productos.filter(producto => producto.activo);

  const termino = busqueda.trim().toLowerCase();
  const productosFiltrados = termino
    ? productos.filter(producto =>
        [producto.nombre, producto.descripcion, producto.subrubro, producto.rubroNombre, producto.marca]
          .join(' ')
          .toLowerCase()
          .includes(termino)
      )
    : productos;

  return (
    <section className={styles.searchSection} id="destacados">
      <div className={styles.sectionHeading}>
        <div>
          <span className="eyebrow">Armá tu equipo</span>
          <h3>{termino ? `Resultados para "${busqueda}"` : 'Para tu próxima salida'}</h3>
        </div>
        {!cargando && !error && (
          <span className={styles.availability}>
            {String(productosFiltrados.length).padStart(2, '0')} productos
            {termino ? ' encontrados' : ' destacados'}
          </span>
        )}
      </div>

      <label className={styles.searchBox} htmlFor="buscador-productos">
        <span aria-hidden="true">🔍</span>
        <input
          id="buscador-productos"
          type="search"
          placeholder="Buscá cañas, señuelos, anzuelos, indumentaria…"
          value={busqueda}
          onChange={evento => setBusqueda(evento.target.value)}
        />
        {termino && (
          <button type="button" aria-label="Limpiar búsqueda" onClick={() => setBusqueda('')}>
            ✕
          </button>
        )}
      </label>

      {cargando && <p>Cargando productos…</p>}
      {error && <p role="alert">No pudimos cargar el catálogo: {error}</p>}
      {!cargando && !error && productosFiltrados.length === 0 && (
        <p>No encontramos productos para "{busqueda}".</p>
      )}
      {!cargando && !error && productosFiltrados.length > 0 && (
        <ItemList
          productos={productosFiltrados}
          favoritos={favoritos}
          onAlternarFavorito={alternarFavorito}
          onAgregarAlCarrito={onAgregarAlCarrito}
          formatoPrecio={formatoPrecio}
        />
      )}
    </section>
  );
}

export default ItemListContainer;
