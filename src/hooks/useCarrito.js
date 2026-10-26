import {useContext} from 'react';
import CartContext from '../context/CartContext';

function useCarrito() {
  const contexto = useContext(CartContext);

  if (!contexto) {
    throw new Error('useCarrito tiene que usarse dentro de <CartProvider>');
  }

  return contexto;
}

export default useCarrito;
