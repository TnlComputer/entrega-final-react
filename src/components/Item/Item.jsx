import {useState} from 'react';
import {Button} from 'react-bootstrap';
import heroImage from '../../assets/hero.jpg';
import {urlImagen} from '../../data/modeloCatalogo';
import styles from './Item.module.css';

function Item({producto, esFavorito, onAlternarFavorito, onAgregarAlCarrito, formatoPrecio}) {
  const sinStock = producto.stock === 0;
  const [cantidad, setCantidad] = useState(sinStock ? 0 : 1);
  // Gira solo desde "Ver características"
  const [volteada, setVolteada] = useState(false);

  const alternarFavorito = () => onAlternarFavorito(producto.id);
  const cambiarCantidad = cambio =>
    setCantidad(cantidadActual => Math.min(producto.stock, Math.max(0, cantidadActual + cambio)));

  const etiquetaFavorito = `${esFavorito ? 'Quitar' : 'Agregar'} ${producto.nombre} ${esFavorito ? 'de' : 'a'} favoritos`;

  return (
    <article className={styles.productCard}>
      <div
        className={`${styles.productVisual} ${styles[producto.clase] ?? ''} ${volteada ? styles.isFlipped : ''}`}
        onMouseLeave={() => setVolteada(false)}>
        <div className={styles.productVisualInner}>
          <div className={`${styles.productFace} ${styles.productFront}`} inert={volteada}>
            <button
              className={`${styles.favoriteButton} ${esFavorito ? styles.isFavorite : ''}`}
              type="button"
              aria-label={etiquetaFavorito}
              aria-pressed={esFavorito}
              onClick={alternarFavorito}>
              {esFavorito ? '♥' : '♡'}
            </button>
            {producto.destacado && <span className={styles.destacado}>★ Destacado</span>}
            <img
              src={urlImagen(producto.imagen)}
              alt={`Imagen de ${producto.nombre}`}
              loading="lazy"
              onError={event => {
                event.currentTarget.src = heroImage;
              }}
            />
            <button
              className={styles.flipHint}
              type="button"
              onMouseEnter={() => setVolteada(true)}
              onClick={() => setVolteada(true)}>
              Ver características ↻
            </button>
          </div>
          <div className={`${styles.productFace} ${styles.productBack}`} inert={!volteada}>
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
            <button className={styles.flipHint} type="button" onClick={() => setVolteada(false)}>
              Volver ↺
            </button>
          </div>
        </div>
      </div>
      <div className={styles.productInfo}>
        <span className={styles.productCategoria}>
          {producto.subrubro || producto.rubroNombre}
          {producto.marca && ` · ${producto.marca}`}
        </span>
        <h4 title={producto.nombre}>{producto.nombre}</h4>
        <p className={styles.productDescripcion}>{producto.descripcion}</p>
        <div className={styles.productPrecioFila}>
          {sinStock ? (
            <p className={`${styles.stockHint} ${styles.stockAgotado}`}>Sin stock por el momento.</p>
          ) : producto.stock <= 5 ? (
            <p className={styles.stockHint}>¡Últimas {producto.stock} unidades!</p>
          ) : (
            <span />
          )}
          {producto.precioOferta ? (
            <div className={styles.precioOferta}>
              <del aria-label="Precio anterior">{formatoPrecio.format(producto.precio)}</del>
              <strong>{formatoPrecio.format(producto.precioOferta)}</strong>
            </div>
          ) : (
            <strong>{formatoPrecio.format(producto.precio)}</strong>
          )}
        </div>
      </div>
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
