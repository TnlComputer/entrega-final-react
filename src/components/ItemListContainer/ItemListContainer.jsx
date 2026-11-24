import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ofertaVigente} from '../../data/modeloCatalogo';
import useFavoritos from '../../hooks/useFavoritos';
import ItemList from '../ItemList/ItemList';
import styles from './ItemListContainer.module.css';

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

const PRODUCTOS_POR_PAGINA = 12;

// Secciones del inicio
const SECCIONES = {
  ofertas: {
    detalle: 'Precios rebajados',
    titulo: 'Productos en oferta',
    contador: 'productos en oferta',
    vacio: 'No hay ofertas por el momento.',
    filtro: producto => ofertaVigente(producto)
  },
  destacados: {
    detalle: 'Armá tu equipo',
    titulo: 'Para tu próxima salida',
    contador: 'productos destacados',
    vacio: 'No hay productos destacados por el momento.',
    filtro: producto => producto.destacado
  }
};

const conCeros = numero => String(numero).padStart(2, '0');

function ItemListContainer({catalogo, seccion = null}) {
  const [busqueda, setBusqueda] = useState('');
  const {favoritos, alternarFavorito} = useFavoritos();
  const [rubroElegido, setRubroElegido] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const listaRef = useRef(null);

  const {rubros: todosLosRubros = [], productos = [], cargando, error} = catalogo;
  const rubros = todosLosRubros.filter(rubro => productos.some(producto => producto.rubro === rubro.id));

  const termino = busqueda.trim().toLowerCase();
  const productosFiltrados = productos.filter(
    producto =>
      (rubroElegido === 'todos' || producto.rubro === rubroElegido) &&
      [producto.nombre, producto.descripcion, producto.subrubro, producto.rubroNombre, producto.marca]
        .join(' ')
        .toLowerCase()
        .includes(termino)
  );

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const productosDeLaPagina = productosFiltrados.slice(
    (paginaActual - 1) * PRODUCTOS_POR_PAGINA,
    paginaActual * PRODUCTOS_POR_PAGINA
  );

  const buscar = texto => {
    setBusqueda(texto);
    setPagina(1);
  };

  const elegirRubro = id => {
    setRubroElegido(id);
    setPagina(1);
  };

  const irAPagina = numero => {
    setPagina(numero);
    listaRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  const propsLista = {
    favoritos,
    onAlternarFavorito: alternarFavorito,
    formatoPrecio
  };

  const buscador = (
    <label className={styles.searchBox} htmlFor="buscador-productos">
      <span aria-hidden="true">🔍</span>
      <input
        id="buscador-productos"
        type="search"
        name="buscar-productos"
        autoComplete="off"
        placeholder="Buscá cañas, señuelos, anzuelos, indumentaria…"
        value={busqueda}
        onChange={evento => buscar(evento.target.value)}
      />
      {termino && (
        <button type="button" aria-label="Limpiar búsqueda" onClick={() => buscar('')}>
          ✕
        </button>
      )}
    </label>
  );

  const resultados = (
    <>
      {productosFiltrados.length === 0 ? (
        <p>No encontramos productos{termino && ` para "${busqueda}"`}.</p>
      ) : (
        <ItemList productos={productosDeLaPagina} {...propsLista} />
      )}

      {totalPaginas > 1 && (
        <nav className={styles.paginacion} aria-label="Páginas del catálogo">
          <button type="button" disabled={paginaActual === 1} onClick={() => irAPagina(paginaActual - 1)}>
            ‹ Anterior
          </button>
          {Array.from({length: totalPaginas}, (_, i) => i + 1).map(numero => (
            <button
              key={numero}
              type="button"
              className={numero === paginaActual ? styles.activo : ''}
              aria-current={numero === paginaActual ? 'page' : undefined}
              onClick={() => irAPagina(numero)}>
              {numero}
            </button>
          ))}
          <button type="button" disabled={paginaActual === totalPaginas} onClick={() => irAPagina(paginaActual + 1)}>
            Siguiente ›
          </button>
        </nav>
      )}
    </>
  );

  const estadoCarga = (
    <>
      {cargando && <p>Cargando productos…</p>}
      {error && <p role="alert">No pudimos cargar el catálogo: {error}</p>}
    </>
  );

  if (seccion) {
    const {detalle, titulo, contador, vacio, filtro} = SECCIONES[seccion];
    const elegidos = productos.filter(filtro);

    return (
      <section className={styles.searchSection} id={seccion}>
        <div className={styles.sectionHeading}>
          <div>
            <span className="eyebrow">{detalle}</span>
            <h3>{titulo}</h3>
          </div>
          {!cargando && !error && (
            <span className={styles.availability}>{conCeros(elegidos.length)} {contador}</span>
          )}
        </div>

        {estadoCarga}

        {!cargando && !error && elegidos.length === 0 && <p>{vacio}</p>}
        {!cargando && !error && <ItemList productos={elegidos} {...propsLista} />}

        {seccion === 'destacados' && (
          <div className={styles.verTodos}>
            <Link to="/productos">Ver catálogo completo →</Link>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={styles.searchSection} id="catalogo">
      <div className={styles.sectionHeading}>
        <div>
          <span className="eyebrow">Catálogo</span>
          <h3>{termino ? `Resultados para "${busqueda}"` : 'Todos los productos'}</h3>
        </div>
        {!cargando && !error && (
          <span className={styles.availability}>
            {conCeros(productosFiltrados.length)} productos{(termino || rubroElegido !== 'todos') && ' encontrados'}
          </span>
        )}
      </div>

      {buscador}
      {estadoCarga}

      {!cargando && !error && (
        <div className={styles.bloque} ref={listaRef}>
          <div className={styles.filtros} role="group" aria-label="Filtrar por rubro">
            {[{id: 'todos', nombre: 'Todos'}, ...rubros].map(rubro => (
              <button
                key={rubro.id}
                type="button"
                className={rubro.id === rubroElegido ? styles.activo : ''}
                aria-pressed={rubro.id === rubroElegido}
                onClick={() => elegirRubro(rubro.id)}>
                {rubro.nombre}
              </button>
            ))}
          </div>

          {resultados}
        </div>
      )}
    </section>
  );
}

export default ItemListContainer;
