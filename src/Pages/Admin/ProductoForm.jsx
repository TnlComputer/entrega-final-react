import {useState} from 'react';
import {Alert, Button, Col, Form, InputGroup, Row} from 'react-bootstrap';
import {Link, useNavigate, useParams} from 'react-router-dom';
import heroImage from '../../assets/hero.jpg';
import {COLORES, LIMITES, PRODUCTO_VACIO, prepararProducto, validarProducto} from '../../data/modeloCatalogo';
import useAdminCatalogo from '../../hooks/useAdminCatalogo';
import {subirImagen} from '../../services/adminApi';
import itemStyles from '../../components/Item/Item.module.css';
import styles from './Admin.module.css';

// El formulario trabaja con texto; las características van una por línea
function productoAFormulario(producto) {
  return {
    ...PRODUCTO_VACIO,
    ...producto,
    precio: String(producto.precio ?? ''),
    precioOferta: producto.precioOferta === null ? '' : String(producto.precioOferta),
    stock: String(producto.stock ?? ''),
    orden: String(producto.orden ?? 0),
    caracteristicas: (producto.caracteristicas ?? []).join('\n')
  };
}

const formularioADatos = formulario =>
  prepararProducto({...formulario, caracteristicas: formulario.caracteristicas.split('\n')});

function ProductoForm() {
  const {id} = useParams();
  const catalogo = useAdminCatalogo();

  if (catalogo.cargando) return <p>Cargando catálogo…</p>;
  if (catalogo.error) return <Alert variant="danger">No pudimos cargar el catálogo: {catalogo.error}</Alert>;

  if (id === undefined) {
    const primerRubro = catalogo.rubros[0];
    const inicial = {
      ...productoAFormulario(PRODUCTO_VACIO),
      rubro: primerRubro?.id ?? '',
      subrubro: primerRubro?.subrubros[0] ?? ''
    };
    return <FormularioProducto key="nuevo" inicial={inicial} id={null} catalogo={catalogo} />;
  }

  const producto = catalogo.productos.find(item => item.id === Number(id));
  if (!producto) {
    return (
      <Alert variant="warning">
        No encontramos ese producto. <Link to="/admin">Volver al listado</Link>
      </Alert>
    );
  }

  return <FormularioProducto key={producto.id} inicial={productoAFormulario(producto)} id={producto.id} catalogo={catalogo} />;
}

