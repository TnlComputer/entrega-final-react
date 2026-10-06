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
      // Si no se puede leer, la tienda sigue igual, sin anuncio
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
    // Lo usa el panel después de guardar en Firestore
    reemplazarAnuncio: setAnuncio
  };
}

export default useAnuncio;
