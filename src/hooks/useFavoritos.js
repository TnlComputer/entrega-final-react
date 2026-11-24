import {useSyncExternalStore} from 'react';

const CLAVE_FAVORITOS = 'favoritos';

function leerFavoritosGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || {};
  } catch {
    return {};
  }
}

// Compartido entre todas las listas de la página
let favoritosActuales = leerFavoritosGuardados();
const suscriptos = new Set();

function suscribir(avisar) {
  suscriptos.add(avisar);
  return () => suscriptos.delete(avisar);
}

function alternarFavorito(id) {
  const favoritosNuevos = {...favoritosActuales};
  if (favoritosNuevos[id]) {
    delete favoritosNuevos[id];
  } else {
    favoritosNuevos[id] = true;
  }
  favoritosActuales = favoritosNuevos;
  localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritosActuales));
  suscriptos.forEach(avisar => avisar());
}

function useFavoritos() {
  const favoritos = useSyncExternalStore(suscribir, () => favoritosActuales);

  return {favoritos, alternarFavorito};
}

export default useFavoritos;
