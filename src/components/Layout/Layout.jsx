import {useEffect, useState} from 'react';
import {Outlet} from 'react-router-dom';
import Header from './Header';
import NavBar from './NavBar';
import Footer from './Footer';
import BarraAnuncio from '../BarraAnuncio/BarraAnuncio';
import CartModal from '../Cart/CartModal';
import useAnuncio from '../../hooks/useAnuncio';
import useEnvios from '../../hooks/useEnvios';
import {descuentoVigente} from '../../data/modeloAnuncio';
import Notificacion from '../Notificacion/Notificacion';
import {confirmarCompraSimulada} from '../../services/checkoutApi';
import styles from './Layout.module.css';

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

const CLAVE_CARRITO = 'carrito';
const DURACION_AVISO = 3000;

function leerCarritoGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || {};
  } catch {
    return {};
  }
}

function Layout({productos = [], catalogo}) {
  const [carrito, setCarrito] = useState(leerCarritoGuardado);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [aviso, setAviso] = useState(null);
  const anuncio = useAnuncio();
  const envios = useEnvios();

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
      setCarrito(carritoActual => {
        const carritoNuevo = {...carritoActual};
        delete carritoNuevo[id];
        return carritoNuevo;
      });
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
    return resultado;
  };

  return (
    <div className={styles.appLayout}>
      <BarraAnuncio anuncio={anuncio.anuncio} />
      <Header cantidadCarrito={cantidadCarrito} onAbrirCarrito={() => setMostrarCarrito(true)} />
      <NavBar cantidadCarrito={cantidadCarrito} onAbrirCarrito={() => setMostrarCarrito(true)} />

      <Notificacion aviso={aviso} onCerrar={() => setAviso(null)} />

      <main>
        <Outlet context={{onAgregarAlCarrito: agregarAlCarrito, catalogo, anuncio, envios}} />
      </main>

      <Footer />
      <CartModal
        mostrar={mostrarCarrito}
        productos={productosEnCarrito}
        onCerrar={() => setMostrarCarrito(false)}
        onQuitar={quitarDelCarrito}
        onCambiarCantidad={cambiarCantidadCarrito}
        onPagoSimulado={procesarCompraSimulada}
        onActualizarStocks={actualizarStocks}
        formatoPrecio={formatoPrecio}
        descuento={descuentoVigente(anuncio.anuncio)}
        envios={envios}
      />
    </div>
  );
}

export default Layout;
