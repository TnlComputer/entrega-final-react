import {useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import {precioFinal} from '../../data/modeloCatalogo';
import {UMBRAL_ENVIO_GRATIS, zonaParaCodigoPostal, zonaParaLocalidad} from '../../data/modeloEnvios';
import styles from './CartModal.module.css';

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
  const [entrega, setEntrega] = useState({
    metodo: 'envio',
    busqueda: 'codigoPostal',
    calle: '',
    numero: '',
    localidad: '',
    codigoPostal: ''
  });
  const subtotal = productos.reduce((total, item) => total + precioFinal(item.producto) * item.cantidad, 0);
  // Descuento del anuncio (free day…): se aplica sobre todo el carrito
  const montoDescuento = Math.round((subtotal * descuento) / 100);
  const totalProductos = subtotal - montoDescuento;
  const zonaEnvio =
    entrega.busqueda === 'direccion'
      ? zonaParaLocalidad(envios.zonas, entrega.localidad)
      : zonaParaCodigoPostal(envios.zonas, entrega.codigoPostal);
  const envioGratis = entrega.metodo === 'envio' && Boolean(zonaEnvio) && totalProductos > UMBRAL_ENVIO_GRATIS;
  const costoEnvio =
    entrega.metodo === 'retiro' ? 0 : zonaEnvio ? (envioGratis ? 0 : zonaEnvio.precio) : null;
  const total = subtotal - montoDescuento + (costoEnvio ?? 0);
  const destinoValido =
    entrega.busqueda === 'direccion'
      ? Boolean(
          entrega.calle.trim().length >= 2 &&
            entrega.calle.trim().length <= 120 &&
            /^\d{1,6}(?:\s?[A-Za-z])?$/.test(entrega.numero.trim()) &&
            entrega.localidad.trim().length >= 2 &&
            entrega.localidad.trim().length <= 80 &&
            zonaEnvio
        )
      : Boolean(zonaEnvio);
  const pagoValido = entrega.metodo === 'retiro' || (destinoValido && !envios.cargando);
  const textoEntrega =
    entrega.metodo === 'retiro'
      ? 'Retiro en tienda — coordinar por contacto'
      : entrega.busqueda === 'codigoPostal'
        ? `Código postal ${entrega.codigoPostal}`
        : `${entrega.calle.trim()} ${entrega.numero.trim()}, ${entrega.localidad.trim()}`;

  const cerrar = () => {
    setPaso('carrito');
    setCompraSimulada(null);
    setErrorCompra(null);
    setEntrega({metodo: 'envio', busqueda: 'codigoPostal', calle: '', numero: '', localidad: '', codigoPostal: ''});
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
                <strong>{compraSimulada?.metodo === 'retiro' ? 'Retiro en tienda' : compraSimulada?.zona}</strong>
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
                <p className={styles.deliveryIntro}>Elegí cómo querés calcular la tarifa de envío.</p>
                {envios.error && <Alert variant="danger">No pudimos consultar las tarifas de envío: {envios.error}</Alert>}
                <fieldset className={styles.deliveryOptions}>
                  <legend>Calcular por</legend>
                  <Form.Check
                    type="radio"
                    name="metodo-calculo-envio"
                    id="calculo-codigo-postal"
                    label="Código postal"
                    checked={entrega.busqueda === 'codigoPostal'}
                    onChange={() => setEntrega(actual => ({...actual, busqueda: 'codigoPostal'}))}
                  />
                  <Form.Check
                    type="radio"
                    name="metodo-calculo-envio"
                    id="calculo-direccion"
                    label="Dirección y localidad"
                    checked={entrega.busqueda === 'direccion'}
                    onChange={() => setEntrega(actual => ({...actual, busqueda: 'direccion'}))}
                  />
                </fieldset>
                {entrega.busqueda === 'codigoPostal' ? (
                  <div className={styles.deliveryFields}>
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
                      />
                    </Form.Group>
                  </div>
                ) : (
                  <div className={styles.deliveryFields}>
                    <Form.Group className={styles.deliveryStreet} controlId="checkout-calle">
                      <Form.Label>Calle *</Form.Label>
                      <Form.Control
                        value={entrega.calle}
                        onChange={cambiarEntrega('calle')}
                        autoComplete="street-address"
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
                  </div>
                )}
                {envios.cargando ? (
                  <p className={styles.deliveryFeedback}>Consultando zonas de envío…</p>
                ) : zonaEnvio ? (
                  <Alert variant="success" className={styles.deliveryFeedback}>
                    {envioGratis
                      ? `Zona ${zonaEnvio.nombre}: envío gratis por superar ${formatoPrecio.format(UMBRAL_ENVIO_GRATIS)} en productos.`
                      : `Zona ${zonaEnvio.nombre}: envío ${formatoPrecio.format(zonaEnvio.precio)}.`}
                  </Alert>
                ) : entrega.busqueda === 'codigoPostal' && entrega.codigoPostal.length === 4 && !envios.error ? (
                  <Alert variant="warning" className={styles.deliveryFeedback}>
                    No tenemos una tarifa configurada para ese código postal. Probá otro código o elegí retiro en tienda.
                  </Alert>
                ) : entrega.busqueda === 'direccion' && entrega.localidad.trim() && !envios.error ? (
                  <Alert variant="warning" className={styles.deliveryFeedback}>
                    No encontramos una tarifa para esa localidad. Revisá el nombre o elegí calcular por código postal.
                  </Alert>
                ) : (
                  <p className={styles.deliveryFeedback}>
                    {totalProductos > UMBRAL_ENVIO_GRATIS
                      ? `Con un total de productos mayor a ${formatoPrecio.format(UMBRAL_ENVIO_GRATIS)}, el envío será gratis cuando encontremos una zona.`
                      : entrega.busqueda === 'codigoPostal'
                        ? 'Ingresá un código postal válido de 4 dígitos para consultar la tarifa.'
                        : 'Ingresá una localidad configurada para consultar la tarifa por dirección.'}
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
                <p className={styles.totalUpdated}>
                  El total se actualiza automáticamente según el código postal o la localidad ingresada.
                </p>
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
                  {totalProductos > UMBRAL_ENVIO_GRATIS ? 'Gratis al elegir destino' : 'A calcular por CP o localidad'}
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
