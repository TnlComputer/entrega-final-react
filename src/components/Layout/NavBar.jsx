import {useEffect, useRef, useState} from 'react';
import {Badge, Button, Container, Nav, Navbar} from 'react-bootstrap';
import styles from './NavBar.module.css';

function NavBar({cantidadCarrito, onAbrirCarrito}) {
  const [pegado, setPegado] = useState(false);
  const centinelaRef = useRef(null);

  useEffect(() => {
    const centinela = centinelaRef.current;
    if (!centinela) return;

    const observer = new IntersectionObserver(([entrada]) => setPegado(!entrada.isIntersecting), {
      threshold: 0,
      rootMargin: '-1px 0px 0px 0px'
    });
    observer.observe(centinela);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={centinelaRef} className={styles.navCentinela} aria-hidden="true" />
      <Navbar className={styles.siteNav} expand="md" variant="dark">
        <Container className={styles.navContainer}>
          {pegado && (
            <a className={`${styles.navBrand} ${styles.fadeIn}`} href={import.meta.env.BASE_URL}>
              El<span>.</span>Anzuelo
            </a>
          )}
          <Navbar.Toggle aria-controls="main-navigation" />
          <Navbar.Collapse id="main-navigation">
            <Nav className="mx-auto">
              <Nav.Link href={import.meta.env.BASE_URL}>Inicio</Nav.Link>
              <Nav.Link href={`${import.meta.env.BASE_URL}#destacados`}>Catálogo</Nav.Link>
              <Nav.Link href="#nosotros">La casa</Nav.Link>
              <Nav.Link href="#contacto">Contacto</Nav.Link>
            </Nav>
          </Navbar.Collapse>
          {pegado && (
            <Button
              className={`${styles.stickyCart} ${styles.fadeIn}`}
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
      </Navbar>
    </>
  );
}

export default NavBar;
