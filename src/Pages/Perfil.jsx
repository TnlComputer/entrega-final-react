import {Alert, Badge, Button, Table} from 'react-bootstrap';
import {Link, useNavigate} from 'react-router-dom';
import {estadoCupon, fechaHora} from '../data/modeloCupones';
import useAuth from '../hooks/useAuth';
import useCupones from '../hooks/useCupones';
import adminStyles from './Admin/Admin.module.css';

const COLORES_ESTADO = {activo: 'success', usado: 'primary', vencido: 'secondary'};
const NOMBRES_ESTADO = {activo: 'Disponible', usado: 'Usado', vencido: 'Vencido'};

function Perfil() {
  const {usuario, esAdmin, cerrarSesion} = useAuth();
  const {cupones, ahora, cargando, error} = useCupones();
  const navegar = useNavigate();

  // Primero sale del perfil para no caer en /login
  const salir = async () => {
    navegar('/', {replace: true});
    await cerrarSesion();
  };

  return (
    <section className={adminStyles.adminPage}>
      <div className={adminStyles.adminHeading}>
        <div>
          <span className="eyebrow">Mi cuenta</span>
          <h2>Hola, {usuario.nombre}</h2>
          <p className={adminStyles.usuario}>{usuario.email}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {esAdmin && (
            <Button as={Link} to="/admin" variant="dark">
              Administración
            </Button>
          )}
          <Button variant="outline-dark" onClick={salir}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      <h3 className={adminStyles.tituloFormulario}>Mis cupones</h3>
      {cargando && <p>Cargando cupones…</p>}
      {error && <Alert variant="danger">No pudimos cargar tus cupones: {error}</Alert>}
      {!cargando && !error && cupones.length === 0 && (
        <p className={adminStyles.vacio}>Todavía no tenés cupones. ¡Seguí visitándonos!</p>
      )}
      {cupones.length > 0 && (
        <Table responsive hover className={`${adminStyles.tabla} mt-3`}>
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Descuento</th>
              <th scope="col">Vence</th>
              <th scope="col">Estado</th>
              <th scope="col">Usado el</th>
            </tr>
          </thead>
          <tbody>
            {cupones.map(cupon => {
              const estado = estadoCupon(cupon, ahora);
              return (
                <tr key={cupon.codigo}>
                  <td>
                    <strong>{cupon.codigo}</strong>
                  </td>
                  <td>{cupon.porcentaje}%</td>
                  <td className="text-nowrap">{fechaHora(cupon.venceEn)}</td>
                  <td>
                    <Badge bg={COLORES_ESTADO[estado]}>{NOMBRES_ESTADO[estado]}</Badge>
                  </td>
                  <td className="text-nowrap">{cupon.usadoEn ? fechaHora(cupon.usadoEn) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </section>
  );
}

export default Perfil;
