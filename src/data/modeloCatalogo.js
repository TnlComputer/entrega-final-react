// Catálogo (Firestore: colecciones rubros y productos)

export const LIMITES = {
  nombre: 80,
  marca: 40,
  sku: 30,
  descripcion: 140,
  caracteristicas: 6,
  caracteristica: 40
};

export const COLORES = [
  {clase: 'product-sand', nombre: 'Arena'},
  {clase: 'product-water', nombre: 'Agua'},
  {clase: 'product-lilac', nombre: 'Lila'},
  {clase: 'product-olive', nombre: 'Oliva'},
  {clase: 'product-rust', nombre: 'Óxido'},
  {clase: 'product-ink', nombre: 'Oscuro'}
];

export const PRODUCTO_VACIO = {
  nombre: '',
  marca: '',
  sku: '',
  descripcion: '',
  caracteristicas: [],
  rubro: '',
  subrubro: '',
  precio: '',
  precioOferta: '',
  stock: '',
  imagen: '',
  clase: COLORES[0].clase,
  destacado: false,
  activo: true,
  orden: 0
};

export const RUBRO_VACIO = {
  nombre: '',
  detalle: '',
  orden: '',
  subrubros: []
};

export function crearSlug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const esEnteroNoNegativo = valor => Number.isSafeInteger(valor) && valor >= 0;

// Pasa los datos del formulario al formato que se guarda
export function prepararProducto(formulario) {
  const aNumero = valor => (valor === '' || valor === null ? null : Number(valor));

  return {
    nombre: formulario.nombre.trim(),
    marca: formulario.marca.trim(),
    sku: formulario.sku.trim().toUpperCase(),
    descripcion: formulario.descripcion.trim(),
    caracteristicas: formulario.caracteristicas.map(texto => texto.trim()).filter(Boolean),
    rubro: formulario.rubro,
    subrubro: formulario.subrubro.trim(),
    precio: aNumero(formulario.precio),
    precioOferta: aNumero(formulario.precioOferta),
    stock: aNumero(formulario.stock),
    imagen: formulario.imagen.trim(),
    clase: formulario.clase,
    destacado: Boolean(formulario.destacado),
    activo: Boolean(formulario.activo),
    orden: aNumero(formulario.orden) ?? 0
  };
}

// Devuelve los errores por campo
export function validarProducto(producto, {rubros = [], productos = [], id = null} = {}) {
  const errores = {};

  for (const campo of ['nombre', 'marca', 'sku', 'descripcion', 'subrubro', 'imagen']) {
    if (typeof producto[campo] !== 'string') errores[campo] = 'Ingresá un texto válido.';
  }

  if (typeof producto.nombre === 'string') {
    if (!producto.nombre) errores.nombre = 'Poné un nombre.';
    else if (producto.nombre.length > LIMITES.nombre) errores.nombre = `Máximo ${LIMITES.nombre} caracteres.`;
  }
  if (typeof producto.marca === 'string' && producto.marca.length > LIMITES.marca) {
    errores.marca = `Máximo ${LIMITES.marca} caracteres.`;
  }

  if (typeof producto.sku === 'string' && producto.sku.length > LIMITES.sku) {
    errores.sku = `Máximo ${LIMITES.sku} caracteres.`;
  } else if (
    typeof producto.sku === 'string' &&
    producto.sku &&
    productos.some(otro => otro.id !== id && otro.sku === producto.sku)
  ) {
    errores.sku = 'Ya hay otro producto con este código.';
  }

  if (typeof producto.descripcion === 'string' && !producto.descripcion) {
    errores.descripcion = 'Poné una descripción corta.';
  } else if (typeof producto.descripcion === 'string' && producto.descripcion.length > LIMITES.descripcion) {
    errores.descripcion = `Máximo ${LIMITES.descripcion} caracteres.`;
  }

  if (!Array.isArray(producto.caracteristicas)) {
    errores.caracteristicas = 'Las características no tienen un formato válido.';
  } else if (producto.caracteristicas.length > LIMITES.caracteristicas) {
    errores.caracteristicas = `Máximo ${LIMITES.caracteristicas} características.`;
  } else if (
    producto.caracteristicas.some(texto => typeof texto !== 'string' || texto.length > LIMITES.caracteristica)
  ) {
    errores.caracteristicas = `Cada característica puede tener hasta ${LIMITES.caracteristica} caracteres.`;
  }

  const rubro = Array.isArray(rubros) ? rubros.find(opcion => opcion.id === producto.rubro) : null;
  if (!rubro) {
    errores.rubro = 'Elegí un rubro.';
  } else if (rubro.subrubros.length > 0 && !rubro.subrubros.includes(producto.subrubro)) {
    // El subrubro solo se pide si el rubro tiene
    errores.subrubro = 'Elegí un subrubro.';
  } else if (rubro.subrubros.length === 0 && producto.subrubro) {
    errores.subrubro = 'Este rubro no tiene subrubros.';
  }

  if (!Number.isSafeInteger(producto.precio) || producto.precio <= 0 || producto.precio > 1_000_000_000) {
    errores.precio = 'Poné un precio entero entre $1 y $1.000.000.000.';
  }
  if (producto.precioOferta !== null) {
    if (
      !Number.isSafeInteger(producto.precioOferta) ||
      producto.precioOferta <= 0 ||
      producto.precioOferta > 1_000_000_000
    ) {
      errores.precioOferta = 'El precio de oferta tiene que ser un entero entre $1 y $1.000.000.000.';
    } else if (!errores.precio && producto.precioOferta >= producto.precio) {
      errores.precioOferta = 'Tiene que ser menor al precio normal.';
    }
  }

  if (!esEnteroNoNegativo(producto.stock)) errores.stock = 'El stock es un número entero (0 o más).';
  if (!esEnteroNoNegativo(producto.orden)) errores.orden = 'El orden es un número entero (0 o más).';

  if (typeof producto.imagen === 'string' && !producto.imagen) errores.imagen = 'Poné el link de la imagen o subí una.';
  else if (typeof producto.imagen === 'string') {
    try {
      if (new URL(producto.imagen).protocol !== 'https:') throw new Error('URL inválida');
    } catch {
      errores.imagen = 'Ingresá un link HTTPS válido.';
    }
  }

  if (!COLORES.some(color => color.clase === producto.clase)) errores.clase = 'Elegí un color válido.';
  if (typeof producto.destacado !== 'boolean') errores.destacado = 'El estado de destacado no es válido.';
  if (typeof producto.activo !== 'boolean') errores.activo = 'El estado de publicación no es válido.';

  return errores;
}