function FormularioProducto({inicial, id, catalogo}) {
  const {rubros, productos, guardarProducto} = catalogo;
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState(inicial);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const datos = formularioADatos(formulario);
  const errores = validarProducto(datos, {rubros, productos, id});
  // Los errores se muestran recién después del primer intento de guardar
  const error = campo => (intentoEnviar ? errores[campo] : undefined);

  const rubroElegido = rubros.find(rubro => rubro.id === formulario.rubro);
  const subrubros = rubroElegido?.subrubros ?? [];

  const cambiar = campo => evento => {
    const {type, checked, value} = evento.target;
    setFormulario(actual => ({...actual, [campo]: type === 'checkbox' ? checked : value}));
  };

  const cambiarRubro = evento => {
    const nuevo = rubros.find(rubro => rubro.id === evento.target.value);
    setFormulario(actual => ({
      ...actual,
      rubro: evento.target.value,
      // Si el subrubro no existe en el rubro nuevo, se elige el primero ('' si no tiene)
      subrubro: nuevo?.subrubros.includes(actual.subrubro) ? actual.subrubro : (nuevo?.subrubros[0] ?? '')
    }));
  };

  const elegirImagen = async evento => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await subirImagen(archivo);
      setFormulario(actual => ({...actual, imagen: url}));
    } catch (errorCapturado) {
      setErrorGeneral(errorCapturado.message);
    } finally {
      setSubiendo(false);
    }
  };

  const enviar = async evento => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setErrorGeneral(null);
    if (Object.keys(errores).length) return;

    setGuardando(true);
    try {
      await guardarProducto(datos, id);
      navegar('/admin', {
        state: {aviso: {tipo: 'success', texto: `${id === null ? 'Creamos' : 'Guardamos'} "${datos.nombre}".`}}
      });
    } catch (errorCapturado) {
      setErrorGeneral(errorCapturado.message);
      setGuardando(false);
    }
  };

  const cantidadErrores = Object.keys(errores).length;

  return (
    <Form onSubmit={enviar} noValidate className={styles.formulario}>
      <div className={styles.toolbar}>
        <h3 className={styles.tituloFormulario}>{id === null ? 'Nuevo producto' : `Editar: ${inicial.nombre}`}</h3>
        <Link to="/admin">← Volver al listado</Link>
      </div>

      {errorGeneral && <Alert variant="danger">{errorGeneral}</Alert>}
      {intentoEnviar && cantidadErrores > 0 && (
        <Alert variant="warning">
          Revisá {cantidadErrores === 1 ? 'el campo marcado' : `los ${cantidadErrores} campos marcados`} en rojo.
        </Alert>
      )}

      <fieldset className={styles.seccion}>
        <legend>Datos básicos</legend>
        <Row className="g-3">
          <Form.Group as={Col} md={6} controlId="producto-nombre">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              value={formulario.nombre}
              onChange={cambiar('nombre')}
              maxLength={LIMITES.nombre}
              isInvalid={Boolean(error('nombre'))}
            />
            <Form.Control.Feedback type="invalid">{error('nombre')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col} md={3} controlId="producto-marca">
            <Form.Label>Marca</Form.Label>
            <Form.Control
              value={formulario.marca}
              onChange={cambiar('marca')}
              maxLength={LIMITES.marca}
              isInvalid={Boolean(error('marca'))}
            />
            <Form.Control.Feedback type="invalid">{error('marca')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col} md={3} controlId="producto-sku">
            <Form.Label>Código (SKU)</Form.Label>
            <Form.Control
              value={formulario.sku}
              onChange={cambiar('sku')}
              maxLength={LIMITES.sku}
              placeholder="Ej: CAN-240"
              isInvalid={Boolean(error('sku'))}
            />
            <Form.Control.Feedback type="invalid">{error('sku')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col} xs={12} controlId="producto-descripcion">
            <Form.Label>Descripción corta *</Form.Label>
            <Form.Control
              value={formulario.descripcion}
              onChange={cambiar('descripcion')}
              maxLength={LIMITES.descripcion}
              isInvalid={Boolean(error('descripcion'))}
            />
            <Form.Text>
              {formulario.descripcion.length}/{LIMITES.descripcion} · Se ve debajo del nombre en la tienda.
            </Form.Text>
            <Form.Control.Feedback type="invalid">{error('descripcion')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col} xs={12} controlId="producto-caracteristicas">
            <Form.Label>Características</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formulario.caracteristicas}
              onChange={cambiar('caracteristicas')}
              placeholder={'2,40 m de largo\nAcción media\n2 tramos'}
              isInvalid={Boolean(error('caracteristicas'))}
            />
            <Form.Text>
              Una por línea, hasta {LIMITES.caracteristicas}. Se ven al dar vuelta la tarjeta.
            </Form.Text>
            <Form.Control.Feedback type="invalid">{error('caracteristicas')}</Form.Control.Feedback>
          </Form.Group>
        </Row>
      </fieldset>

      <fieldset className={styles.seccion}>
        <legend>Clasificación</legend>
        {rubros.length === 0 && (
          <Alert variant="info">
            Todavía no hay rubros. <Link to="/admin/rubros">Creá uno primero</Link>.
          </Alert>
        )}
        <Row className="g-3">
          <Form.Group as={Col} md={6} controlId="producto-rubro">
            <Form.Label>Rubro *</Form.Label>
            <Form.Select value={formulario.rubro} onChange={cambiarRubro} isInvalid={Boolean(error('rubro'))}>
              <option value="">Elegí un rubro…</option>
              {rubros.map(rubro => (
                <option key={rubro.id} value={rubro.id}>
                  {rubro.nombre}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{error('rubro')}</Form.Control.Feedback>
          </Form.Group>
          {/* Solo si el rubro elegido se divide en subrubros */}
          {subrubros.length > 0 && (
            <Form.Group as={Col} md={6} controlId="producto-subrubro">
              <Form.Label>Subrubro *</Form.Label>
              <Form.Select
                value={formulario.subrubro}
                onChange={cambiar('subrubro')}
                isInvalid={Boolean(error('subrubro'))}>
                <option value="">Elegí un subrubro…</option>
                {subrubros.map(subrubro => (
                  <option key={subrubro} value={subrubro}>
                    {subrubro}
                  </option>
                ))}
              </Form.Select>
              <Form.Text>
                ¿Falta uno? Agregalo en <Link to="/admin/rubros">Rubros</Link>.
              </Form.Text>
              <Form.Control.Feedback type="invalid">{error('subrubro')}</Form.Control.Feedback>
            </Form.Group>
          )}
        </Row>
      </fieldset>

      <fieldset className={styles.seccion}>
        <legend>Precio y stock</legend>
        <Row className="g-3">
          <Form.Group as={Col} md={4} controlId="producto-precio">
            <Form.Label>Precio *</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={formulario.precio}
                onChange={cambiar('precio')}
                isInvalid={Boolean(error('precio'))}
              />
              <Form.Control.Feedback type="invalid">{error('precio')}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <Form.Group as={Col} md={4} controlId="producto-oferta">
            <Form.Label>Precio de oferta</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={formulario.precioOferta}
                onChange={cambiar('precioOferta')}
                isInvalid={Boolean(error('precioOferta'))}
              />
              <Form.Control.Feedback type="invalid">{error('precioOferta')}</Form.Control.Feedback>
            </InputGroup>
            <Form.Text>Vacío = sin oferta. En la tienda se tacha el precio normal.</Form.Text>
          </Form.Group>
          <Form.Group as={Col} md={4} controlId="producto-stock">
            <Form.Label>Stock *</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={formulario.stock}
              onChange={cambiar('stock')}
              isInvalid={Boolean(error('stock'))}
            />
            <Form.Text>Con 0 se muestra "Sin stock".</Form.Text>
            <Form.Control.Feedback type="invalid">{error('stock')}</Form.Control.Feedback>
          </Form.Group>
        </Row>
      </fieldset>

      <fieldset className={styles.seccion}>
        <legend>Imagen</legend>
        <Row className="g-3 align-items-start">
          <Col md={8}>
            <Form.Group className="mb-3" controlId="producto-imagen">
              <Form.Label>Link de la imagen *</Form.Label>
              <Form.Control
                value={formulario.imagen}
                onChange={cambiar('imagen')}
                placeholder="https://…"
                isInvalid={Boolean(error('imagen'))}
              />
              <Form.Control.Feedback type="invalid">{error('imagen')}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="producto-archivo">
              <Form.Label>…o subí una desde tu compu</Form.Label>
              <Form.Control type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={elegirImagen} disabled={subiendo} />
              <Form.Text>{subiendo ? 'Subiendo a ImgBB…' : 'JPG, PNG, WEBP o GIF, hasta 5 MB. Se sube a ImgBB y se completa el link.'}</Form.Text>
            </Form.Group>
            <Form.Group controlId="producto-color">
              <Form.Label>Color de fondo de la tarjeta</Form.Label>
              <Form.Select value={formulario.clase} onChange={cambiar('clase')}>
                {COLORES.map(color => (
                  <option key={color.clase} value={color.clase}>
                    {color.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <div className={`${styles.vistaPrevia} ${itemStyles[formulario.clase] ?? ''}`}>
              {formulario.imagen ? (
                <img
                  src={formulario.imagen}
                  alt="Vista previa"
                  onError={evento => {
                    evento.currentTarget.src = heroImage;
                  }}
                />
              ) : (
                <span>Vista previa</span>
              )}
            </div>
          </Col>
        </Row>
      </fieldset>

      <fieldset className={styles.seccion}>
        <legend>Publicación</legend>
        <Row className="g-3 align-items-end">
          <Col md={8}>
            <Form.Check
              type="switch"
              id="producto-activo"
              label="Visible en la tienda"
              checked={formulario.activo}
              onChange={cambiar('activo')}
            />
            <Form.Check
              type="switch"
              id="producto-destacado"
              label="Destacado"
              checked={formulario.destacado}
              onChange={cambiar('destacado')}
            />
          </Col>
          <Form.Group as={Col} md={4} controlId="producto-orden">
            <Form.Label>Orden dentro del rubro</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="1"
              value={formulario.orden}
              onChange={cambiar('orden')}
              isInvalid={Boolean(error('orden'))}
            />
            <Form.Text>Menor = aparece antes. Con 0 se ordena por nombre.</Form.Text>
            <Form.Control.Feedback type="invalid">{error('orden')}</Form.Control.Feedback>
          </Form.Group>
        </Row>
      </fieldset>

      <div className={styles.botonesFormulario}>
        <Button as={Link} to="/admin" variant="outline-secondary">
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={guardando || subiendo}>
          {guardando ? 'Guardando…' : id === null ? 'Crear producto' : 'Guardar cambios'}
        </Button>
      </div>
    </Form>
  );
}

export default ProductoForm;
