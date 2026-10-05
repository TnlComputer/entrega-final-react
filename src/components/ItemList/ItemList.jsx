import Item from '../Item/Item';
import styles from './ItemList.module.css';

function ItemList({productos, favoritos, onAlternarFavorito, onAgregarAlCarrito, formatoPrecio}) {
  return (
    <div className={styles.productGrid}>
      {productos.map(producto => (
        <Item
          key={producto.id}
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
