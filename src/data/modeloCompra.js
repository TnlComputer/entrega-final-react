// Datos de contacto y pago de la compra, validados igual en el carrito y en server/comprar.js
export const MAX_EMAIL = 254;

export function normalizarEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function emailValido(email) {
  const valor = normalizarEmail(email);
  return valor.length <= MAX_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

// Pago simulado: no se cobra nada. Los datos completos de la tarjeta se validan solo en el
// navegador; al servidor llegan la marca, los últimos 4 dígitos y las cuotas (ver resumenPago).
export const METODOS_PAGO = [
  {id: 'tarjetaCredito', nombre: 'Tarjeta de crédito'},
  {id: 'tarjetaDebito', nombre: 'Tarjeta de débito'},
  {id: 'transferencia', nombre: 'Transferencia bancaria'},
  {id: 'mercadoPago', nombre: 'Mercado Pago'}
];

export const CUOTAS = [1, 3];

export const DATOS_TRANSFERENCIA = {
  titular: 'El Anzuelo (cuenta de demostración)',
  alias: 'ELANZUELO.DEMO',
  cbu: '0000000000000000000000'
};

const MARCAS = ['Visa', 'Mastercard', 'American Express', 'Tarjeta'];

export function marcaTarjeta(numero) {
  const digitos = String(numero).replace(/\D/g, '');
  if (/^4/.test(digitos)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digitos)) return 'Mastercard';
  if (/^3[47]/.test(digitos)) return 'American Express';
  return 'Tarjeta';
}

// Algoritmo de Luhn: detecta errores de tipeo en el número
export function numeroTarjetaValido(numero) {
  const digitos = String(numero).replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digitos)) return false;
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let digito = Number(digitos[digitos.length - 1 - i]);
    if (i % 2 === 1) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
  }
  return suma % 10 === 0;
}

// MM/AA, vigente hasta el último día de ese mes
export function vencimientoValido(vencimiento, hoy = new Date()) {
  const partes = /^(\d{2})\/(\d{2})$/.exec(String(vencimiento));
  if (!partes) return false;
  const mes = Number(partes[1]);
  const anio = 2000 + Number(partes[2]);
  if (mes < 1 || mes > 12) return false;
  return new Date(anio, mes, 1) > hoy;
}

export function cvvValido(cvv, marca) {
  return (marca === 'American Express' ? /^\d{4}$/ : /^\d{3}$/).test(String(cvv));
}

export function titularValido(titular) {
  if (typeof titular !== 'string') return false;
  const valor = titular.trim();
  return valor.length >= 3 && valor.length <= 80 && /^[\p{L}][\p{L}\s.'-]*$/u.test(valor);
}

const esTarjeta = metodo => metodo === 'tarjetaCredito' || metodo === 'tarjetaDebito';

// Validación completa en el carrito (incluye número, vencimiento y CVV)
export function pagoCompleto(pago) {
  if (esTarjeta(pago.metodo)) {
    const marca = marcaTarjeta(pago.numero);
    return (
      numeroTarjetaValido(pago.numero) &&
      titularValido(pago.titular) &&
      vencimientoValido(pago.vencimiento) &&
      cvvValido(pago.cvv, marca) &&
      (pago.metodo === 'tarjetaDebito' || CUOTAS.includes(Number(pago.cuotas)))
    );
  }
  if (pago.metodo === 'transferencia') return titularValido(pago.titular);
  if (pago.metodo === 'mercadoPago') return emailValido(pago.emailMercadoPago);
  return false;
}

// Lo único del pago que viaja al servidor
export function resumenPago(pago) {
  if (esTarjeta(pago.metodo)) {
    return {
      metodo: pago.metodo,
      marca: marcaTarjeta(pago.numero),
      ultimos4: String(pago.numero).replace(/\D/g, '').slice(-4),
      titular: pago.titular.trim(),
      ...(pago.metodo === 'tarjetaCredito' && {cuotas: Number(pago.cuotas)})
    };
  }
  if (pago.metodo === 'transferencia') return {metodo: 'transferencia', titular: pago.titular.trim()};
  return {metodo: 'mercadoPago', email: normalizarEmail(pago.emailMercadoPago)};
}

// Revisa el resumen recibido por el servidor; devuelve un mensaje de error o null
export function errorResumenPago(resumen) {
  if (!resumen || !METODOS_PAGO.some(({id}) => id === resumen.metodo)) return 'Elegí una forma de pago válida.';
  if (esTarjeta(resumen.metodo)) {
    if (!MARCAS.includes(resumen.marca) || !/^\d{4}$/.test(String(resumen.ultimos4))) {
      return 'Revisá los datos de la tarjeta.';
    }
    if (!titularValido(resumen.titular)) return 'Revisá el nombre del titular de la tarjeta.';
    if (resumen.metodo === 'tarjetaCredito' && !CUOTAS.includes(resumen.cuotas)) return 'Elegí una cantidad de cuotas válida.';
    return null;
  }
  if (resumen.metodo === 'transferencia') {
    return titularValido(resumen.titular) ? null : 'Revisá el nombre del titular de la cuenta.';
  }
  return emailValido(resumen.email) ? null : 'Revisá el email de tu cuenta de Mercado Pago.';
}

// Copia solo los campos esperados de un resumen ya validado con errorResumenPago
export function limpiarResumenPago(resumen) {
  if (esTarjeta(resumen.metodo)) {
    return {
      metodo: resumen.metodo,
      marca: resumen.marca,
      ultimos4: String(resumen.ultimos4),
      titular: resumen.titular.trim(),
      ...(resumen.metodo === 'tarjetaCredito' && {cuotas: resumen.cuotas})
    };
  }
  if (resumen.metodo === 'transferencia') return {metodo: 'transferencia', titular: resumen.titular.trim()};
  return {metodo: 'mercadoPago', email: normalizarEmail(resumen.email)};
}

export function textoPago(resumen) {
  if (!resumen) return '';
  if (resumen.metodo === 'tarjetaCredito') {
    return `Crédito ${resumen.marca} terminada en ${resumen.ultimos4} · ${
      resumen.cuotas === 1 ? '1 pago' : `${resumen.cuotas} cuotas sin interés`
    }`;
  }
  if (resumen.metodo === 'tarjetaDebito') return `Débito ${resumen.marca} terminada en ${resumen.ultimos4}`;
  if (resumen.metodo === 'transferencia') return `Transferencia de ${resumen.titular} a ${DATOS_TRANSFERENCIA.alias}`;
  return `Mercado Pago (${resumen.email})`;
}
