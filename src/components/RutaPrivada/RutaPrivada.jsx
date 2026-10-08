import {Navigate, useLocation} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Solo con sesión iniciada
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
