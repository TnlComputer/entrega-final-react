import Item from '../Item/Item';
import styles from './ItemList.module.css';

function ItemList({
  productos,
  favoritos,
  onAlternarFavorito,
  onAgregarAlCarrito,
  formatoPrecio,
  comprasConfirmadas = 0
}) {
  return (
    <div className={styles.productGrid}>
      {productos.map(producto => (
        <Item
          // Cambia con cada compra para reiniciar el contador
          key={`${producto.id}-${comprasConfirmadas}`}
          producto={producto}
          esFavorito={Boolean(favoritos[producto.id])}
          onAlternarFavorito={onAlternarFavorito}
          onAgregarAlCarrito={onAgregarAlCarrito}
          formatoPrecio={formatoPrecio}
        />
      ))}
    </div>
  );
}

export default ItemList;
