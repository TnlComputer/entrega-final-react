import {useEffect, useState} from 'react';
import {ANUNCIO_VACIO} from '../data/modeloAnuncio';

function useAnuncio() {
  const [anuncio, setAnuncio] = useState(ANUNCIO_VACIO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    // no-store: después de editarlo en el panel queremos el archivo nuevo
    fetch(`${import.meta.env.BASE_URL}data/anuncio.json`, {cache: 'no-store'})
      .then(respuesta => (respuesta.ok ? respuesta.json() : ANUNCIO_VACIO))
      .then(datos => {
        if (!cancelado) setAnuncio({...ANUNCIO_VACIO, ...datos});
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
    // Lo usa el panel después de guardar en el JSON
    reemplazarAnuncio: setAnuncio
  };
}

export default useAnuncio;
