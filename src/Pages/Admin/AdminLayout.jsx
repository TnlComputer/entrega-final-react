import {Button} from 'react-bootstrap';
import {NavLink, Outlet, useLocation, useNavigate, useOutletContext} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import styles from './Admin.module.css';

function AdminLayout() {
  const {usuario, cerrarSesion} = useAuth();
  const contexto = useOutletContext();
  const navegar = useNavigate();
  const {pathname} = useLocation();

  // Primero sale de /admin: si se cerrara antes la sesión, RutaPrivada mandaría a /login
  const salir = async () => {
    navegar('/', {replace: true});
    await cerrarSesion();
  };

  const claseTab = ({isActive}) => `${styles.tab} ${isActive ? styles.tabActiva : ''}`;
  // "Productos" también queda marcada al crear o editar uno
  const claseTabProductos = ({isActive}) => claseTab({isActive: isActive || pathname.startsWith('/admin/productos')});

  return (
    <section className={styles.adminPage}>
      <div className={styles.adminHeading}>
        <div>
          <span className="eyebrow">Panel de administración</span>
          <h2>Catálogo</h2>
          <p className={styles.usuario}>Sesión: {usuario.email}</p>
        </div>
        <Button variant="outline-dark" onClick={salir}>
          Cerrar sesión
        </Button>
      </div>

      <nav className={styles.tabs} aria-label="Secciones del panel">
        <NavLink to="/admin" end className={claseTabProductos}>
          Productos
        </NavLink>
        <NavLink to="/admin/rubros" className={claseTab}>
          Rubros
        </NavLink>
        <NavLink to="/admin/anuncio" className={claseTab}>
          Anuncio
        </NavLink>
        <NavLink to="/admin/envios" className={claseTab}>
          Envíos
        </NavLink>
      </nav>

      {/* Se pasa el mismo contexto (catálogo y carrito) a las pantallas del panel */}
      <Outlet context={contexto} />
    </section>
  );
}

export default AdminLayout;
