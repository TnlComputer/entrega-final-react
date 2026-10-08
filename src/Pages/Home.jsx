import {Link, useOutletContext} from 'react-router-dom';
import heroImage from '../assets/hero.jpg';
import ItemListContainer from '../components/ItemListContainer/ItemListContainer';
import styles from './Home.module.css';

function Home() {
  const {onAgregarAlCarrito, catalogo, comprasConfirmadas} = useOutletContext();

  return (
    <section className="home-page">
      <div className={styles.hero}>
        <div className={styles.heroSection}>
          <div className={styles.heroCopy}>
            <span className="eyebrow">Casa de pesca · Buenos Aires</span>
            <h2>Todo listo para salir a pescar.</h2>
            <p>Equipo confiable, buenos precios y asesoramiento de pescador a pescador. Prepará la caja y mandale.</p>
            <div className={styles.heroAcciones}>
              <a className={styles.botonPrincipal} href="#destacados">
                Ver destacados
              </a>
              <Link className={styles.botonSecundario} to="/productos">
                Catálogo completo
              </Link>
            </div>
          </div>
          <figure className={styles.heroArt}>
            <img src={heroImage} alt="Bote de pesca amarrado en la costa" />
            <figcaption>salí a pescar</figcaption>
          </figure>
        </div>

        <div className={styles.trustRow} aria-label="Beneficios de compra">
          <span>Envíos a todo el país</span>
          <span>3 cuotas sin interés</span>
          <span>Asesoramiento de pescador</span>
        </div>
      </div>

      <ItemListContainer
        catalogo={catalogo}
        onAgregarAlCarrito={onAgregarAlCarrito}
        comprasConfirmadas={comprasConfirmadas}
        soloDestacados
      />
    </section>
  );
}

export default Home;
