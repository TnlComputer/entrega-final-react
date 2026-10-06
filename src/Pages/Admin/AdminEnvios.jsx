import {useState} from 'react';
import {Alert, Button, Form, Table} from 'react-bootstrap';
import {useOutletContext} from 'react-router-dom';
import {parsearLocalidades, validarZonaEnvio, ZONA_ENVIO_VACIA} from '../../data/modeloEnvios';
import {guardarZonasEnvio} from '../../services/adminApi';
import styles from './Admin.module.css';

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

function AdminEnvios() {
  const {envios} = useOutletContext();

  if (envios.cargando) return <p>Cargando tarifas de envío…</p>;
  if (envios.error) return <Alert variant="danger">No pudimos cargar las tarifas: {envios.error}</Alert>;

  return (
    <EditorEnvios
      key={JSON.stringify(envios.zonas)}
      guardadas={envios.zonas}
      reemplazarZonas={envios.reemplazarZonas}
    />
  );
}

function EditorEnvios({guardadas, reemplazarZonas}) {
  const [zonas, setZonas] = useState(guardadas);
  const [formulario, setFormulario] = useState(ZONA_ENVIO_VACIA);
  const [editandoId, setEditandoId] = useState(null);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const hayCambios = JSON.stringify(zonas) !== JSON.stringify(guardadas);

  const cambiar = campo => evento => setFormulario(actual => ({...actual, [campo]: evento.target.value}));

  const editarZona = zona => {
    setFormulario({
      nombre: zona.nombre,
      codigoDesde: zona.codigoDesde,
      codigoHasta: zona.codigoHasta,
      localidades: parsearLocalidades(zona.localidades).join(', '),
      precio: String(zona.precio)
    });
    setEditandoId(zona.id);
    setErrores({});
    setAviso(null);
  };

  const cancelarEdicion = () => {
    setFormulario(ZONA_ENVIO_VACIA);
    setEditandoId(null);
    setErrores({});
  };

  const agregarOActualizar = evento => {
    evento.preventDefault();
    const erroresFormulario = validarZonaEnvio(formulario, zonas, editandoId);
    setErrores(erroresFormulario);
    if (Object.keys(erroresFormulario).length) return;

    const zona = {
      ...formulario,
      nombre: formulario.nombre.trim(),
      codigoDesde: formulario.codigoDesde.trim(),
      codigoHasta: formulario.codigoHasta.trim(),
      localidades: parsearLocalidades(formulario.localidades),
      precio: Number(formulario.precio),
      id: editandoId ?? crypto.randomUUID()
    };
    setZonas(actual => (editandoId ? actual.map(item => (item.id === editandoId ? zona : item)) : [...actual, zona]));
    cancelarEdicion();
    setAviso({tipo: 'info', texto: 'Cambios en borrador. Guardá las tarifas para publicarlas.'});
  };

  const quitarZona = zona => {
    if (!window.confirm(`¿Quitar la zona "${zona.nombre}" del borrador?`)) return;
    setZonas(actual => actual.filter(item => item.id !== zona.id));
    if (editandoId === zona.id) cancelarEdicion();
    setAviso({tipo: 'info', texto: 'Zona quitada del borrador. Guardá las tarifas para confirmar el cambio.'});
  };

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const guardadasNuevas = await guardarZonasEnvio(zonas);
      reemplazarZonas(guardadasNuevas);
      setAviso({tipo: 'success', texto: 'Guardamos las zonas y tarifas de envío.'});
    } catch (errorCapturado) {
      setAviso({tipo: 'danger', texto: errorCapturado.message});
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <p className={styles.resumen}>
          Definí un rango de CP, localidades o ambos para cada tarifa. Las localidades se comparan sin distinguir
          mayúsculas ni acentos.
        </p>
      </div>

      {aviso && (
        <Alert variant={aviso.tipo} dismissible onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      <Form onSubmit={agregarOActualizar} noValidate className={styles.formulario}>
        <fieldset className={styles.seccion}>
          <legend>{editandoId ? 'Editar zona' : 'Agregar zona'}</legend>
          <div className={styles.zonaEnvioFormulario}>
            <Form.Group controlId="zona-envio-nombre">
              <Form.Label>Nombre de zona *</Form.Label>
              <Form.Control value={formulario.nombre} onChange={cambiar('nombre')} isInvalid={Boolean(errores.nombre)} />
              <Form.Control.Feedback type="invalid">{errores.nombre}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className={styles.localidadesZona} controlId="zona-envio-localidades">
              <Form.Label>Localidades</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder={'Buenos Aires, La Plata\nMar del Plata'}
                value={formulario.localidades}
                onChange={cambiar('localidades')}
                isInvalid={Boolean(errores.localidades)}
              />
              <Form.Text>Opcional. Separalas por coma o por línea; se usan para calcular por dirección.</Form.Text>
              <Form.Control.Feedback type="invalid">{errores.localidades}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="zona-envio-desde">
              <Form.Label>CP desde</Form.Label>
              <Form.Control
                inputMode="numeric"
                maxLength={4}
                placeholder="1000"
                value={formulario.codigoDesde}
                onChange={cambiar('codigoDesde')}
                isInvalid={Boolean(errores.codigoDesde)}
              />
              <Form.Control.Feedback type="invalid">{errores.codigoDesde}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="zona-envio-hasta">
              <Form.Label>CP hasta</Form.Label>
              <Form.Control
                inputMode="numeric"
                maxLength={4}
                placeholder="1499"
                value={formulario.codigoHasta}
                onChange={cambiar('codigoHasta')}
                isInvalid={Boolean(errores.codigoHasta)}
              />
              <Form.Control.Feedback type="invalid">{errores.codigoHasta}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="zona-envio-precio">
              <Form.Label>Tarifa (ARS) *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="1"
                value={formulario.precio}
                onChange={cambiar('precio')}
                isInvalid={Boolean(errores.precio)}
              />
              <Form.Control.Feedback type="invalid">{errores.precio}</Form.Control.Feedback>
            </Form.Group>
            <Form.Text className={styles.zonaEnvioAyuda}>
              Completá ambos CP para usar un rango, o dejalos vacíos si definís localidades. Podés completar los dos.
            </Form.Text>
          </div>
          <div className={styles.botonesFormulario}>
            {editandoId && (
              <Button variant="outline-secondary" onClick={cancelarEdicion}>
                Cancelar edición
              </Button>
            )}
            <Button type="submit" variant="outline-dark">
              {editandoId ? 'Actualizar zona' : 'Agregar zona'}
            </Button>
          </div>
        </fieldset>
      </Form>

      <fieldset className={styles.seccion}>
        <legend>Zonas configuradas</legend>
        {zonas.length === 0 ? (
          <p className={styles.resumen}>Todavía no hay zonas. Agregá un rango para habilitar el cálculo de envío.</p>
        ) : (
          <Table responsive hover className={styles.tabla}>
            <thead>
              <tr>
                <th>Zona</th>
                <th>Rango de CP</th>
                <th>Localidades</th>
                <th className="text-end">Tarifa</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {zonas.map(zona => (
                <tr key={zona.id}>
                  <td>{zona.nombre}</td>
                  <td>{zona.codigoDesde && zona.codigoHasta ? `${zona.codigoDesde}–${zona.codigoHasta}` : '—'}</td>
                  <td>{parsearLocalidades(zona.localidades).join(', ') || '—'}</td>
                  <td className="text-end">{formatoPrecio.format(zona.precio)}</td>
                  <td>
                    <div className={styles.acciones}>
                      <Button size="sm" variant="outline-dark" onClick={() => editarZona(zona)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => quitarZona(zona)}>
                        Quitar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className={styles.botonesFormulario}>
          <Button
            variant="outline-secondary"
            disabled={!hayCambios || guardando}
            onClick={() => {
              setZonas(guardadas);
              cancelarEdicion();
              setAviso(null);
            }}>
            Descartar cambios
          </Button>
          <Button variant="dark" disabled={!hayCambios || guardando} onClick={guardar}>
            {guardando ? 'Guardando…' : 'Guardar tarifas'}
          </Button>
        </div>
      </fieldset>

      <Alert variant="info">
        El retiro en tienda no tiene costo de envío. Si todavía no configuraste una zona para un código postal, el cliente
        puede elegir retiro o probar con otro código.
      </Alert>
    </div>
  );
}

export default AdminEnvios;
