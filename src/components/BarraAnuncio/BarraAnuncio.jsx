import {useEffect, useRef} from 'react';
import {estadoAnuncio} from '../../data/modeloAnuncio';
import styles from './BarraAnuncio.module.css';

// Solo se muestra si el anuncio está vigente (vistaPrevia: siempre)
function BarraAnuncio({anuncio, vistaPrevia = false}) {
  const barraRef = useRef(null);
  const visible = vistaPrevia || estadoAnuncio(anuncio) === 'visible';

  // Alto de la barra, para ubicar el menú fijo debajo
  useEffect(() => {
    const barra = barraRef.current;
    if (vistaPrevia || !barra) return;

    const raiz = document.documentElement;
    const observer = new ResizeObserver(() => raiz.style.setProperty('--alto-anuncio', `${barra.offsetHeight}px`));
    observer.observe(barra);

    return () => {
      observer.disconnect();
      raiz.style.removeProperty('--alto-anuncio');
    };
  }, [visible, vistaPrevia]);

  if (!visible) return null;

  return (
    <aside
      ref={barraRef}
      className={`${styles.barraAnuncio} ${vistaPrevia ? '' : styles.fija}`}
      aria-label="Anuncio">
      <span className={styles.icono} aria-hidden="true">
        🎣
      </span>
      <p>{anuncio.texto || 'Acá va el texto del anuncio'}</p>
      {anuncio.descuento > 0 && <strong className={styles.descuento}>{anuncio.descuento}% OFF al pagar</strong>}
    </aside>
  );
}

export default BarraAnuncio;
