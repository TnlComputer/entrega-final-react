import {useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import {precioFinal} from '../../data/modeloCatalogo';
import {
  UMBRAL_ENVIO_GRATIS,
  celularValido,
  zonaParaCodigoPostal,
  zonaParaLocalidad
} from '../../data/modeloEnvios';
import styles from './CartModal.module.css';

const ENTREGA_VACIA = {
  metodo: 'envio',
  calle: '',
  numero: '',
  piso: '',
  departamento: '',
  localidad: '',
  codigoPostal: '',
  celular: '',
  indicaciones: ''
};

function CartModal({
  mostrar,
  productos,
  onCerrar,
  onQuitar,
  onCambiarCantidad,
  onPagoSimulado,
  onActualizarStocks,
  formatoPrecio,
  descuento = 0,
  envios = {zonas: [], cargando: false, error: null}
}) {
  const [paso, setPaso] = useState('carrito');
  const [compraSimulada, setCompraSimulada] = useState(null);
  const [errorCompra, setErrorCompra] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [entrega, setEntrega] = useState(ENTREGA_VACIA);
  const subtotal = productos.reduce((total, item) => total + precioFinal(item.producto) * item.cantidad, 0);
  // Descuento del anuncio (free day…): se aplica sobre todo el carrito
  const montoDescuento = Math.round((subtotal * descuento) / 100);
  const totalProductos = subtotal - montoDescuento;
  // Superado el umbral el envío es gratis y no hace falta una zona con tarifa
  const envioGratisPorMonto = totalProductos > UMBRAL_ENVIO_GRATIS;
  const envioGratis = entrega.metodo === 'envio' && envioGratisPorMonto;
  // La tarifa sale del código postal; si no tiene zona, de la localidad
  const zonaEnvio = envioGratisPorMonto
    ? null
    : (zonaParaCodigoPostal(envios.zonas, entrega.codigoPostal) ??
      zonaParaLocalidad(envios.zonas, entrega.localidad));
  const costoEnvio = entrega.metodo === 'retiro' || envioGratis ? 0 : zonaEnvio ? zonaEnvio.precio : null;
  const total = subtotal - montoDescuento + (costoEnvio ?? 0);
  const datosEnvioCompletos =
    entrega.calle.trim().length >= 2 &&
    entrega.calle.trim().length <= 120 &&
    /^\d{1,6}(?:\s?[A-Za-z])?$/.test(entrega.numero.trim()) &&
    entrega.localidad.trim().length >= 2 &&
    entrega.localidad.trim().length <= 80 &&
    /^\d{4}$/.test(entrega.codigoPostal) &&
    celularValido(entrega.celular);
  const destinoValido = datosEnvioCompletos && (envioGratis || Boolean(zonaEnvio));
  const pagoValido = entrega.metodo === 'retiro' || (destinoValido && (envioGratis || !envios.cargando));
  const textoEntrega =
    entrega.metodo === 'retiro'
      ? 'Retiro en tienda — coordinar por contacto'
      : `${entrega.calle.trim()} ${entrega.numero.trim()}${
          entrega.piso.trim() ? `, Piso ${entrega.piso.trim()}` : ''
        }${entrega.departamento.trim() ? `, Depto. ${entrega.departamento.trim()}` : ''}, ${entrega.localidad.trim()} (CP ${
          entrega.codigoPostal
        }) · Cel. ${entrega.celular.trim()}${entrega.indicaciones.trim() ? ` — ${entrega.indicaciones.trim()}` : ''}`;

  const cerrar = () => {
    setPaso('carrito');
    setCompraSimulada(null);
    setErrorCompra(null);
    setEntrega(ENTREGA_VACIA);
    onCerrar();
  };

  const confirmarPagoSimulado = async () => {
    if (!pagoValido || confirmando) return;
    setErrorCompra(null);
    setConfirmando(true);
    try {
      const resultado = await onPagoSimulado({
        items: productos.map(({producto, cantidad}) => ({id: producto.id, cantidad})),
        entrega
      });
      setCompraSimulada(resultado);
      setPaso('confirmacion');
    } catch (error) {
      if (error.stocks) onActualizarStocks?.(error.stocks);
      setErrorCompra(error.message);
    } finally {
      setConfirmando(false);
    }
  };

  const cambiarEntrega = campo => evento =>
    setEntrega(actual => ({...actual, [campo]: evento.target.value}));

  return (
    <Modal show={mostrar} onHide={cerrar} centered className={styles.cartModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          {paso === 'pago'
            ? 'Entrega y envío'
            : paso === 'revision'
              ? 'Revisión de compra'
              : paso === 'confirmacion'
                ? 'Compra de prueba'
                : 'Tu equipo'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {paso === 'confirmacion' ? (
          <div className={styles.paymentResult} role="status">
            <span className={styles.paymentResultIcon} aria-hidden="true">
              ✓
            </span>
            <h3>Compra simulada confirmada</h3>
            <p>
              Esta compra fue solo una demostración. No se realizó ningún cobro; el stock sí se actualizó en el catálogo.
            </p>
            <div className={styles.cartSummary}>
              <div>
                <span>Artículos</span>
                <strong>{compraSimulada?.cantidad ?? 0}</strong>
              </div>
              <div>
                <span>Entrega</span>
                <strong>{compraSimulada?.metodo === 'retiro'
                    ? 'Retiro en tienda'
                    : (compraSimulada?.zona ?? 'Envío a domicilio')}</strong>
              </div>
              <div>
                <span>Envío</span>
                <strong>
                  {compraSimulada?.envio === 0 ? 'Gratis' : formatoPrecio.format(compraSimulada?.envio ?? 0)}
                </strong>
              </div>
              {compraSimulada?.direccion && (
                <p className={styles.paymentAddress}>{compraSimulada.direccion}</p>
              )}
              <div className={styles.cartTotal}>
                <span>Total de prueba</span>
                <strong>{formatoPrecio.format(compraSimulada?.total ?? 0)}</strong>
              </div>
            </div>
          </div>
        ) : paso === 'pago' || paso === 'revision' ? (
          <div className={styles.paymentStep}>
            <p className={styles.simulationNotice}>
              Estás en una demostración: no ingreses datos de tarjeta. No se procesa ningún pago real; al confirmar la
              compra, se validará y descontará el stock disponible.
            </p>
            {errorCompra && <Alert variant="danger" role="alert">{errorCompra}</Alert>}
            {paso === 'pago' ? (
              <>
                <fieldset className={styles.deliveryOptions}>
              <legend>Forma de entrega</legend>
              <Form.Check
                type="radio"
                name="metodo-entrega"
                id="entrega-domicilio"
                label="Envío a domicilio"
                checked={entrega.metodo === 'envio'}
                onChange={() => setEntrega(actual => ({...actual, metodo: 'envio'}))}
              />
              <Form.Check
                type="radio"
                name="metodo-entrega"
                id="retiro-tienda"
                label="Retiro en tienda — coordinar por contacto"
                checked={entrega.metodo === 'retiro'}
                onChange={() => setEntrega(actual => ({...actual, metodo: 'retiro'}))}
              />
            </fieldset>
            {entrega.metodo === 'envio' && (
              <div className={styles.deliveryAddress}>
                <p className={styles.deliveryIntro}>
                  {envioGratisPorMonto
                    ? `Tu compra supera ${formatoPrecio.format(UMBRAL_ENVIO_GRATIS)}: el envío es gratis. Completá los datos de entrega.`
                    : 'Completá los datos de entrega. La tarifa se calcula por código postal o localidad.'}
                </p>
                {!envioGratisPorMonto && envios.error && (
                  <Alert variant="danger">No pudimos consultar las tarifas de envío: {envios.error}</Alert>
                )}
                <div className={styles.deliveryFields}>
                  <Form.Group className={styles.deliveryStreet} controlId="checkout-calle">
                    <Form.Label>Calle *</Form.Label>
                    <Form.Control
                      value={entrega.calle}
                      onChange={cambiarEntrega('calle')}
                      autoComplete="address-line1"
                      minLength={2}
                      maxLength={120}
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="checkout-numero">
                    <Form.Label>Número *</Form.Label>
                    <Form.Control
                      value={entrega.numero}
                      onChange={cambiarEntrega('numero')}
                      inputMode="text"
                      maxLength={8}
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="checkout-piso">
                    <Form.Label>Piso (opcional)</Form.Label>
                    <Form.Control value={entrega.piso} onChange={cambiarEntrega('piso')} maxLength={10} />
                  </Form.Group>
                  <Form.Group controlId="checkout-departamento">
                    <Form.Label>Departamento (opcional)</Form.Label>
                    <Form.Control
                      value={entrega.departamento}
                      onChange={cambiarEntrega('departamento')}
                      maxLength={12}
                    />
                  </Form.Group>
                  <Form.Group controlId="checkout-localidad">
                    <Form.Label>Localidad *</Form.Label>
                    <Form.Control
                      value={entrega.localidad}
                      onChange={cambiarEntrega('localidad')}
                      autoComplete="address-level2"
                      minLength={2}
                      maxLength={80}
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="checkout-cp">
                    <Form.Label>Código postal *</Form.Label>
                    <Form.Control
                      value={entrega.codigoPostal}
                      onChange={evento =>
                        setEntrega(actual => ({
                          ...actual,
                          codigoPostal: evento.target.value.replace(/\D/g, '').slice(0, 4)
                        }))
                      }
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={4}
                      placeholder="1000"
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="checkout-celular">
                    <Form.Label>Celular *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={entrega.celular}
                      onChange={cambiarEntrega('celular')}
                      autoComplete="tel"
                      maxLength={25}
                      placeholder="11 2345-6789"
                      isInvalid={Boolean(entrega.celular.trim()) && !celularValido(entrega.celular)}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Ingresá un celular con código de área (8 a 15 dígitos).
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className={styles.deliveryStreet} controlId="checkout-indicaciones">
                    <Form.Label>Observaciones para la entrega (opcional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={entrega.indicaciones}
                      onChange={cambiarEntrega('indicaciones')}
                      maxLength={300}
                      placeholder="Timbre, entre calles, horario u otra indicación"
                    />
                  </Form.Group>
                </div>
                {envioGratis ? (
                  <Alert variant="success" className={styles.deliveryFeedback}>
                    Envío gratis por superar {formatoPrecio.format(UMBRAL_ENVIO_GRATIS)} en productos.
                  </Alert>
                ) : envios.cargando ? (
                  <p className={styles.deliveryFeedback}>Consultando zonas de envío…</p>
                ) : zonaEnvio ? (
                  <Alert variant="success" className={styles.deliveryFeedback}>
                    Zona {zonaEnvio.nombre}: envío {formatoPrecio.format(zonaEnvio.precio)}.
                  </Alert>
                ) : entrega.codigoPostal.length === 4 && entrega.localidad.trim() && !envios.error ? (
                  <Alert variant="warning" className={styles.deliveryFeedback}>
                    No tenemos una tarifa para ese código postal ni para esa localidad. Revisá los datos o elegí retiro
                    en tienda.
                  </Alert>
                ) : (
                  <p className={styles.deliveryFeedback}>
                    Ingresá el código postal y la localidad para consultar la tarifa.
                  </p>
                )}
              </div>
            )}
                <div className={styles.cartSummary} aria-live="polite">
              <div>
                <span>Artículos</span>
                <strong>{productos.reduce((suma, item) => suma + item.cantidad, 0)}</strong>
              </div>
              {montoDescuento > 0 && (
                <div className={styles.cartDescuento}>
                  <span>Descuento {descuento}%</span>
                  <strong>−{formatoPrecio.format(montoDescuento)}</strong>
                </div>
              )}
              <div>
                <span>Envío</span>
                <strong>
                  {costoEnvio === null
                    ? 'Ingresá un destino válido'
                    : envioGratis
                      ? 'Gratis por compra'
                      : costoEnvio === 0
                        ? 'Sin costo'
                        : formatoPrecio.format(costoEnvio)}
                </strong>
              </div>
              <div className={styles.cartTotal}>
                <span>Total final estimado</span>
                <strong>{formatoPrecio.format(total)}</strong>
              </div>
            </div>
                {!envioGratisPorMonto && (
                  <p className={styles.totalUpdated}>
                    El total se actualiza automáticamente según el código postal o la localidad ingresada.
                  </p>
                )}
              </>
            ) : (
              <section className={styles.orderReview} aria-label="Revisión final del pedido">
                <h3>Revisá tu compra</h3>
                <p className={styles.reviewDestination}>
                  <strong>Entrega:</strong> {textoEntrega}
                  {zonaEnvio && ` · Zona ${zonaEnvio.nombre}`}
                </p>
                <div className={styles.reviewItems}>
                  {productos.map(({producto, cantidad}) => (
                    <div className={styles.reviewItem} key={producto.id}>
                      <span>
                        {cantidad} × {producto.nombre}
                      </span>
                      <strong>{formatoPrecio.format(precioFinal(producto) * cantidad)}</strong>
                    </div>
                  ))}
                </div>
                <div className={styles.cartSummary}>
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatoPrecio.format(subtotal)}</strong>
                  </div>
                  {montoDescuento > 0 && (
                    <div className={styles.cartDescuento}>
                      <span>Descuento {descuento}%</span>
                      <strong>−{formatoPrecio.format(montoDescuento)}</strong>
                    </div>
                  )}
                  <div>
                    <span>Envío</span>
                    <strong>
                      {envioGratis
                        ? 'Gratis por compra'
                        : costoEnvio === 0
                          ? 'Sin costo'
                          : formatoPrecio.format(costoEnvio)}
                    </strong>
                  </div>
                  <div className={styles.cartTotal}>
                    <span>Total a confirmar</span>
                    <strong>{formatoPrecio.format(total)}</strong>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : productos.length === 0 ? (
          <div className={styles.emptyCart}>
            <span className={styles.emptyCartIcon} aria-hidden="true">
              🛒
            </span>
            <h3>Tu carrito está vacío</h3>
            <p>Sumá algo de equipo para tu próxima salida.</p>
          </div>
        ) : (
          <>
            <div className={styles.cartItems}>
              {productos.map(({producto, cantidad}) => (
                <div className={styles.cartItem} key={producto.id}>
                  <img src={producto.imagen} alt="" />
                  <div className={styles.cartItemInfo}>
                    <strong>{producto.nombre}</strong>
                    <div className={styles.cartQuantity} aria-label={`Cantidad de ${producto.nombre}`}>
                      <button
                        type="button"
                        aria-label={`Disminuir cantidad de ${producto.nombre}`}
                        onClick={() => onCambiarCantidad(producto.id, -1)}>
                        −
                      </button>
                      <span>{cantidad}</span>
                      <button
                        type="button"
                        aria-label={`Aumentar cantidad de ${producto.nombre}`}
                        onClick={() => onCambiarCantidad(producto.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className={styles.cartItemPrice}>
                    <strong>{formatoPrecio.format(precioFinal(producto) * cantidad)}</strong>
                    <Button
                      className={styles.removeItem}
                      variant="link"
                      type="button"
                      aria-label={`Quitar ${producto.nombre} del carrito`}
                      title="Quitar del carrito"
                      onClick={() => onQuitar(producto.id)}>
                      <span aria-hidden="true">🗑</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.cartSummary}>
              <div>
                <span>Subtotal</span>
                <strong>{formatoPrecio.format(subtotal)}</strong>
              </div>
              {montoDescuento > 0 && (
                <div className={styles.cartDescuento}>
                  <span>Descuento {descuento}%</span>
                  <strong>−{formatoPrecio.format(montoDescuento)}</strong>
                </div>
              )}
              <div>
                <span>Envío</span>
                <strong>
                  {envioGratisPorMonto ? 'Gratis' : 'A calcular por CP o localidad'}
                </strong>
              </div>
              <div className={styles.cartTotal}>
                <span>Total</span>
                <strong>{formatoPrecio.format(total)}</strong>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {paso === 'confirmacion' ? (
          <Button variant="dark" onClick={cerrar}>
            Cerrar
          </Button>
        ) : paso === 'pago' ? (
          <>
            <Button variant="outline-secondary" onClick={() => setPaso('carrito')}>
              Volver al carrito
            </Button>
            <Button variant="dark" onClick={() => setPaso('revision')} disabled={!pagoValido}>
              Revisar pedido · {formatoPrecio.format(total)}
            </Button>
          </>
        ) : paso === 'revision' ? (
          <>
            <Button variant="outline-secondary" onClick={() => setPaso('pago')} disabled={confirmando}>
              Volver a la entrega
            </Button>
            <Button variant="dark" onClick={confirmarPagoSimulado} disabled={!pagoValido || confirmando}>
              {confirmando ? 'Confirmando stock…' : 'Confirmar compra'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={cerrar}>
              Seguir comprando
            </Button>
            <Button variant="dark" disabled={productos.length === 0} onClick={() => setPaso('pago')}>
              Continuar al pago
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default CartModal;