export function prepararRubro(formulario) {
  const vistos = new Set();
  const subrubros = formulario.subrubros
    .map(texto => texto.trim())
    .filter(texto => texto && !vistos.has(texto.toLowerCase()) && vistos.add(texto.toLowerCase()));

  return {
    nombre: formulario.nombre.trim(),
    detalle: formulario.detalle.trim(),
    orden: formulario.orden === '' ? null : Number(formulario.orden),
    subrubros
  };
}

export function validarRubro(rubro, {rubros = [], id = null} = {}) {
  const errores = {};

  if (typeof rubro.nombre !== 'string' || !rubro.nombre) errores.nombre = 'Poné un nombre válido.';
  else if (rubro.nombre.length > 60) errores.nombre = 'Máximo 60 caracteres.';
  else if (!crearSlug(rubro.nombre)) errores.nombre = 'El nombre debe incluir letras o números.';
  else if (!id && rubros.some(otro => otro.id === crearSlug(rubro.nombre))) {
    errores.nombre = 'Ya existe un rubro con ese nombre.';
  }
  if (typeof rubro.detalle !== 'string') errores.detalle = 'El detalle no tiene un formato válido.';
  else if (rubro.detalle.length > 60) errores.detalle = 'Máximo 60 caracteres.';
  if (!esEnteroNoNegativo(rubro.orden)) errores.orden = 'El orden es un número entero (0 o más).';
  if (!Array.isArray(rubro.subrubros) || rubro.subrubros.length > 20) {
    errores.subrubros = 'Ingresá como máximo 20 subrubros.';
  } else if (rubro.subrubros.some(subrubro => typeof subrubro !== 'string' || subrubro.length > 40)) {
    errores.subrubros = 'Cada subrubro puede tener hasta 40 caracteres.';
  }

  return errores;
}

// Orden: rubro, orden del producto, subrubro y nombre
export function ordenarProductos(productos, rubros) {
  const ordenRubro = new Map(rubros.map(rubro => [rubro.id, rubro.orden]));

  return [...productos].sort(
    (a, b) =>
      (ordenRubro.get(a.rubro) ?? 999) - (ordenRubro.get(b.rubro) ?? 999) ||
      (a.orden ?? 0) - (b.orden ?? 0) ||
      a.subrubro.localeCompare(b.subrubro, 'es') ||
      a.nombre.localeCompare(b.nombre, 'es')
  );
}

// Ordena rubros y productos y agrega el nombre del rubro
export function prepararCatalogo({rubros = [], productos = []}) {
  const rubrosOrdenados = [...rubros].sort((a, b) => a.orden - b.orden);
  const nombreRubro = new Map(rubrosOrdenados.map(rubro => [rubro.id, rubro.nombre]));

  return {
    rubros: rubrosOrdenados,
    productos: ordenarProductos(productos, rubrosOrdenados).map(producto => ({
      ...producto,
      rubroNombre: nombreRubro.get(producto.rubro) ?? ''
    }))
  };
}

// Precio final: la oferta si hay
export const precioFinal = producto => producto.precioOferta ?? producto.precio;
