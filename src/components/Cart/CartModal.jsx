import {Button, Modal} from 'react-bootstrap';
import {precioFinal} from '../../data/modeloCatalogo';
import styles from './CartModal.module.css';

function CartModal({mostrar, productos, onCerrar, onQuitar, onCambiarCantidad, formatoPrecio, descuento = 0}) {
  const subtotal = productos.reduce((total, item) => total + precioFinal(item.producto) * item.cantidad, 0);
  // Descuento del anuncio (free day…): se aplica sobre todo el carrito
  const montoDescuento = Math.round((subtotal * descuento) / 100);
  const envio = productos.length > 0 ? 0 : 0;

  return (
    <Modal show={mostrar} onHide={onCerrar} centered className={styles.cartModal}>
      <Modal.Header closeButton>
        <Modal.Title>Tu equipo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {productos.length === 0 ? (
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
                <strong>{envio === 0 ? 'A calcular' : formatoPrecio.format(envio)}</strong>
              </div>
              <div className={styles.cartTotal}>
                <span>Total</span>
                <strong>{formatoPrecio.format(subtotal - montoDescuento + envio)}</strong>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCerrar}>
          Seguir comprando
        </Button>
        <Button variant="dark" disabled={productos.length === 0}>
          Continuar al pago
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CartModal;
