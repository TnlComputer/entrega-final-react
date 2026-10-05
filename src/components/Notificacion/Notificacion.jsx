import styles from './Notificacion.module.css';

function Notificacion({aviso, onCerrar}) {
  if (!aviso) return null;

  return (
    <div className={`${styles.notificacion} ${aviso.tipo === 'error' ? styles.notificacionError : ''}`} role="status">
      <span>{aviso.mensaje}</span>
      <button type="button" aria-label="Cerrar aviso" onClick={onCerrar}>
        ✕
      </button>
    </div>
  );
}

export default Notificacion;
