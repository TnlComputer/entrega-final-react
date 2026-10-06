// Modelo de datos del catálogo, compartido por la tienda, el panel admin
// y el script que carga los datos iniciales (scripts/cargarDatos.js).
// Vive en Firestore: colección "rubros" (id = slug) y colección "productos" (id = número como texto).
//
// Rubro (id = slug del nombre):
//   {id, nombre, detalle, orden, subrubros: ['Cañas', 'Reels']}
//   subrubros es opcional: [] si el rubro no se divide.
//
// Producto (id numérico):
//   {id, nombre, marca, sku, descripcion, caracteristicas: [],
//    rubro (id del rubro), subrubro ('' si el rubro no tiene), precio, precioOferta (o null), stock,
//    imagen (link https://…, normalmente de ImgBB), clase (color de fondo), destacado,
//    activo, orden, actualizadoEn}

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

const esEnteroNoNegativo = valor => Number.isInteger(valor) && valor >= 0;

// Convierte lo que viene del formulario (todo texto) al formato que se guarda.
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

// Devuelve {campo: 'mensaje'}; vacío si está todo bien.
export function validarProducto(producto, {rubros = [], productos = [], id = null} = {}) {
  const errores = {};

  if (!producto.nombre) errores.nombre = 'Poné un nombre.';
  else if (producto.nombre.length > LIMITES.nombre) errores.nombre = `Máximo ${LIMITES.nombre} caracteres.`;

  if (producto.marca.length > LIMITES.marca) errores.marca = `Máximo ${LIMITES.marca} caracteres.`;

  if (producto.sku.length > LIMITES.sku) {
    errores.sku = `Máximo ${LIMITES.sku} caracteres.`;
  } else if (producto.sku && productos.some(otro => otro.id !== id && otro.sku === producto.sku)) {
    errores.sku = 'Ya hay otro producto con este código.';
  }

  if (!producto.descripcion) errores.descripcion = 'Poné una descripción corta.';
  else if (producto.descripcion.length > LIMITES.descripcion) {
    errores.descripcion = `Máximo ${LIMITES.descripcion} caracteres.`;
  }

  if (producto.caracteristicas.length > LIMITES.caracteristicas) {
    errores.caracteristicas = `Máximo ${LIMITES.caracteristicas} características.`;
  } else if (producto.caracteristicas.some(texto => texto.length > LIMITES.caracteristica)) {
    errores.caracteristicas = `Cada característica puede tener hasta ${LIMITES.caracteristica} caracteres.`;
  }

  const rubro = rubros.find(opcion => opcion.id === producto.rubro);
  if (!rubro) {
    errores.rubro = 'Elegí un rubro.';
  } else if (rubro.subrubros.length > 0 && !rubro.subrubros.includes(producto.subrubro)) {
    // El subrubro solo se pide si el rubro tiene
    errores.subrubro = 'Elegí un subrubro.';
  } else if (rubro.subrubros.length === 0 && producto.subrubro) {
    errores.subrubro = 'Este rubro no tiene subrubros.';
  }

  if (producto.precio === null || Number.isNaN(producto.precio) || producto.precio <= 0) {
    errores.precio = 'Poné un precio mayor a 0.';
  }
  if (producto.precioOferta !== null) {
    if (Number.isNaN(producto.precioOferta) || producto.precioOferta <= 0) {
      errores.precioOferta = 'El precio de oferta tiene que ser mayor a 0.';
    } else if (!errores.precio && producto.precioOferta >= producto.precio) {
      errores.precioOferta = 'Tiene que ser menor al precio normal.';
    }
  }

  if (!esEnteroNoNegativo(producto.stock)) errores.stock = 'El stock es un número entero (0 o más).';
  if (!esEnteroNoNegativo(producto.orden)) errores.orden = 'El orden es un número entero (0 o más).';

  if (!producto.imagen) errores.imagen = 'Poné el link de la imagen o subí una.';
  else if (!/^https:\/\//.test(producto.imagen)) errores.imagen = 'Tiene que ser un link que empiece con https://';

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

  if (!rubro.nombre) errores.nombre = 'Poné un nombre.';
  else if (!id && rubros.some(otro => otro.id === crearSlug(rubro.nombre))) {
    errores.nombre = 'Ya existe un rubro con ese nombre.';
  }
  if (rubro.detalle.length > 60) errores.detalle = 'Máximo 60 caracteres.';
  if (!esEnteroNoNegativo(rubro.orden)) errores.orden = 'El orden es un número entero (0 o más).';

  return errores;
}

// Orden de la tienda: rubro → orden del producto → subrubro → nombre
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

// Lo que llega de Firestore, listo para mostrar: rubros ordenados y
// productos en el orden de la tienda, con el nombre de su rubro
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

// Lo que se cobra: la oferta si hay, si no el precio normal
export const precioFinal = producto => producto.precioOferta ?? producto.precio;
