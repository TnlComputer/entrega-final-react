import {useEffect, useState} from 'react';

function useEquipo() {
  const [equipo, setEquipo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    fetch(`${import.meta.env.BASE_URL}data/equipo.json`)
      .then(respuesta => {
        if (!respuesta.ok) {
          throw new Error('No se pudo obtener el equipo');
        }

        return respuesta.json();
      })
      .then(datos => {
        if (!cancelado) setEquipo(datos.equipo);
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
