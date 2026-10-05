import {estadoAnuncio} from '../../data/modeloAnuncio';
import styles from './BarraAnuncio.module.css';

// Franja arriba de toda la página. Solo aparece si el anuncio está activo y
// dentro de sus fechas; vistaPrevia la muestra siempre (para el panel).
function BarraAnuncio({anuncio, vistaPrevia = false}) {
  if (!vistaPrevia && estadoAnuncio(anuncio) !== 'visible') return null;

  return (
    <aside className={styles.barraAnuncio} aria-label="Anuncio">
      <span className={styles.icono} aria-hidden="true">
        🎣
      </span>
      <p>{anuncio.texto || 'Acá va el texto del anuncio'}</p>
      {anuncio.descuento > 0 && <strong className={styles.descuento}>{anuncio.descuento}% OFF al pagar</strong>}
    </aside>
  );
}

export default BarraAnuncio;
