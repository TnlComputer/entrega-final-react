import {useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import {precioFinal} from '../../data/modeloCatalogo';
import {zonaParaCodigoPostal} from '../../data/modeloEnvios';
import styles from './CartModal.module.css';

function CartModal({
  mostrar,
  productos,
  onCerrar,
  onQuitar,
  onCambiarCantidad,
  onPagoSimulado,
  formatoPrecio,
  descuento = 0,
  envios = {zonas: [], cargando: false, error: null}
}) {
  const [paso, setPaso] = useState('carrito');
  const [compraSimulada, setCompraSimulada] = useState(null);
  const [entrega, setEntrega] = useState({
    metodo: 'envio',
    calle: '',
    numero: '',
    localidad: '',
    codigoPostal: ''
  });
  const subtotal = productos.reduce((total, item) => total + precioFinal(item.producto) * item.cantidad, 0);
  // Descuento del anuncio (free day…): se aplica sobre todo el carrito
  const montoDescuento = Math.round((subtotal * descuento) / 100);
  const zonaEnvio = zonaParaCodigoPostal(envios.zonas, entrega.codigoPostal);
  const costoEnvio = entrega.metodo === 'retiro' ? 0 : zonaEnvio?.precio ?? null;
  const total = subtotal - montoDescuento + (costoEnvio ?? 0);
  const direccionCompleta = Boolean(
    entrega.calle.trim() && entrega.numero.trim() && entrega.localidad.trim() && zonaEnvio && !envios.cargando
  );
  const pagoValido = entrega.metodo === 'retiro' || direccionCompleta;

  const cerrar = () => {
    setPaso('carrito');
    setCompraSimulada(null);
    setEntrega({metodo: 'envio', calle: '', numero: '', localidad: '', codigoPostal: ''});
    onCerrar();
  };

  const confirmarPagoSimulado = () => {
    if (!pagoValido) return;
    setCompraSimulada({
      cantidad: productos.reduce((suma, item) => suma + item.cantidad, 0),
      total,
      metodo: entrega.metodo,
      envio: costoEnvio,
      zona: zonaEnvio?.nombre ?? null,
      direccion:
        entrega.metodo === 'envio'
          ? `${entrega.calle.trim()} ${entrega.numero.trim()}, ${entrega.localidad.trim()} (CP ${entrega.codigoPostal})`
          : 'Retiro en tienda — coordinar por contacto'
    });
    onPagoSimulado();
    setPaso('confirmacion');
  };

  const cambiarEntrega = campo => evento =>
    setEntrega(actual => ({...actual, [campo]: evento.target.value}));

  return (
    <Modal show={mostrar} onHide={cerrar} centered className={styles.cartModal}>
      <Modal.Header closeButton>
        <Modal.Title>
          {paso === 'pago' ? 'Pago de prueba' : paso === 'confirmacion' ? 'Compra de prueba' : 'Tu equipo'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {paso === 'confirmacion' ? (
          <div className={styles.paymentResult} role="status">
            <span className={styles.paymentResultIcon} aria-hidden="true">
              ✓
            </span>
            <h3>Pago simulado aprobado</h3>
            <p>
              Esta compra fue solo una demostración. No se realizó ningún cobro ni se enviaron datos de pago.
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
                <strong>{formatoPrecio.format(compraSimulada?.envio ?? 0)}</strong>
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
        ) : paso === 'pago' ? (
          <div className={styles.paymentStep}>
            <p className={styles.simulationNotice}>
              Estás en una demostración: no ingreses datos de tarjeta. Al confirmar, se vaciará el carrito, pero no se
              procesará ni registrará ningún pago o pedido real.
            </p>
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
                <p className={styles.deliveryIntro}>Ingresá la dirección para calcular la tarifa por zona.</p>
                {envios.error && <Alert variant="danger">No pudimos consultar las tarifas de envío: {envios.error}</Alert>}
                <div className={styles.deliveryFields}>
                  <Form.Group className={styles.deliveryStreet} controlId="checkout-calle">
                    <Form.Label>Calle *</Form.Label>
                    <Form.Control value={entrega.calle} onChange={cambiarEntrega('calle')} autoComplete="street-address" />
                  </Form.Group>
                  <Form.Group controlId="checkout-numero">
                    <Form.Label>Número *</Form.Label>
                    <Form.Control value={entrega.numero} onChange={cambiarEntrega('numero')} inputMode="numeric" />
                  </Form.Group>
                  <Form.Group controlId="checkout-localidad">
                    <Form.Label>Localidad *</Form.Label>
                    <Form.Control value={entrega.localidad} onChange={cambiarEntrega('localidad')} autoComplete="address-level2" />
                  </Form.Group>
                  <Form.Group controlId="checkout-cp">
                    <Form.Label>Código postal *</Form.Label>
                    <Form.Control
                      value={entrega.codigoPostal}
                      onChange={evento =>
                        setEntrega(actual => ({...actual, codigoPostal: evento.target.value.replace(/\D/g, '').slice(0, 4)}))
                      }
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={4}
                      placeholder="1000"
                    />
                  </Form.Group>
                </div>
                {envios.cargando ? (
                  <p className={styles.deliveryFeedback}>Consultando zonas de envío…</p>
                ) : zonaEnvio ? (
                  <Alert variant="success" className={styles.deliveryFeedback}>
                    Zona {zonaEnvio.nombre}: envío {formatoPrecio.format(zonaEnvio.precio)}.
                  </Alert>
                ) : entrega.codigoPostal.length === 4 && !envios.error ? (
                  <Alert variant="warning" className={styles.deliveryFeedback}>
                    No tenemos una tarifa configurada para ese código postal. Probá otro código o elegí retiro en tienda.
                  </Alert>
                ) : (
                  <p className={styles.deliveryFeedback}>El envío se calcula al ingresar un código postal válido de 4 dígitos.</p>
                )}
              </div>
            )}
            <div className={styles.cartSummary}>
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
                  {costoEnvio === null ? 'Ingresá un CP válido' : costoEnvio === 0 ? 'Sin costo' : formatoPrecio.format(costoEnvio)}
                </strong>
              </div>
              <div className={styles.cartTotal}>
                <span>Total con envío</span>
                <strong>{formatoPrecio.format(total)}</strong>
              </div>
            </div>
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
                <strong>A calcular con el código postal</strong>
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
            <Button variant="dark" onClick={confirmarPagoSimulado} disabled={!pagoValido}>
              Confirmar pago simulado
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
