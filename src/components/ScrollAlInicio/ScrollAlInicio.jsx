import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

// Vuelve arriba al cambiar de página
function ScrollAlInicio() {
  const {pathname, hash} = useLocation();

  useEffect(() => {
    // Con #ancla lo resuelve el navegador
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default ScrollAlInicio;
