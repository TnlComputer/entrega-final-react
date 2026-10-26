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
import useCarrito from '../../hooks/useCarrito';
import styles from './Layout.module.css';

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

function Layout({catalogo}) {
  const {aviso, cerrarAviso} = useCarrito();
  const anuncio = useAnuncio();
  const envios = useEnvios();

  return (
    <div className={styles.appLayout}>
      <BarraAnuncio anuncio={anuncio.anuncio} />
      <Header />
      <NavBar />

      <Notificacion aviso={aviso} onCerrar={cerrarAviso} />

      <main>
        <Outlet context={{catalogo, anuncio, envios}} />
      </main>

      <Footer />
      <CartModal
        formatoPrecio={formatoPrecio}
        descuento={descuentoVigente(anuncio.anuncio)}
        envios={envios}
      />
    </div>
  );
}

export default Layout;
