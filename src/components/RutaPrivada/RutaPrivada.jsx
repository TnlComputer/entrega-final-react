import {Navigate, useLocation} from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Pide sesión y, con soloAdmin, permiso de administrador
function RutaPrivada({soloAdmin = false, children}) {
  const {usuario, esAdmin, cargando} = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <p>Verificando sesión…</p>;

  if (!usuario) {
    return <Navigate to="/login" replace state={{desde: ubicacion.pathname}} />;
  }

  if (soloAdmin && !esAdmin) return <Navigate to="/perfil" replace />;

  return children;
}

export default RutaPrivada;
