import {useEffect, useState} from 'react';
import {ANUNCIO_VACIO} from '../data/modeloAnuncio';
import {cargarAnuncio} from '../services/productosApi';

function useAnuncio() {
  const [anuncio, setAnuncio] = useState(ANUNCIO_VACIO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    cargarAnuncio()
      .then(datos => {
        if (!cancelado) setAnuncio(datos);
      })
      // Si falla, sigue sin anuncio
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return {
    anuncio,
    cargando,
    // Se usa al guardar en el panel
    reemplazarAnuncio: setAnuncio
  };
}

export default useAnuncio;
