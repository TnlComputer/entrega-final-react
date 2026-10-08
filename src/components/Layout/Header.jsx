import {Badge, Button, Container} from 'react-bootstrap';
import styles from './Header.module.css';

function Header({cantidadCarrito = 0, onAbrirCarrito}) {
  return (
    <header className={styles.siteHeader}>
      <Container fluid className={styles.headerContainer}>
        <a className={styles.brand} href={import.meta.env.BASE_URL}>
          El<span>.</span>Anzuelo
        </a>
        <p>Casa de pesca</p>
        {/* Carrito, si tiene productos */}
        {cantidadCarrito > 0 && (
          <Button
            className={styles.headerCart}
            variant="outline-light"
            type="button"
            aria-label="Abrir carrito de compra"
            title="Abrir carrito de compra"
            onClick={onAbrirCarrito}>
            <span className={styles.cartIcon} aria-hidden="true">
              🛒
            </span>
            <Badge bg="warning" text="dark">
              {cantidadCarrito}
            </Badge>
          </Button>
        )}
      </Container>
    </header>
  );
}

export default Header;
