import {useEffect, useRef, useState} from 'react';
import {Badge, Button, Container, Nav, Navbar} from 'react-bootstrap';
import {Link, useLocation} from 'react-router-dom';
import styles from './NavBar.module.css';

function NavBar({cantidadCarrito, onAbrirCarrito}) {
  const [pegado, setPegado] = useState(false);
  const centinelaRef = useRef(null);
  const {pathname, hash} = useLocation();

  // Enlace activo según la sección o la página
  const seccion = hash === '#nosotros' || hash === '#contacto' ? hash : pathname;

  useEffect(() => {
    const centinela = centinelaRef.current;
    if (!centinela) return;

    const actualizar = () => {
      const altoAnuncio = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-anuncio')) || 0;
      setPegado(centinela.getBoundingClientRect().top < altoAnuncio);
    };
    actualizar();
    window.addEventListener('scroll', actualizar, {passive: true});
    window.addEventListener('resize', actualizar);

    return () => {
      window.removeEventListener('scroll', actualizar);
      window.removeEventListener('resize', actualizar);
    };
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
              <Nav.Link as={Link} to="/" active={seccion === '/'}>
                Inicio
              </Nav.Link>
              <Nav.Link as={Link} to="/productos" active={seccion === '/productos'}>
                Catálogo
              </Nav.Link>
              <Nav.Link href="#nosotros" active={seccion === '#nosotros'}>
                La casa
              </Nav.Link>
              <Nav.Link href="#contacto" active={seccion === '#contacto'}>
                Contacto
              </Nav.Link>
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
