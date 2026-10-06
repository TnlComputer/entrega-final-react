export const ZONA_ENVIO_VACIA = {
  nombre: '',
  codigoDesde: '',
  codigoHasta: '',
  localidades: '',
  precio: ''
};

export const UMBRAL_ENVIO_GRATIS = 300000;

export function normalizarLocalidad(localidad) {
  return localidad
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es');
}

export function parsearLocalidades(localidades) {
  const valores = Array.isArray(localidades) ? localidades : String(localidades ?? '').split(/[,\n]/);
  return [...new Set(valores.map(localidad => localidad.trim()).filter(Boolean))];
}

export function validarZonaEnvio(zona, zonas, idEditado = null) {
  const errores = {};
  const nombre = zona.nombre.trim();
  const desde = zona.codigoDesde.trim();
  const hasta = zona.codigoHasta.trim();
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

  if (zona.precio === '' || !Number.isSafeInteger(precio) || precio < 0) {
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
