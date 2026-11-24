import {Button} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {fechaHora} from '../../data/modeloCupones';
import useAuth from '../../hooks/useAuth';
import useCupones from '../../hooks/useCupones';
import styles from './CartModal.module.css';

function CuponesCarrito({onIrALogin}) {
  const {usuario} = useAuth();
  const {activos, cuponAplicado, aplicarCupon, quitarCupon} = useCupones();

  if (!usuario) {
    return (
      <p className={styles.cuponAviso}>
        ¿Tenés un cupón?{' '}
        <Link to="/login" state={{desde: '/productos'}} onClick={onIrALogin}>
          Ingresá para usarlo
        </Link>
      </p>
    );
  }

  return activos.map(cupon => {
    const aplicado = cupon.codigo === cuponAplicado?.codigo;
    return (
      <div className={styles.cupon} key={cupon.codigo}>
        <span>
          <strong>
            {cupon.codigo} · {cupon.porcentaje}%
          </strong>
          <small>Vence el {fechaHora(cupon.venceEn)}</small>
        </span>
        <Button
          size="sm"
          variant={aplicado ? 'outline-secondary' : 'dark'}
          aria-label={`${aplicado ? 'Quitar' : 'Aplicar'} el cupón ${cupon.codigo}`}
          onClick={() => (aplicado ? quitarCupon() : aplicarCupon(cupon.codigo))}>
          {aplicado ? 'Quitar' : 'Aplicar'}
        </Button>
      </div>
    );
  });
}

export default CuponesCarrito;
