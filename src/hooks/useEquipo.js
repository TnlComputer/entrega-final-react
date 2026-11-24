import {useEffect, useState} from 'react';
import {cargarEquipo} from '../services/equipoApi';

function useEquipo() {
  const [equipo, setEquipo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    cargarEquipo()
      .then(datos => {
        if (!cancelado) setEquipo(datos);
      })
      .catch(errorCapturado => {
        if (!cancelado) setError(errorCapturado.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return {equipo, cargando, error};
}

export default useEquipo;
