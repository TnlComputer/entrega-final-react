import {useState} from 'react';
import {Alert, Button, Form, Modal, Table} from 'react-bootstrap';
import {RUBRO_VACIO, prepararRubro, validarRubro} from '../../data/modeloCatalogo';
import useAdminCatalogo from '../../hooks/useAdminCatalogo';
import styles from './Admin.module.css';

function AdminRubros() {
  const {rubros, productos, cargando, error, guardarRubro, eliminarRubro} = useAdminCatalogo();
  // null = modal cerrado; {id: null} = nuevo; {id: 'canas'} = editar
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState(null);

  if (cargando) return <p>Cargando catálogo…</p>;
  if (error) return <Alert variant="danger">No pudimos cargar el catálogo: {error}</Alert>;

  const cantidadPorRubro = id => productos.filter(producto => producto.rubro === id).length;
  const siguienteOrden = Math.max(0, ...rubros.map(rubro => rubro.orden)) + 1;

  const borrar = async rubro => {
    if (!window.confirm(`¿Eliminar el rubro "${rubro.nombre}"?`)) return;
    setAviso(null);
    try {
      await eliminarRubro(rubro.id);
      setAviso({tipo: 'success', texto: `Eliminamos el rubro "${rubro.nombre}".`});
    } catch (errorCapturado) {
      setAviso({tipo: 'danger', texto: errorCapturado.message});
    }
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <p className={styles.resumen}>
          {rubros.length} rubros · la tienda los muestra en este orden
        </p>
        <Button variant="dark" onClick={() => setEditando({id: null})}>
          + Nuevo rubro
        </Button>
      </div>

      {aviso && (
        <Alert variant={aviso.tipo} dismissible onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      <Table responsive hover className={styles.tabla}>
        <thead>
          <tr>
            <th scope="col">Orden</th>
            <th scope="col">Rubro</th>
            <th scope="col">Subrubros</th>
            <th scope="col" className="text-end">
              Productos
            </th>
            <th scope="col" className="text-end">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {rubros.map(rubro => (
            <tr key={rubro.id}>
              <td>{rubro.orden}</td>
              <td>
                <strong>{rubro.nombre}</strong>
                <small className="d-block text-muted">{rubro.detalle}</small>
              </td>
              <td>{rubro.subrubros.length ? rubro.subrubros.join(', ') : <span className="text-muted">—</span>}</td>
              <td className="text-end">{cantidadPorRubro(rubro.id)}</td>
              <td>
                <div className={styles.acciones}>
                  <Button size="sm" variant="outline-dark" onClick={() => setEditando({id: rubro.id})}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    aria-label={`Eliminar ${rubro.nombre}`}
                    onClick={() => borrar(rubro)}>
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {editando && (
        <RubroModal
          key={editando.id ?? 'nuevo'}
          rubro={rubros.find(rubro => rubro.id === editando.id) ?? {...RUBRO_VACIO, orden: siguienteOrden}}
          id={editando.id}
          rubros={rubros}
          onGuardar={async datos => {
            const detalle = await guardarRubro(datos, editando.id);
            setEditando(null);
            setAviso({tipo: 'success', texto: `Guardamos el rubro "${datos.nombre}".${detalle ? ` ${detalle}` : ''}`});
          }}
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function RubroModal({rubro, id, rubros, onGuardar, onCerrar}) {
  const [formulario, setFormulario] = useState({
    nombre: rubro.nombre,
    detalle: rubro.detalle,
    orden: String(rubro.orden ?? ''),
    subrubros: rubro.subrubros.join(', ')
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const datos = prepararRubro({...formulario, subrubros: formulario.subrubros.split(',')});
  const errores = validarRubro(datos, {rubros, id});
  const error = campo => (intentoEnviar ? errores[campo] : undefined);

  const cambiar = campo => evento => setFormulario(actual => ({...actual, [campo]: evento.target.value}));

  const enviar = async evento => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setErrorGeneral(null);
    if (Object.keys(errores).length) return;

    setGuardando(true);
    try {
      await onGuardar(datos);
    } catch (errorCapturado) {
      setErrorGeneral(errorCapturado.message);
      setGuardando(false);
    }
  };

  return (
    <Modal show onHide={onCerrar} centered>
      <Form onSubmit={enviar} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>{id === null ? 'Nuevo rubro' : `Editar: ${rubro.nombre}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorGeneral && <Alert variant="danger">{errorGeneral}</Alert>}
          <Form.Group className="mb-3" controlId="rubro-nombre">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              value={formulario.nombre}
              onChange={cambiar('nombre')}
              maxLength={40}
              isInvalid={Boolean(error('nombre'))}
            />
            <Form.Control.Feedback type="invalid">{error('nombre')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="rubro-detalle">
            <Form.Label>Bajada</Form.Label>
            <Form.Control
              value={formulario.detalle}
              onChange={cambiar('detalle')}
              maxLength={60}
              placeholder="Ej: Equipo para arrancar"
              isInvalid={Boolean(error('detalle'))}
            />
            <Form.Control.Feedback type="invalid">{error('detalle')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="rubro-subrubros">
            <Form.Label>Subrubros</Form.Label>
            <Form.Control
              value={formulario.subrubros}
              onChange={cambiar('subrubros')}
              placeholder="Cañas, Reels"
              isInvalid={Boolean(error('subrubros'))}
            />
            <Form.Text>Opcional, separados por coma. Vacío = el rubro no se divide.</Form.Text>
            <Form.Control.Feedback type="invalid">{error('subrubros')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="rubro-orden">
            <Form.Label>Orden *</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="1"
              value={formulario.orden}
              onChange={cambiar('orden')}
              isInvalid={Boolean(error('orden'))}
            />
            <Form.Text>Menor = aparece antes en la tienda.</Form.Text>
            <Form.Control.Feedback type="invalid">{error('orden')}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variant="dark" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default AdminRubros;
