import {useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import {precioFinal} from '../../data/modeloCatalogo';
import {
  CUOTAS,
  DATOS_TRANSFERENCIA,
  MAX_EMAIL,
  METODOS_PAGO,
  cvvValido,
  emailValido,
  marcaTarjeta,
  normalizarEmail,
  numeroTarjetaValido,
  pagoCompleto,
  resumenPago,
  textoPago,
  titularValido,
  vencimientoValido
} from '../../data/modeloCompra';
import {
  UMBRAL_ENVIO_GRATIS,
  celularValido,
  zonaParaCodigoPostal,
  zonaParaLocalidad
} from '../../data/modeloEnvios';
import styles from './CartModal.module.css';

const PASOS_CHECKOUT = [
  {id: 'contacto', nombre: 'Contacto'},
  {id: 'entrega', nombre: 'Entrega'},
  {id: 'pago', nombre: 'Pago'},
  {id: 'revision', nombre: 'Revisión'}
];

const PAGO_VACIO = {
  metodo: 'tarjetaCredito',
  numero: '',
  titular: '',
  vencimiento: '',
  cvv: '',
  cuotas: '1',
  emailMercadoPago: ''
};

// Número de tarjeta de a 4 dígitos
const formatearNumeroTarjeta = valor =>
  valor
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatearVencimiento = valor => {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
};

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
  const [email, setEmail] = useState('');
  // La tarjeta completa no sale del navegador
  const [pago, setPago] = useState(PAGO_VACIO);
  const subtotal = productos.reduce((total, item) => total + precioFinal(item.producto) * item.cantidad, 0);
  // Descuento del anuncio sobre el total
  const montoDescuento = Math.round((subtotal * descuento) / 100);
  const totalProductos = subtotal - montoDescuento;
  // Envío gratis desde el umbral
  const envioGratisPorMonto = totalProductos > UMBRAL_ENVIO_GRATIS;
  const envioGratis = entrega.metodo === 'envio' && envioGratisPorMonto;
  // Tarifa por código postal o, si no hay, por localidad
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
  const contactoValido = emailValido(email);
  const entregaValida =
    entrega.metodo === 'retiro' || (destinoValido && (envioGratis || !envios.cargando));
  const pagoValido = contactoValido && entregaValida && pagoCompleto(pago);
  const marca = marcaTarjeta(pago.numero);
  const esTarjeta = pago.metodo === 'tarjetaCredito' || pago.metodo === 'tarjetaDebito';
  const campoInvalido = (valor, valido) => Boolean(String(valor).trim()) && !valido;
  const cambiarPago = campo => evento => setPago(actual => ({...actual, [campo]: evento.target.value}));
  const elegirMetodoPago = metodo =>
    setPago(actual => ({
      ...actual,
      metodo,
      emailMercadoPago: actual.emailMercadoPago || normalizarEmail(email)
    }));
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
    setEmail('');
    setPago(PAGO_VACIO);
    onCerrar();
  };

  const confirmarPagoSimulado = async () => {
    if (!pagoValido || confirmando) return;
    setErrorCompra(null);
    setConfirmando(true);
    try {
      const resultado = await onPagoSimulado({
        items: productos.map(({producto, cantidad}) => ({id: producto.id, cantidad})),
        entrega,
        email: normalizarEmail(email),
        pago: resumenPago(pago)
      });
      // Se borran los datos de la tarjeta
      setPago(PAGO_VACIO);
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
          {paso === 'contacto'
            ? 'Tus datos'
            : paso === 'entrega'
            ? 'Entrega y envío'
            : paso === 'pago'
            ? 'Forma de pago'
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
            <h3>Pago aprobado (simulado)</h3>
            <p>
              Pedido <strong>{compraSimulada?.numero}</strong>. Esta compra fue solo una demostración: no se realizó
              ningún cobro ni se envió un email; el stock sí se actualizó en el catálogo.
            </p>
            <section className={styles.orderReview} aria-label="Resumen de la compra">
              <p className={styles.reviewDestination}>
                <strong>Entrega:</strong> {compraSimulada?.direccion}
                {compraSimulada?.zona && ` · Zona ${compraSimulada.zona}`}
                <br />
                <strong>Pago:</strong> {compraSimulada?.pagoTexto}
                <br />
                <strong>Resumen para:</strong> {compraSimulada?.email} (en la demo no se envía)
              </p>
              <div className={styles.reviewItems}>
                {compraSimulada?.items.map(item => (
                  <div className={styles.reviewItem} key={item.id}>
                    <span>
                      {item.cantidad} × {item.nombre}
                    </span>
                    <strong>{formatoPrecio.format(item.total)}</strong>
                  </div>
                ))}
              </div>
              <div className={styles.cartSummary}>
                <div>
                  <span>Subtotal</span>
                  <strong>{formatoPrecio.format(compraSimulada?.subtotal ?? 0)}</strong>
                </div>
                {compraSimulada?.montoDescuento > 0 && (
                  <div className={styles.cartDescuento}>
                    <span>Descuento {compraSimulada.descuento}%</span>
                    <strong>−{formatoPrecio.format(compraSimulada.montoDescuento)}</strong>
                  </div>
                )}
                <div>
                  <span>Envío</span>
                  <strong>
                    {compraSimulada?.metodo === 'retiro'
                      ? 'Sin costo'
                      : compraSimulada?.envioGratis
                        ? 'Gratis por compra'
                        : formatoPrecio.format(compraSimulada?.envio ?? 0)}
                  </strong>
                </div>
                <div className={styles.cartTotal}>
                  <span>Total pagado (simulado)</span>
                  <strong>{formatoPrecio.format(compraSimulada?.total ?? 0)}</strong>
                </div>
              </div>
            </section>
          </div>
        ) : PASOS_CHECKOUT.some(({id}) => id === paso) ? (
          <div className={styles.paymentStep}>
            <ol className={styles.checkoutSteps} aria-label="Pasos de la compra">
              {PASOS_CHECKOUT.map(({id, nombre}, indice) => (
                <li
                  key={id}
                  className={id === paso ? styles.checkoutStepActual : ''}
                  aria-current={id === paso ? 'step' : undefined}>
                  {indice + 1}. {nombre}
                </li>
              ))}
            </ol>
            {paso === 'contacto' && (
              <p className={styles.simulationNotice}>
                Estás en una demostración: no ingreses datos de tarjeta. No se procesa ningún pago real; al confirmar
                la compra, se validará y descontará el stock disponible.
              </p>
            )}
            {errorCompra && <Alert variant="danger" role="alert">{errorCompra}</Alert>}
            {paso === 'contacto' ? (
              <Form.Group className={styles.contactEmail} controlId="checkout-email">
                  <Form.Label>Email para el resumen de compra *</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={evento => setEmail(evento.target.value)}
                    autoComplete="email"
                    maxLength={MAX_EMAIL}
                    placeholder="nombre@correo.com"
                    isInvalid={Boolean(email.trim()) && !emailValido(email)}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Ingresá un email válido.</Form.Control.Feedback>
                </Form.Group>
            ) : paso === 'entrega' ? (
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
            ) : paso === 'pago' ? (
              <>
                <fieldset className={styles.deliveryOptions}>
                  <legend>Elegí cómo pagar</legend>
                  {METODOS_PAGO.map(({id, nombre}) => (
                    <Form.Check
                      key={id}
                      type="radio"
                      name="metodo-pago"
                      id={`pago-${id}`}
                      label={nombre}
                      checked={pago.metodo === id}
                      onChange={() => elegirMetodoPago(id)}
                    />
                  ))}
                </fieldset>
                <p className={styles.deliveryIntro}>
                  Simulación: usá datos de prueba (por ejemplo, la tarjeta 4111 1111 1111 1111). No se cobra nada y los
                  datos de la tarjeta no salen de tu navegador.
                </p>
                {esTarjeta && (
                  <div className={styles.deliveryFields}>
                    <Form.Group className={styles.deliveryStreet} controlId="pago-numero">
                      <Form.Label>Número de tarjeta *{pago.numero && ` · ${marca}`}</Form.Label>
                      <Form.Control
                        value={pago.numero}
                        onChange={evento => setPago(actual => ({...actual, numero: formatearNumeroTarjeta(evento.target.value)}))}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4111 1111 1111 1111"
                        isInvalid={pago.numero.replace(/\D/g, '').length >= 13 && !numeroTarjetaValido(pago.numero)}
                        required
                      />
                      <Form.Control.Feedback type="invalid">Revisá el número de la tarjeta.</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className={styles.deliveryStreet} controlId="pago-titular">
                      <Form.Label>Nombre como figura en la tarjeta *</Form.Label>
                      <Form.Control
                        value={pago.titular}
                        onChange={cambiarPago('titular')}
                        autoComplete="cc-name"
                        maxLength={80}
                        isInvalid={campoInvalido(pago.titular, titularValido(pago.titular))}
                        required
                      />
                    </Form.Group>
                    <Form.Group controlId="pago-vencimiento">
                      <Form.Label>Vencimiento *</Form.Label>
                      <Form.Control
                        value={pago.vencimiento}
                        onChange={evento =>
                          setPago(actual => ({...actual, vencimiento: formatearVencimiento(evento.target.value)}))
                        }
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        isInvalid={pago.vencimiento.length === 5 && !vencimientoValido(pago.vencimiento)}
                        required
                      />
                      <Form.Control.Feedback type="invalid">La tarjeta está vencida o la fecha no es válida.</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group controlId="pago-cvv">
                      <Form.Label>Código de seguridad *</Form.Label>
                      {/* Con type="password" el navegador lo toma como login */}
                      <Form.Control
                        type="text"
                        value={pago.cvv}
                        onChange={evento =>
                          setPago(actual => ({...actual, cvv: evento.target.value.replace(/\D/g, '').slice(0, 4)}))
                        }
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder={marca === 'American Express' ? '4 dígitos' : '3 dígitos'}
                        isInvalid={campoInvalido(pago.cvv, cvvValido(pago.cvv, marca))}
                        required
                      />
                    </Form.Group>
                    {pago.metodo === 'tarjetaCredito' && (
                      <Form.Group controlId="pago-cuotas">
                        <Form.Label>Cuotas</Form.Label>
                        <Form.Select value={pago.cuotas} onChange={cambiarPago('cuotas')}>
                          {CUOTAS.map(cuotas => (
                            <option key={cuotas} value={cuotas}>
                              {cuotas === 1
                                ? `1 pago de ${formatoPrecio.format(total)}`
                                : `${cuotas} cuotas sin interés de ${formatoPrecio.format(Math.ceil(total / cuotas))}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}
                  </div>
                )}
                {pago.metodo === 'transferencia' && (
                  <>
                    <div className={styles.cartSummary}>
                      <div>
                        <span>Titular</span>
                        <strong>{DATOS_TRANSFERENCIA.titular}</strong>
                      </div>
                      <div>
                        <span>Alias</span>
                        <strong>{DATOS_TRANSFERENCIA.alias}</strong>
                      </div>
                      <div>
                        <span>CBU</span>
                        <strong>{DATOS_TRANSFERENCIA.cbu}</strong>
                      </div>
                      <div>
                        <span>Importe</span>
                        <strong>{formatoPrecio.format(total)}</strong>
                      </div>
                    </div>
                    <Form.Group className={styles.contactEmail} controlId="pago-titular-transferencia">
                      <Form.Label>Titular de la cuenta desde la que transferís *</Form.Label>
                      <Form.Control
                        value={pago.titular}
                        onChange={cambiarPago('titular')}
                        autoComplete="name"
                        maxLength={80}
                        isInvalid={campoInvalido(pago.titular, titularValido(pago.titular))}
                        required
                      />
                    </Form.Group>
                  </>
                )}
                {pago.metodo === 'mercadoPago' && (
                  <Form.Group className={styles.contactEmail} controlId="pago-email-mp">
                    <Form.Label>Email de tu cuenta de Mercado Pago *</Form.Label>
                    <Form.Control
                      type="email"
                      value={pago.emailMercadoPago}
                      onChange={cambiarPago('emailMercadoPago')}
                      autoComplete="email"
                      maxLength={MAX_EMAIL}
                      isInvalid={campoInvalido(pago.emailMercadoPago, emailValido(pago.emailMercadoPago))}
                      required
                    />
                    <Form.Text>En una tienda real te llevaríamos a Mercado Pago para aprobar el pago.</Form.Text>
                  </Form.Group>
                )}
              </>
            ) : (
              <section className={styles.orderReview} aria-label="Revisión final del pedido">
                <h3>Revisá tu compra</h3>
                <p className={styles.reviewDestination}>
                  <strong>Entrega:</strong> {textoEntrega}
                  {zonaEnvio && ` · Zona ${zonaEnvio.nombre}`}
                  <br />
                  <strong>Pago:</strong> {pagoCompleto(pago) && textoPago(resumenPago(pago))}
                  <br />
                  <strong>Resumen a:</strong> {normalizarEmail(email)}
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
        ) : paso === 'contacto' ? (
          <>
            <Button variant="outline-secondary" onClick={() => setPaso('carrito')}>
              Volver al carrito
            </Button>
            <Button variant="dark" onClick={() => setPaso('entrega')} disabled={!contactoValido}>
              Continuar a la entrega
            </Button>
          </>
        ) : paso === 'entrega' ? (
          <>
            <Button variant="outline-secondary" onClick={() => setPaso('contacto')}>
              Volver
            </Button>
            <Button variant="dark" onClick={() => setPaso('pago')} disabled={!entregaValida}>
              Continuar al pago · {formatoPrecio.format(total)}
            </Button>
          </>
        ) : paso === 'pago' ? (
          <>
            <Button variant="outline-secondary" onClick={() => setPaso('entrega')}>
              Volver
            </Button>
            <Button variant="dark" onClick={() => setPaso('revision')} disabled={!pagoValido}>
              Revisar pedido
            </Button>
          </>
        ) : paso === 'revision' ? (
          <>
            <Button variant="outline-secondary" onClick={() => setPaso('pago')} disabled={confirmando}>
              Volver al pago
            </Button>
            <Button variant="dark" onClick={confirmarPagoSimulado} disabled={!pagoValido || confirmando}>
              {confirmando ? 'Procesando pago…' : `Pagar ${formatoPrecio.format(total)} (simulado)`}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={cerrar}>
              Seguir comprando
            </Button>
            <Button variant="dark" disabled={productos.length === 0} onClick={() => setPaso('contacto')}>
              Continuar al pago
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default CartModal;
