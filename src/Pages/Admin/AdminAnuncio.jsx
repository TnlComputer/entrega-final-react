import {useState} from 'react';
import {Alert, Badge, Button, Col, Form, Row} from 'react-bootstrap';
import {useOutletContext} from 'react-router-dom';
import BarraAnuncio from '../../components/BarraAnuncio/BarraAnuncio';
import {
  DESCUENTO_MAXIMO,
  LIMITE_TEXTO_ANUNCIO,
  estadoAnuncio,
  prepararAnuncio,
  validarAnuncio
} from '../../data/modeloAnuncio';
import {guardarAnuncio} from '../../services/adminApi';
import styles from './Admin.module.css';

const formatoFecha = fecha => fecha.split('-').reverse().join('/');

const ESTADOS = {
  visible: {
    color: 'success',
    texto: anuncio =>
      `Se está mostrando en la página${anuncio.descuento > 0 ? ` · ${anuncio.descuento}% de descuento activo` : ''}`
  },
  programado: {color: 'warning', texto: anuncio => `Programado: aparece el ${formatoFecha(anuncio.desde)}`},
  vencido: {color: 'secondary', texto: anuncio => `Vencido: dejó de mostrarse después del ${formatoFecha(anuncio.hasta)}`},
  oculto: {color: 'secondary', texto: () => 'Oculto'}
};

function AdminAnuncio() {
  const {anuncio: {anuncio, cargando, reemplazarAnuncio}} = useOutletContext();
  // Vive acá y no en el formulario, que se reinicia después de guardar
  const [guardadoOk, setGuardadoOk] = useState(false);

  if (cargando) return <p>Cargando anuncio…</p>;

  return (
    <>
      {guardadoOk && (
        <Alert variant="success" dismissible onClose={() => setGuardadoOk(false)}>
          Guardamos el anuncio. La página ya muestra los cambios.
        </Alert>
      )}
      {/* key: si el anuncio guardado cambia, el formulario arranca de nuevo con esos datos */}
      <FormularioAnuncio
        key={JSON.stringify(anuncio)}
        guardado={anuncio}
        onGuardado={nuevo => {
          reemplazarAnuncio(nuevo);
          setGuardadoOk(true);
        }}
      />
    </>
  );
}

function FormularioAnuncio({guardado, onGuardado}) {
  const [formulario, setFormulario] = useState(guardado);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const datos = prepararAnuncio(formulario);
  const errores = validarAnuncio(datos);
  const error = campo => (intentoEnviar ? errores[campo] : undefined);
  const hayCambios = JSON.stringify(datos) !== JSON.stringify(prepararAnuncio(guardado));
  const estado = ESTADOS[estadoAnuncio(guardado)];

  const cambiar = campo => evento => {
    const valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value;
    setFormulario(actual => ({...actual, [campo]: valor}));
  };

  const enviar = async evento => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setAviso(null);
    if (Object.keys(errores).length) {
      setAviso({tipo: 'danger', texto: Object.values(errores)[0]});
      return;
    }

    setGuardando(true);
    try {
      onGuardado(await guardarAnuncio(datos));
    } catch (errorCapturado) {
      setAviso({tipo: 'danger', texto: errorCapturado.message});
      setGuardando(false);
    }
  };

  return (
    <Form onSubmit={enviar} noValidate className={styles.formulario}>
      <div className={styles.toolbar}>
        <p className={styles.resumen}>Una franja arriba de toda la página para avisos: free day, envío gratis, feriados…</p>
        <Badge bg={estado.color}>{estado.texto(guardado)}</Badge>
      </div>

      {aviso && (
        <Alert variant={aviso.tipo} dismissible onClose={() => setAviso(null)}>
          {aviso.texto}
        </Alert>
      )}

      <fieldset className={styles.seccion}>
        <legend>Anuncio</legend>
        <Form.Group className="mb-3" controlId="anuncio-texto">
          <Form.Label>Texto</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={formulario.texto}
            onChange={cambiar('texto')}
            maxLength={LIMITE_TEXTO_ANUNCIO}
            placeholder="Ej: ¡Free day este sábado! Envío gratis en todas las compras."
            isInvalid={Boolean(error('texto'))}
          />
          <Form.Text>
            {formulario.texto.length}/{LIMITE_TEXTO_ANUNCIO} caracteres
          </Form.Text>
          <Form.Control.Feedback type="invalid">{error('texto')}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="anuncio-descuento">
          <Form.Label>Descuento en todo el catálogo (%)</Form.Label>
          <Form.Control
            type="number"
            min="0"
            max={DESCUENTO_MAXIMO}
            step="1"
            value={formulario.descuento}
            onChange={cambiar('descuento')}
            isInvalid={Boolean(error('descuento'))}
            className={styles.campoCorto}
          />
          <Form.Text>
            Opcional (0 = sin descuento). Se descuenta del total del carrito al pagar, solo mientras el anuncio se muestra.
          </Form.Text>
          <Form.Control.Feedback type="invalid">{error('descuento')}</Form.Control.Feedback>
        </Form.Group>

        <Form.Check
          type="switch"
          id="anuncio-activo"
          className="mb-3"
          label="Mostrar en la página"
          checked={formulario.activo}
          onChange={cambiar('activo')}
        />

        <Row className="g-3">
          <Form.Group as={Col} sm={6} controlId="anuncio-desde">
            <Form.Label>Desde</Form.Label>
            <Form.Control type="date" value={formulario.desde} onChange={cambiar('desde')} isInvalid={Boolean(error('desde'))} />
            <Form.Control.Feedback type="invalid">{error('desde')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col} sm={6} controlId="anuncio-hasta">
            <Form.Label>Hasta</Form.Label>
            <Form.Control
              type="date"
              value={formulario.hasta}
              min={formulario.desde || undefined}
              onChange={cambiar('hasta')}
              isInvalid={Boolean(error('hasta'))}
            />
            <Form.Control.Feedback type="invalid">{error('hasta')}</Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Form.Text>Opcionales. Sin fechas se muestra mientras esté encendido; con fechas aparece y se va solo.</Form.Text>
      </fieldset>

      <fieldset className={styles.seccion}>
        <legend>Vista previa</legend>
        <BarraAnuncio anuncio={datos} vistaPrevia />
      </fieldset>

      <div className={styles.botonesFormulario}>
        <Button variant="outline-secondary" disabled={!hayCambios || guardando} onClick={() => setFormulario(guardado)}>
          Descartar cambios
        </Button>
        <Button type="submit" variant="dark" disabled={!hayCambios || guardando}>
          {guardando ? 'Guardando…' : 'Guardar anuncio'}
        </Button>
      </div>
    </Form>
  );
}

export default AdminAnuncio;
