import {useState} from 'react';
import {Alert, Badge, Button, Form, Table} from 'react-bootstrap';
import {Trash3} from 'react-bootstrap-icons';
import {fechaHora} from '../../data/modeloCupones';
import useAdminUsuarios from '../../hooks/useAdminUsuarios';
import styles from './Admin.module.css';

function AdminUsuarios() {
  const {usuarios, cargando, error, eliminarUsuario} = useAdminUsuarios();
  const [busqueda, setBusqueda] = useState('');
  const [aviso, setAviso] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  if (cargando) return <p>Cargando usuarios…</p>;
  if (error) return <Alert variant="danger">No pudimos cargar los usuarios: {error}</Alert>;

  const termino = busqueda.trim().toLowerCase();
  const lista = usuarios.filter(usuario => `${usuario.nombre} ${usuario.email}`.toLowerCase().includes(termino));

  const borrar = async usuario => {
    if (!window.confirm(`¿Eliminar a ${usuario.nombre} (${usuario.email})? No se puede deshacer.`)) return;
    setOcupado(true);
    setAviso(null);
    try {
      await eliminarUsuario(usuario.uid);
      setAviso({tipo: 'success', texto: `Eliminamos a ${usuario.nombre}.`});
    } catch (errorCapturado) {
      setAviso({tipo: 'danger', texto: errorCapturado.message});
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div>
      <p className={`${styles.resumen} mb-3`}>
        {lista.length} de {usuarios.length} usuarios
      </p>

      {aviso && (
        <Alert variant={aviso.tipo} dismissible onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      <div className={styles.filtros}>
        <Form.Control
          type="search"
          placeholder="Buscar por nombre o email…"
          aria-label="Buscar usuarios"
          value={busqueda}
          onChange={evento => setBusqueda(evento.target.value)}
        />
      </div>

      {lista.length === 0 ? (
        <p className={styles.vacio}>No hay usuarios para mostrar.</p>
      ) : (
        <Table responsive hover className={styles.tabla}>
          <thead>
            <tr>
              <th scope="col">Usuario</th>
              <th scope="col">Rol</th>
              <th scope="col">Alta</th>
              <th scope="col">Último ingreso</th>
              <th scope="col" className="text-end">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map(usuario => (
              <tr key={usuario.uid}>
                <td>
                  <strong>{usuario.nombre}</strong>
                  <small className="d-block text-muted">{usuario.email}</small>
                </td>
                <td>
                  <Badge bg={usuario.esAdmin ? 'dark' : 'success'}>{usuario.esAdmin ? 'Admin' : 'Cliente'}</Badge>
                </td>
                <td className="text-nowrap">{usuario.creadoEn ? fechaHora(usuario.creadoEn) : '—'}</td>
                <td className="text-nowrap">{usuario.ultimoIngreso ? fechaHora(usuario.ultimoIngreso) : '—'}</td>
                <td className="text-end">
                  {/* Los admins no se borran, el servidor también lo controla */}
                  {usuario.esAdmin ? (
                    <small className="text-muted">Protegido</small>
                  ) : (
                    <div className={styles.acciones}>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={ocupado}
                        aria-label={`Eliminar a ${usuario.nombre}`}
                        onClick={() => borrar(usuario)}>
                        <Trash3 aria-hidden="true" /> Eliminar
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default AdminUsuarios;
