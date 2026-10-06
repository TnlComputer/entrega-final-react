export const ZONA_ENVIO_VACIA = {
  nombre: '',
  codigoDesde: '',
  codigoHasta: '',
  localidades: '',
  precio: ''
};

export const UMBRAL_ENVIO_GRATIS = 300000;

export const ZONAS_ENVIO_MOCK = [
  {
    id: 'demo-caba-gba',
    nombre: 'CABA y GBA (DEMO)',
    codigoDesde: '1000',
    codigoHasta: '1999',
    localidades: ['Ciudad Autónoma de Buenos Aires', 'Avellaneda', 'Lanús', 'Lomas de Zamora', 'San Isidro'],
    precio: 5000
  },
  {
    id: 'demo-centro',
    nombre: 'Centro (DEMO)',
    codigoDesde: '2000',
    codigoHasta: '3999',
    localidades: ['Rosario', 'Córdoba', 'Santa Fe', 'Paraná'],
    precio: 8500
  },
  {
    id: 'demo-interior',
    nombre: 'Interior (DEMO)',
    codigoDesde: '4000',
    codigoHasta: '9999',
    localidades: ['Mendoza', 'San Miguel de Tucumán', 'Salta', 'Neuquén', 'San Carlos de Bariloche'],
    precio: 15000
  }
];

export function normalizarLocalidad(localidad) {
  return String(localidad ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es');
}

export function parsearLocalidades(localidades) {
  const valores = Array.isArray(localidades) ? localidades : String(localidades ?? '').split(/[,\n]/);
  return [...new Set(valores.filter(localidad => typeof localidad === 'string').map(localidad => localidad.trim()).filter(Boolean))];
}

export function validarZonaEnvio(zona, zonas, idEditado = null) {
  const errores = {};
  if (!zona || typeof zona !== 'object') return {nombre: 'Los datos de la zona no son válidos.'};

  const nombre = typeof zona.nombre === 'string' ? zona.nombre.trim() : '';
  const desde = typeof zona.codigoDesde === 'string' ? zona.codigoDesde.trim() : '';
  const hasta = typeof zona.codigoHasta === 'string' ? zona.codigoHasta.trim() : '';
  const localidades = parsearLocalidades(zona.localidades);
  const precio = Number(zona.precio);

  if (!nombre) errores.nombre = 'Ingresá el nombre de la zona.';
  else if (zonas.some(item => item.id !== idEditado && item.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
    errores.nombre = 'Ya existe una zona con ese nombre.';
  }

  const sinRangoPostal = !desde && !hasta;
  const rangoPostalValido = /^\d{4}$/.test(desde) && /^\d{4}$/.test(hasta);
  if (!sinRangoPostal && desde && !/^\d{4}$/.test(desde)) {
    errores.codigoDesde = 'Usá un código postal numérico de 4 dígitos.';
  }
  if (!sinRangoPostal && hasta && !/^\d{4}$/.test(hasta)) {
    errores.codigoHasta = 'Usá un código postal numérico de 4 dígitos.';
  }
  if (!sinRangoPostal && (!desde || !hasta)) {
    errores.codigoHasta = 'Completá ambos extremos del rango o dejalos vacíos.';
  }
  if (rangoPostalValido) {
    if (Number(desde) > Number(hasta)) errores.codigoHasta = 'El código final debe ser igual o mayor al inicial.';
    else if (
      zonas.some(item => {
        if (!item.codigoDesde || !item.codigoHasta) return false;
        if (item.id === idEditado) return false;
        return Number(desde) <= Number(item.codigoHasta) && Number(hasta) >= Number(item.codigoDesde);
      })
    ) {
      errores.codigoDesde = 'Este rango se superpone con otra zona.';
    }
  }

  if (!rangoPostalValido && localidades.length === 0) {
    errores.localidades = 'Configurá un rango de códigos postales, al menos una localidad, o ambos.';
  }
  if (
    localidades.some(localidad =>
      zonas.some(
        item =>
          item.id !== idEditado &&
          parsearLocalidades(item.localidades).some(
            existente => normalizarLocalidad(existente) === normalizarLocalidad(localidad)
          )
      )
    )
  ) {
    errores.localidades = 'Una o más localidades ya están asignadas a otra zona.';
  }

  if (zona.precio === '' || !Number.isSafeInteger(precio) || precio < 0 || precio > 1_000_000_000) {
    errores.precio = 'Ingresá un precio entero igual o mayor a 0.';
  }

  return errores;
}

export function zonaParaCodigoPostal(zonas, codigoPostal) {
  if (!/^\d{4}$/.test(codigoPostal)) return null;
  const codigo = Number(codigoPostal);
  return (
    zonas.find(
      zona =>
        zona.codigoDesde &&
        zona.codigoHasta &&
        codigo >= Number(zona.codigoDesde) &&
        codigo <= Number(zona.codigoHasta)
    ) ?? null
  );
}

export function zonaParaLocalidad(zonas, localidad) {
  const buscada = normalizarLocalidad(localidad);
  if (!buscada) return null;
  return (
    zonas.find(zona =>
      parsearLocalidades(zona.localidades).some(item => normalizarLocalidad(item) === buscada)
    ) ?? null
  );
}
