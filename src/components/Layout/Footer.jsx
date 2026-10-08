import {useState} from 'react';
import {Card, Container} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import useEquipo from '../../hooks/useEquipo';
import styles from './Footer.module.css';

function iniciales(nombre) {
  return nombre
    .split(' ')
    .map((parte) => parte[0])
    .join('');
}

function Avatar({persona}) {
  const [fallo, setFallo] = useState(false);

  if (!persona.avatar || fallo) {
    return (
      <span className={styles.teamAvatar} aria-hidden="true">
        {iniciales(persona.nombre)}
      </span>
    );
  }

  return (
    <img
      className={styles.teamAvatar}
      src={persona.avatar}
      alt={`Foto de ${persona.nombre}`}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  );
}

function Footer() {
  const {equipo, cargando, error} = useEquipo();

  return (
    <footer className={styles.siteFooter}>
      <Container>
        <div className={styles.footerMain}>
          <section className={styles.footerBrand} id="nosotros">
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

        <section className={styles.footerTeam} id="equipo">
          <span className={styles.footerKicker}>Nuestro equipo</span>
          {cargando && <p>Cargando equipo…</p>}
          {error && <p role="alert">No pudimos cargar el equipo: {error}</p>}
          <div className={styles.teamGrid}>
            {equipo.map((persona) => (
              <Card key={persona.email} className={styles.teamCard}>
                <Card.Body>
                  <Avatar persona={persona} />
                  <Card.Title as="h3">{persona.nombre}</Card.Title>
                  <Card.Subtitle>{persona.rol}</Card.Subtitle>
                  <Card.Text>{persona.detalle}</Card.Text>
                  <a href={`mailto:${persona.email}`}>{persona.email}</a>
                </Card.Body>
              </Card>
            ))}
          </div>
        </section>

        <div className={styles.copyright}>
          <span>
            © 2026 El Anzuelo · <Link to="/admin">Administración</Link>
          </span>
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
