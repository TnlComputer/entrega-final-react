import {useEffect, useState} from 'react';

const CLAVE_FAVORITOS = 'favoritos';

function leerFavoritosGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || {};
  } catch {
    return {};
  }
}

function useFavoritos() {
  const [favoritos, setFavoritos] = useState(leerFavoritosGuardados);

  useEffect(() => {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
  }, [favoritos]);

  const alternarFavorito = id => {
    setFavoritos(favoritosActuales => {
      const favoritosNuevos = {...favoritosActuales};
      if (favoritosNuevos[id]) {
        delete favoritosNuevos[id];
      } else {
        favoritosNuevos[id] = true;
      }
      return favoritosNuevos;
    });
  };

  return {favoritos, alternarFavorito};
}

export default useFavoritos;
