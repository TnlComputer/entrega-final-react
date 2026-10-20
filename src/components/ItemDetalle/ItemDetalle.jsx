import {useState} from 'react';
import {Button} from 'react-bootstrap';
import {Link, useOutletContext, useParams} from 'react-router-dom';
import heroImage from '../../assets/hero.jpg';
import {urlImagen} from '../../data/modeloCatalogo';
import useFavoritos from '../../hooks/useFavoritos';
import styles from './ItemDetalle.module.css';

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

function ItemDetalle() {
  const {id} = useParams();
  const {catalogo, onAgregarAlCarrito} = useOutletContext();
  const {productos = [], cargando, error} = catalogo;
  const [cantidad, setCantidad] = useState(1);
  const {favoritos, alternarFavorito} = useFavoritos();

  if (cargando) {
    return <p className={styles.mensaje}>Cargando producto…</p>;
  }

  if (error) {
    return <p className={styles.mensaje} role="alert">Error: {error}</p>;
  }

  // useParams siempre trae texto y los ids son números
  const producto = productos.find(item => String(item.id) === id);

  if (!producto) {
    return (
      <div className={styles.mensaje}>
        <p>No encontramos este producto.</p>
        <Link to="/productos">Volver a Productos</Link>
      </div>
    );
  }

  const sinStock = producto.stock === 0;
  const esFavorito = Boolean(favoritos[producto.id]);
  const cambiarCantidad = cambio =>
    setCantidad(cantidadActual => Math.min(producto.stock, Math.max(1, cantidadActual + cambio)));

  return (
    <section className={styles.detalle}>
      <Link className={styles.volver} to="/productos">
        ← Volver a Productos
      </Link>

      <div className={styles.card}>
        <div className={styles.imagenCaja}>
          <button
            className={`${styles.favorito} ${esFavorito ? styles.esFavorito : ''}`}
            type="button"
            aria-label={`${esFavorito ? 'Quitar' : 'Agregar'} ${producto.nombre} ${esFavorito ? 'de' : 'a'} favoritos`}
            aria-pressed={esFavorito}
            onClick={() => alternarFavorito(producto.id)}>
            {esFavorito ? '♥' : '♡'}
          </button>
          <img
            src={urlImagen(producto.imagen, 900)}
            alt={`Imagen de ${producto.nombre}`}
            onError={event => {
              event.currentTarget.src = heroImage;
            }}
          />
        </div>

        <div className={styles.info}>
          <span className={styles.categoria}>
            {producto.subrubro || producto.rubroNombre}
            {producto.marca && ` · ${producto.marca}`}
          </span>
          <h2>{producto.nombre}</h2>
          <p className={styles.descripcion}>{producto.descripcion}</p>

          {producto.caracteristicas.length > 0 && (
            <ul className={styles.caracteristicas}>
              {producto.caracteristicas.map(caracteristica => (
                <li key={caracteristica}>{caracteristica}</li>
              ))}
            </ul>
          )}

          <div className={styles.precio}>
            {producto.precioOferta ? (
              <>
                <del aria-label="Precio anterior">{formatoPrecio.format(producto.precio)}</del>
                <strong className={styles.oferta}>{formatoPrecio.format(producto.precioOferta)}</strong>
              </>
            ) : (
              <strong>{formatoPrecio.format(producto.precio)}</strong>
            )}
          </div>

          {sinStock ? (
            <p className={styles.agotado}>Sin stock por el momento.</p>
          ) : (
            producto.stock <= 5 && <p className={styles.stock}>¡Últimas {producto.stock} unidades!</p>
          )}

          <div className={styles.acciones}>
            <div className={styles.cantidad} aria-label={`Cantidad de ${producto.nombre}`}>
              <button
                type="button"
                aria-label="Disminuir cantidad"
                disabled={sinStock || cantidad <= 1}
                onClick={() => cambiarCantidad(-1)}>
                −
              </button>
              <span>{sinStock ? 0 : cantidad}</span>
              <button
                type="button"
                aria-label="Aumentar cantidad"
                disabled={sinStock || cantidad >= producto.stock}
                onClick={() => cambiarCantidad(1)}>
                +
              </button>
            </div>
            <Button
              className={styles.agregar}
              variant="dark"
              type="button"
              disabled={sinStock}
              onClick={() => onAgregarAlCarrito(producto.id, cantidad)}>
              {sinStock ? 'Sin stock' : 'Agregar al carrito'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ItemDetalle;
