import {useEffect, useState} from 'react';
import {confirmarCompraSimulada} from '../services/checkoutApi';
import CartContext from './CartContext';

const CLAVE_CARRITO = 'carrito';
const DURACION_AVISO = 3000;

function leerCarritoGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || {};
  } catch {
    return {};
  }
}

function CartProvider({catalogo, children}) {
  const [carrito, setCarrito] = useState(leerCarritoGuardado);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [comprasConfirmadas, setComprasConfirmadas] = useState(0);
  const productos = catalogo?.productos ?? [];

  useEffect(() => {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  }, [carrito]);

  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(null), DURACION_AVISO);
    return () => clearTimeout(id);
  }, [aviso]);

  const agregarAlCarrito = (id, cantidad) => {
    const producto = productos.find(item => item.id === id);

    if (!producto || cantidad <= 0) {
      setAviso({tipo: 'error', mensaje: 'No pudimos agregar el producto: elegí una cantidad mayor a 0.'});
      return;
    }

    const yaEnCarrito = carrito[id] || 0;
    if (yaEnCarrito + cantidad > producto.stock) {
      const disponible = Math.max(0, producto.stock - yaEnCarrito);
      setAviso({
        tipo: 'error',
        mensaje:
          disponible > 0
            ? `Solo quedan ${disponible} unidades disponibles de ${producto.nombre}.`
            : `Ya tenés todo el stock de ${producto.nombre} en el carrito.`
      });
      return;
    }

    setCarrito(carritoActual => ({
      ...carritoActual,
      [id]: yaEnCarrito + cantidad
    }));
    setAviso({tipo: 'exito', mensaje: `Agregamos ${cantidad} × ${producto.nombre} al carrito.`});
  };

  const cantidadCarrito = Object.values(carrito).reduce((total, cantidad) => total + cantidad, 0);
  const productosEnCarrito = productos
    .filter(producto => carrito[producto.id])
    .map(producto => ({producto, cantidad: carrito[producto.id]}));

  const quitarDelCarrito = id => {
    setCarrito(carritoActual => {
      const carritoNuevo = {...carritoActual};
      delete carritoNuevo[id];
      return carritoNuevo;
    });
  };

  const cambiarCantidadCarrito = (id, cambio) => {
    const producto = productos.find(item => item.id === id);
    const cantidadNueva = (carrito[id] || 0) + cambio;

    if (cantidadNueva <= 0) {
      quitarDelCarrito(id);
      return;
    }

    if (producto && cantidadNueva > producto.stock) {
      setAviso({tipo: 'error', mensaje: `No hay más stock disponible de ${producto.nombre}.`});
      return;
    }

    setCarrito(carritoActual => ({...carritoActual, [id]: cantidadNueva}));
  };

  const actualizarStocks = stocks => catalogo?.actualizarStocks?.(stocks);

  const procesarCompraSimulada = async compra => {
    const resultado = await confirmarCompraSimulada(compra);
    actualizarStocks(resultado.stocks);
    setCarrito({});
    setComprasConfirmadas(total => total + 1);
    return resultado;
  };

  return (
    <CartContext.Provider
      value={{
        productosEnCarrito,
        cantidadCarrito,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidadCarrito,
        procesarCompraSimulada,
        actualizarStocks,
        comprasConfirmadas,
        mostrarCarrito,
        abrirCarrito: () => setMostrarCarrito(true),
        cerrarCarrito: () => setMostrarCarrito(false),
        aviso,
        cerrarAviso: () => setAviso(null)
      }}>
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
