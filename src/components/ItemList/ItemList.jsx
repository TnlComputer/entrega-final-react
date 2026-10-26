import useCarrito from '../../hooks/useCarrito';
import Item from '../Item/Item';
import styles from './ItemList.module.css';

function ItemList({productos, favoritos, onAlternarFavorito, formatoPrecio}) {
  const {comprasConfirmadas} = useCarrito();

  return (
    <div className={styles.productGrid}>
      {productos.map(producto => (
        <Item
          // Cambia con cada compra para reiniciar el contador
          key={`${producto.id}-${comprasConfirmadas}`}
          producto={producto}
          esFavorito={Boolean(favoritos[producto.id])}
          onAlternarFavorito={onAlternarFavorito}
          formatoPrecio={formatoPrecio}
        />
      ))}
    </div>
  );
}

export default ItemList;
