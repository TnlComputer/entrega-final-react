import {Alert, Button} from 'react-bootstrap';
import {NavLink, Outlet, useLocation, useNavigate, useOutletContext} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {MODO_DEMO} from '../../services/adminApi';
import styles from './Admin.module.css';

function AdminLayout() {
  const {usuario, cerrarSesion} = useAuth();
  const contexto = useOutletContext();
  const navegar = useNavigate();
  const {pathname} = useLocation();

  const salir = async () => {
    await cerrarSesion();
    navegar('/', {replace: true});
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
      </nav>

      {MODO_DEMO && (
        <Alert variant="warning">
          <strong>Modo demostración.</strong> Podés recorrer los formularios de productos, rubros y anuncio, pero los
          cambios no se guardan.
        </Alert>
      )}

      {/* Se pasa el mismo contexto (catálogo y carrito) a las pantallas del panel */}
      <Outlet context={contexto} />
    </section>
  );
}

export default AdminLayout;
