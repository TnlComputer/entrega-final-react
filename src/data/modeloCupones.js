// Cupones (Firestore: colección cupones)
export const PORCENTAJE_CUPON = 5;
export const PORCENTAJE_MAXIMO = 50;
export const HORAS_VALIDEZ = 12;
export const ENTRADAS_POR_CUPON = 3;

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FORMATO_CODIGO = /^ANZ-[A-Z2-9]{8}$/;

const formatoFechaHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

export const fechaHora = iso => `${formatoFechaHora.format(new Date(iso))} hs`;

export const codigoValido = codigo => typeof codigo === 'string' && FORMATO_CODIGO.test(codigo);

function generarCodigo() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `ANZ-${Array.from(bytes, byte => LETRAS[byte % LETRAS.length]).join('')}`;
}

export function crearCupon({uid, email, porcentaje = PORCENTAJE_CUPON, origen}) {
  const ahora = Date.now();

  return {
    codigo: generarCodigo(),
    uid,
    email,
    porcentaje,
    origen,
    creadoEn: new Date(ahora).toISOString(),
    venceEn: new Date(ahora + HORAS_VALIDEZ * 60 * 60 * 1000).toISOString(),
    usado: false,
    usadoEn: null,
    pedido: null,
    montoDescuento: null
  };
}

// Devuelve los errores por campo
export function validarCupon({uid, porcentaje}) {
  const errores = {};
  if (!uid) errores.uid = 'Elegí un usuario.';
  if (!Number.isSafeInteger(porcentaje) || porcentaje < 1 || porcentaje > PORCENTAJE_MAXIMO) {
    errores.porcentaje = `El descuento es un número entero de 1 a ${PORCENTAJE_MAXIMO}.`;
  }
  return errores;
}

// activo, usado o vencido
export function estadoCupon(cupon, ahora = Date.now()) {
  if (cupon.usado) return 'usado';
  return new Date(cupon.venceEn).getTime() > ahora ? 'activo' : 'vencido';
}

export const descuentoCupon = (monto, cupon) => (cupon ? Math.round((monto * cupon.porcentaje) / 100) : 0);
