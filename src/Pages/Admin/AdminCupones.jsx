import {useState} from 'react';
import {Alert, Badge, Button, Form, Table} from 'react-bootstrap';
import {Trash3} from 'react-bootstrap-icons';
import {HORAS_VALIDEZ, PORCENTAJE_CUPON, PORCENTAJE_MAXIMO, estadoCupon, fechaHora, validarCupon} from '../../data/modeloCupones';
import useAdminCupones from '../../hooks/useAdminCupones';
import useCupones from '../../hooks/useCupones';
import styles from './Admin.module.css';

const ESTADOS = {
  activo: {nombre: 'Sin usar', color: 'success'},
  usado: {nombre: 'Usado', color: 'primary'},
  vencido: {nombre: 'Vencido', color: 'secondary'}
};

const ORIGENES = {entrada: 'Por entrar', manual: 'Manual'};

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

const FORMULARIO_VACIO = {uid: '', porcentaje: String(PORCENTAJE_CUPON)};

function AdminCupones() {
  const {cupones, usuarios, cargando, error, crearCupon, eliminarCupon} = useAdminCupones();
  const {ahora} = useCupones();
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [aviso, setAviso] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  if (cargando) return <p>Cargando cupones…</p>;

  const datos = {uid: formulario.uid, porcentaje: Number(formulario.porcentaje)};
  const errores = validarCupon(datos);
  const errorCampo = campo => (intentoEnviar ? errores[campo] : undefined);

  const nombres = new Map(usuarios.map(usuario => [usuario.uid, usuario.nombre]));
  const termino = busqueda.trim().toLowerCase();
  const lista = cupones.filter(
    cupon =>
      (!estado || estadoCupon(cupon, ahora) === estado) &&
      [cupon.codigo, cupon.email, nombres.get(cupon.uid)].join(' ').toLowerCase().includes(termino)
  );

  const ejecutar = async accion => {
    setOcupado(true);
    setAviso(null);
    try {
      setAviso({tipo: 'success', texto: await accion()});
    } catch (errorCapturado) {
      setAviso({tipo: 'danger', texto: errorCapturado.message});
    } finally {
      setOcupado(false);
    }
  };

  const enviar = evento => {
    evento.preventDefault();
    setIntentoEnviar(true);
    if (Object.keys(errores).length) return;

    ejecutar(async () => {
      const usuario = usuarios.find(opcion => opcion.uid === datos.uid);
      const cupon = await crearCupon({...datos, email: usuario.email});
      setFormulario(FORMULARIO_VACIO);
      setIntentoEnviar(false);
      return `Creamos el cupón ${cupon.codigo} para ${usuario.email}. Vence el ${fechaHora(cupon.venceEn)}.`;
    });
  };

  const borrar = cupon => {
    if (!window.confirm(`¿Eliminar el cupón ${cupon.codigo} de ${cupon.email}? No se puede deshacer.`)) return;
    ejecutar(async () => {
      await eliminarCupon(cupon.codigo);
      return `Eliminamos el cupón ${cupon.codigo}.`;
    });
  };

  const cambiar = campo => evento => setFormulario(actual => ({...actual, [campo]: evento.target.value}));

  return (
    <div>
      {error && <Alert variant="danger">No pudimos cargar los datos: {error}</Alert>}
      {aviso && (
        <Alert variant={aviso.tipo} dismissible onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      <Form onSubmit={enviar} noValidate>
        <fieldset className={styles.seccion}>
          <legend>Nuevo cupón</legend>
          <div className={styles.cuponFormulario}>
            <Form.Group controlId="cupon-usuario">
              <Form.Label>Usuario *</Form.Label>
              <Form.Select value={formulario.uid} onChange={cambiar('uid')} isInvalid={Boolean(errorCampo('uid'))}>
                <option value="">Elegí un usuario…</option>
                {usuarios.map(usuario => (
                  <option key={usuario.uid} value={usuario.uid}>
                    {usuario.nombre} ({usuario.email})
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errorCampo('uid')}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="cupon-porcentaje">
              <Form.Label>Descuento (%) *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={PORCENTAJE_MAXIMO}
                step="1"
                value={formulario.porcentaje}
                onChange={cambiar('porcentaje')}
                isInvalid={Boolean(errorCampo('porcentaje'))}
              />
              <Form.Control.Feedback type="invalid">{errorCampo('porcentaje')}</Form.Control.Feedback>
            </Form.Group>
            <Button type="submit" variant="dark" disabled={ocupado}>
              Crear cupón
            </Button>
          </div>
          <Form.Text>El código se genera solo y vale {HORAS_VALIDEZ} horas.</Form.Text>
        </fieldset>
      </Form>

      <p className={`${styles.resumen} mb-3`}>
        {lista.length} de {cupones.length} cupones
      </p>
      <div className={styles.filtros}>
        <Form.Control
          type="search"
          placeholder="Buscar por código o usuario…"
          aria-label="Buscar cupones"
          value={busqueda}
          onChange={evento => setBusqueda(evento.target.value)}
        />
        <Form.Select aria-label="Filtrar por estado" value={estado} onChange={evento => setEstado(evento.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([clave, opcion]) => (
            <option key={clave} value={clave}>
              {opcion.nombre}
            </option>
          ))}
        </Form.Select>
      </div>

      {lista.length === 0 ? (
        <p className={styles.vacio}>No hay cupones para mostrar.</p>
      ) : (
        <Table responsive hover className={styles.tabla}>
          <thead>
            <tr>
              <th scope="col">Cupón</th>
              <th scope="col">Asignado a</th>
              <th scope="col">Emitido</th>
              <th scope="col">Vence</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha de uso</th>
              <th scope="col" className="text-end">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map(cupon => {
              const {nombre, color} = ESTADOS[estadoCupon(cupon, ahora)];
              return (
                <tr key={cupon.codigo}>
                  <td className="text-nowrap">
                    <strong>{cupon.codigo}</strong>
                    <small className="d-block text-muted">
                      {cupon.porcentaje}% · {ORIGENES[cupon.origen]}
                    </small>
                  </td>
                  <td>
                    {nombres.get(cupon.uid)}
                    <small className="d-block text-muted">{cupon.email}</small>
                  </td>
                  <td className="text-nowrap">{fechaHora(cupon.creadoEn)}</td>
                  <td className="text-nowrap">{fechaHora(cupon.venceEn)}</td>
                  <td>
                    <Badge bg={color}>{nombre}</Badge>
                  </td>
                  <td className="text-nowrap">
                    {cupon.usado ? fechaHora(cupon.usadoEn) : '—'}
                    {cupon.usado && (
                      <small className="d-block text-muted">
                        {cupon.pedido} · −{formatoPrecio.format(cupon.montoDescuento)}
                      </small>
                    )}
                  </td>
                  <td>
                    <div className={styles.acciones}>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={ocupado}
                        aria-label={`Eliminar el cupón ${cupon.codigo}`}
                        onClick={() => borrar(cupon)}>
                        <Trash3 aria-hidden="true" /> Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default AdminCupones;
