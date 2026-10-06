import {Navigate, useLocation} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Solo muestra la página con sesión iniciada. Esto es para la interfaz:
// la protección real está en las reglas de Firestore (firestore.rules) y en
// /api/imagenes, que rechazan cualquier cambio de quien no sea admin.
function RutaPrivada({children}) {
  const {esAdmin, cargando} = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <p>Verificando sesión…</p>;

  if (!esAdmin) {
    return <Navigate to="/login" replace state={{desde: ubicacion.pathname}} />;
  }

  return children;
}

export default RutaPrivada;
