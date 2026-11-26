import {Container} from 'react-bootstrap';
import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.siteFooter}>
      <Container>
        <div className={styles.footerMain}>
          <section className={styles.footerBrand}>
            <span className={styles.footerKicker}>Casa de pesca · desde Buenos Aires</span>
            <h2>
              El<span>.</span>Anzuelo
            </h2>
            <p>
              Equipo confiable, consejos de pescador a pescador y todo lo que necesitás para preparar la próxima salida.
            </p>
          </section>

          <section className={styles.footerContact} id="contacto">
            <div>
              <span className={styles.footerKicker}>Hablemos</span>
              <a className={styles.footerEmail} href="mailto:hola@elanzuelo.com.ar">
                hola@elanzuelo.com.ar
              </a>
              <p>San Fernando, Buenos Aires</p>
            </div>
            <div>
              <span className={styles.footerKicker}>Medios de pago</span>
              <p>Mercado Pago · tarjetas · transferencia</p>
              <p className={styles.footerNote}>Envíos a todo el país</p>
            </div>
          </section>
        </div>

        <div className={styles.copyright}>
          <span>© 2026 El Anzuelo</span>
          <span>
            Foto de fondo:{' '}
            <a href="https://commons.wikimedia.org/w/index.php?curid=24774351" target="_blank" rel="noreferrer">
              Ritiks
            </a>{' '}
            (CC BY-SA 3.0)
          </span>
          <span>Prepará la caja y salí a pescar.</span>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
