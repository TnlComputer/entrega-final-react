import {Button, Modal} from 'react-bootstrap';
import {HORAS_VALIDEZ, fechaHora} from '../../data/modeloCupones';
import useAuth from '../../hooks/useAuth';
import useCupones from '../../hooks/useCupones';
import styles from './CuponModal.module.css';

function CuponModal() {
  const {usuario} = useAuth();
  const {entrada, cerrarEntrada, aplicarCupon} = useCupones();

  if (!entrada) return null;

  const {cupon, nuevo} = entrada;

  const usar = () => {
    aplicarCupon(cupon.codigo);
    cerrarEntrada();
  };

  return (
    <Modal show onHide={cerrarEntrada} centered className={styles.cuponModal} aria-labelledby="cupon-titulo">
      <Modal.Header closeButton />
      <Modal.Body>
        <span className="eyebrow">{nuevo ? '¡Buena pesca!' : 'Te queda un cupón'}</span>
        <h2 id="cupon-titulo">{cupon.porcentaje}% de descuento</h2>
        <p>{nuevo ? 'Te ganaste un cupón por entrar a la tienda.' : 'Todavía no usaste tu cupón.'}</p>
        <strong className={styles.codigo}>{cupon.codigo}</strong>
        <p>
          Vale por {HORAS_VALIDEZ} horas y una sola compra.
          <br />
          Vence el <strong>{fechaHora(cupon.venceEn)}</strong>.
        </p>
        {!usuario && <p>No hace falta registrarte; si lo hacés, te queda guardado en tu cuenta.</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={cerrarEntrada}>
          Más tarde
        </Button>
        <Button variant="dark" onClick={usar}>
          Aplicar a mi compra
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CuponModal;
