// Modelo del anuncio que se muestra arriba de toda la página (free day, envío gratis…),
// compartido por la tienda, el panel admin y el script de datos iniciales (scripts/cargarDatos.js).
// Vive en Firestore, en el documento config/anuncio:
//   {activo, texto, desde, hasta, descuento}
//   desde / hasta: 'AAAA-MM-DD' o '' (sin fecha = sin límite)
//   descuento: % entero sobre el total del carrito mientras el anuncio se muestra (0 = sin descuento)

export const LIMITE_TEXTO_ANUNCIO = 160;
export const DESCUENTO_MAXIMO = 90;

export const ANUNCIO_VACIO = {
  activo: false,
  texto: '',
  desde: '',
  hasta: '',
  descuento: 0
};

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Fecha local en formato AAAA-MM-DD (así se comparan como texto)
export const fechaDeHoy = () => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const parte = tipo => partes.find(item => item.type === tipo)?.value;
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
};

const fechaValida = fecha => {
  if (!FORMATO_FECHA.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaParseada = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fechaParseada.getUTCFullYear() === anio &&
    fechaParseada.getUTCMonth() === mes - 1 &&
    fechaParseada.getUTCDate() === dia
  );
};

export function prepararAnuncio(formulario) {
  return {
    activo: Boolean(formulario.activo),
    texto: formulario.texto.trim(),
    desde: formulario.desde || '',
    hasta: formulario.hasta || '',
    descuento: formulario.descuento === '' || formulario.descuento == null ? 0 : Number(formulario.descuento)
  };
}

// Devuelve {campo: 'mensaje'}; vacío si está todo bien.
export function validarAnuncio(anuncio) {
  const errores = {};

  if (typeof anuncio.activo !== 'boolean') errores.activo = 'El estado del anuncio no es válido.';
  if (typeof anuncio.texto !== 'string') errores.texto = 'El texto del anuncio no es válido.';
  else if (anuncio.activo && !anuncio.texto.trim()) errores.texto = 'Escribí el texto del anuncio para poder mostrarlo.';
  else if (anuncio.texto.length > LIMITE_TEXTO_ANUNCIO) errores.texto = `Máximo ${LIMITE_TEXTO_ANUNCIO} caracteres.`;

  if (typeof anuncio.desde !== 'string' || (anuncio.desde && !fechaValida(anuncio.desde))) {
    errores.desde = 'Fecha inválida.';
  }
  if (typeof anuncio.hasta !== 'string' || (anuncio.hasta && !fechaValida(anuncio.hasta))) {
    errores.hasta = 'Fecha inválida.';
  }
  else if (anuncio.desde && anuncio.hasta && anuncio.hasta < anuncio.desde) {
    errores.hasta = 'Tiene que ser igual o posterior a la fecha "desde".';
  }

  if (!Number.isSafeInteger(anuncio.descuento) || anuncio.descuento < 0 || anuncio.descuento > DESCUENTO_MAXIMO) {
    errores.descuento = `El descuento es un número entero de 0 a ${DESCUENTO_MAXIMO}.`;
  }

  return errores;
}

// 'visible' | 'programado' (todavía no empezó) | 'vencido' | 'oculto'
export function estadoAnuncio(anuncio, hoy = fechaDeHoy()) {
  if (!anuncio?.activo || !anuncio.texto) return 'oculto';
  if (anuncio.desde && hoy < anuncio.desde) return 'programado';
  if (anuncio.hasta && hoy > anuncio.hasta) return 'vencido';
  return 'visible';
}

// % de descuento que corresponde hoy: el del anuncio solo si se está mostrando
export const descuentoVigente = (anuncio, hoy = fechaDeHoy()) =>
  estadoAnuncio(anuncio, hoy) === 'visible' ? anuncio.descuento || 0 : 0;
