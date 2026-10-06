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
          // La key cambia tras cada compra: la card se recrea con el contador en 1 (o 0 sin stock)
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
