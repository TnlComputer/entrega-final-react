import {useState} from 'react';
import {Alert, Card} from 'react-bootstrap';
import useEquipo from '../hooks/useEquipo';
import styles from './Nosotros.module.css';

function iniciales(nombre) {
  return nombre
    .split(' ')
    .map(parte => parte[0])
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

function Nosotros() {
  const {equipo, cargando, error} = useEquipo();

  return (
    <section className={styles.nosotros}>
      <span className="eyebrow">Casa de pesca · desde Buenos Aires</span>
      <h2>Nuestro equipo</h2>
      <p>Pescadores que asesoran a pescadores: te ayudamos a preparar la próxima salida.</p>

      {cargando && <p>Cargando equipo…</p>}
      {error && <Alert variant="danger">No pudimos cargar el equipo: {error}</Alert>}
      {!cargando && !error && equipo.length === 0 && <p>Todavía no hay integrantes cargados.</p>}

      <div className={styles.teamGrid}>
        {equipo.map(persona => (
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
  );
}

export default Nosotros;
