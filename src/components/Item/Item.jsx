import {useState} from 'react';
import {Button} from 'react-bootstrap';
import heroImage from '../../assets/hero.jpg';
import styles from './Item.module.css';

function Item({producto, esFavorito, onAlternarFavorito, onAgregarAlCarrito, formatoPrecio}) {
  const sinStock = producto.stock === 0;
  const [cantidad, setCantidad] = useState(sinStock ? 0 : 1);

  const alternarFavorito = () => onAlternarFavorito(producto.id);
  const cambiarCantidad = cambio =>
    setCantidad(cantidadActual => Math.min(producto.stock, Math.max(0, cantidadActual + cambio)));

  const etiquetaFavorito = `${esFavorito ? 'Quitar' : 'Agregar'} ${producto.nombre} ${esFavorito ? 'de' : 'a'} favoritos`;

  return (
    <article className={styles.productCard}>
      <div className={`${styles.productVisual} ${styles[producto.clase] ?? ''}`} tabIndex="0">
        <div className={styles.productVisualInner}>
          <div className={`${styles.productFace} ${styles.productFront}`}>
            <button
              className={`${styles.favoriteButton} ${esFavorito ? styles.isFavorite : ''}`}
              type="button"
              aria-label={etiquetaFavorito}
              aria-pressed={esFavorito}
              onClick={alternarFavorito}>
              {esFavorito ? '♥' : '♡'}
            </button>
            <img
              src={producto.imagen}
              alt={`Imagen de ${producto.nombre}`}
              loading="lazy"
              onError={event => {
                event.currentTarget.src = heroImage;
              }}
            />
            <span className={styles.flipHint}>Ver características ↻</span>
          </div>
          <div className={`${styles.productFace} ${styles.productBack}`}>
            <button
              className={`${styles.favoriteButton} ${styles.backFavorite} ${esFavorito ? styles.isFavorite : ''}`}
              type="button"
              aria-label={etiquetaFavorito}
              aria-pressed={esFavorito}
              onClick={alternarFavorito}>
              {esFavorito ? '♥' : '♡'}
            </button>
            <span className={styles.backLabel}>Ficha rápida</span>
            <h4>{producto.nombre}</h4>
            <ul>
              {producto.caracteristicas.map(caracteristica => (
                <li key={caracteristica}>{caracteristica}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className={styles.productInfo}>
        <div>
          <span>
            {producto.subrubro || producto.rubroNombre}
            {producto.marca && ` · ${producto.marca}`}
          </span>
          <h4>{producto.nombre}</h4>
          <p>{producto.descripcion}</p>
        </div>
        {producto.precioOferta ? (
          <div className={styles.precioOferta}>
            <del aria-label="Precio anterior">{formatoPrecio.format(producto.precio)}</del>
            <strong>{formatoPrecio.format(producto.precioOferta)}</strong>
          </div>
        ) : (
          <strong>{formatoPrecio.format(producto.precio)}</strong>
        )}
      </div>
      {sinStock ? (
        <p className={`${styles.stockHint} ${styles.stockAgotado}`}>Sin stock por el momento.</p>
      ) : (
        producto.stock <= 5 && <p className={styles.stockHint}>¡Últimas {producto.stock} unidades!</p>
      )}
      <div className={styles.productActions}>
        <div className={styles.quantityControl} aria-label={`Cantidad de ${producto.nombre}`}>
          <button
            type="button"
            aria-label={`Disminuir cantidad de ${producto.nombre}`}
            disabled={sinStock || cantidad === 0}
            onClick={() => cambiarCantidad(-1)}>
            −
          </button>
          <span>{cantidad}</span>
          <button
            type="button"
            aria-label={`Aumentar cantidad de ${producto.nombre}`}
            disabled={sinStock || cantidad >= producto.stock}
            onClick={() => cambiarCantidad(1)}>
            +
          </button>
        </div>
        <Button
          className={styles.addProduct}
          variant="dark"
          type="button"
          disabled={sinStock || cantidad === 0}
          onClick={() => onAgregarAlCarrito(producto.id, cantidad)}>
          {sinStock ? 'Sin stock' : 'Agregar'}
        </Button>
      </div>
    </article>
  );
}

export default Item;
