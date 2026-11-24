const CLAVE_VISITANTE = 'visitante';

// Identifica al navegador de quien entra sin cuenta
export function obtenerVisitante() {
  let visitante = localStorage.getItem(CLAVE_VISITANTE);
  if (!visitante) {
    visitante = crypto.randomUUID();
    localStorage.setItem(CLAVE_VISITANTE, visitante);
  }
  return visitante;
}
