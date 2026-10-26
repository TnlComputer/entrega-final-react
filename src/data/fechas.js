// Fechas en formato AAAA-MM-DD, hora de Argentina

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

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

export const fechaValida = fecha => {
  if (typeof fecha !== 'string' || !FORMATO_FECHA.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaParseada = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fechaParseada.getUTCFullYear() === anio &&
    fechaParseada.getUTCMonth() === mes - 1 &&
    fechaParseada.getUTCDate() === dia
  );
};

// AAAA-MM-DD → DD/MM/AAAA
export const formatoFecha = fecha => fecha.split('-').reverse().join('/');
