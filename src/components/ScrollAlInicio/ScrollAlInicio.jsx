import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

// React Router no vuelve arriba al cambiar de página: sin esto, al tocar
// "Administración" en el pie la página nueva se abre scrolleada abajo.
function ScrollAlInicio() {
  const {pathname, hash} = useLocation();

  useEffect(() => {
    // Con #ancla (ej. /#destacados) dejamos que el navegador vaya a la sección
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default ScrollAlInicio;
