export const ZONA_ENVIO_VACIA = {
  nombre: '',
  codigoDesde: '',
  codigoHasta: '',
  precio: ''
};

export function validarZonaEnvio(zona, zonas, idEditado = null) {
  const errores = {};
  const nombre = zona.nombre.trim();
  const desde = zona.codigoDesde.trim();
  const hasta = zona.codigoHasta.trim();
  const precio = Number(zona.precio);

  if (!nombre) errores.nombre = 'Ingresá el nombre de la zona.';
  else if (zonas.some(item => item.id !== idEditado && item.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
    errores.nombre = 'Ya existe una zona con ese nombre.';
  }

  if (!/^\d{4}$/.test(desde)) errores.codigoDesde = 'Usá un código postal numérico de 4 dígitos.';
  if (!/^\d{4}$/.test(hasta)) errores.codigoHasta = 'Usá un código postal numérico de 4 dígitos.';
  if (/^\d{4}$/.test(desde) && /^\d{4}$/.test(hasta)) {
    if (Number(desde) > Number(hasta)) errores.codigoHasta = 'El código final debe ser igual o mayor al inicial.';
    else if (
      zonas.some(item => {
        if (item.id === idEditado) return false;
        return Number(desde) <= Number(item.codigoHasta) && Number(hasta) >= Number(item.codigoDesde);
      })
    ) {
      errores.codigoDesde = 'Este rango se superpone con otra zona.';
    }
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
    zonas.find(zona => codigo >= Number(zona.codigoDesde) && codigo <= Number(zona.codigoHasta)) ?? null
  );
}
