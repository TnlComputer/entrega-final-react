import {useEffect, useState} from 'react';
import {cargarEnvios} from '../services/productosApi';

function useEnvios() {
  const [zonas, setZonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    cargarEnvios()
      .then(datos => {
        if (!cancelado) setZonas(datos);
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

  return {
    zonas,
    cargando,
    error,
    reemplazarZonas: setZonas
  };
}

export default useEnvios;
