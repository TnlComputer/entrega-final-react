import {cert, getApps, initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {
  estadoAnuncio,
  fechaDeHoy,
  validarAnuncio
} from '../src/data/modeloAnuncio.js';
import {
  emailValido,
  errorResumenPago,
  limpiarResumenPago,
  normalizarEmail,
  textoPago
} from '../src/data/modeloCompra.js';
import {
  UMBRAL_ENVIO_GRATIS,
  celularValido,
  zonaParaCodigoPostal,
  zonaParaLocalidad
} from '../src/data/modeloEnvios.js';

const MAX_BYTES = 16 * 1024;
const MAX_ITEMS = 30;
const MAX_CANTIDAD = 99;
const MAX_PRECIO = 1_000_000_000;

const responder = (estado, datos) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: {'Content-Type': 'application/json; charset=utf-8'}
  });

function fallo(estado, mensaje, datos = {}) {
  const error = new Error(mensaje);
  error.estado = estado;
  error.datos = datos;
  return error;
}

function obtenerFirestore(serviceAccountJson, projectId) {
  if (!serviceAccountJson) throw fallo(500, 'Falta FIREBASE_SERVICE_ACCOUNT_JSON en el servidor.');

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw fallo(500, 'FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido.');
  }

  if (
    !serviceAccount ||
    typeof serviceAccount.project_id !== 'string' ||
    typeof serviceAccount.client_email !== 'string' ||
    typeof serviceAccount.private_key !== 'string' ||
    serviceAccount.project_id !== projectId
  ) {
    throw fallo(500, 'La cuenta de servicio de Firebase no es válida para este proyecto.');
  }

  const existente = getApps().find(app => app.options.projectId === projectId);
  const app = existente ?? initializeApp({credential: cert(serviceAccount), projectId});
  return getFirestore(app);
}

async function leerJson(peticion) {
  if (!peticion.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw fallo(415, 'El contenido de la solicitud debe ser JSON.');
  }
  const longitud = Number(peticion.headers.get('content-length') || 0);
  if (longitud > MAX_BYTES) throw fallo(413, 'La solicitud supera el tamaño permitido.');
  const texto = await peticion.text();
  if (Buffer.byteLength(texto, 'utf8') > MAX_BYTES) throw fallo(413, 'La solicitud supera el tamaño permitido.');
  try {
    return JSON.parse(texto);
  } catch {
    throw fallo(400, 'La solicitud no contiene JSON válido.');
  }
}

function validarPedido(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    throw fallo(400, 'El pedido debe ser un objeto válido.');
  }
  if (!Array.isArray(cuerpo.items) || cuerpo.items.length === 0 || cuerpo.items.length > MAX_ITEMS) {
    throw fallo(400, `El pedido debe contener entre 1 y ${MAX_ITEMS} productos distintos.`);
  }

  const ids = new Set();
  const items = cuerpo.items.map(item => {
    const id = String(item?.id ?? '');
    const cantidad = item?.cantidad;
    if (!/^[1-9]\d{0,8}$/.test(id) || !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) {
      throw fallo(400, 'Hay un producto o una cantidad inválidos en el pedido.');
    }
    if (ids.has(id)) throw fallo(400, 'El pedido no puede repetir un producto.');
    ids.add(id);
    return {id, cantidad};
  });

  if (!emailValido(cuerpo.email)) throw fallo(400, 'Ingresá un email válido para enviarte el resumen.');
  const email = normalizarEmail(cuerpo.email);
  // Solo marca y últimos 4 dígitos
  const errorPago = errorResumenPago(cuerpo.pago);
  if (errorPago) throw fallo(400, errorPago);
  const pago = limpiarResumenPago(cuerpo.pago);

  const entrega = cuerpo.entrega;
  if (!entrega || !['envio', 'retiro'].includes(entrega.metodo)) {
    throw fallo(400, 'Elegí un método de entrega válido.');
  }
  if (entrega.metodo === 'retiro') return {items, email, pago, entrega: {metodo: 'retiro'}};
  if (typeof entrega.codigoPostal !== 'string' || !/^\d{4}$/.test(entrega.codigoPostal)) {
    throw fallo(400, 'Ingresá un código postal numérico de 4 dígitos.');
  }
  if (!celularValido(entrega.celular)) {
    throw fallo(400, 'Ingresá un celular con código de área (8 a 15 dígitos).');
  }

  const camposDireccion = ['calle', 'numero', 'localidad'];
  const direccion = {};
  for (const campo of camposDireccion) {
    const valor = entrega[campo];
    const limite = campo === 'calle' ? 120 : 80;
    if (typeof valor !== 'string' || valor.trim().length < 2 || valor.trim().length > limite) {
      throw fallo(400, `Revisá el campo ${campo} de la dirección.`);
    }
    direccion[campo] = valor.trim();
  }
  if (!/^\d{1,6}(?:\s?[A-Za-z])?$/.test(direccion.numero)) {
    throw fallo(400, 'Ingresá un número de calle válido.');
  }
  for (const [campo, limite] of [['piso', 10], ['departamento', 12], ['indicaciones', 300]]) {
    const valor = entrega[campo] ?? '';
    if (typeof valor !== 'string' || valor.trim().length > limite) {
      throw fallo(400, `Revisá el campo ${campo} de la dirección.`);
    }
    direccion[campo] = valor.trim();
  }
  return {
    items,
    email,
    pago,
    entrega: {
      metodo: 'envio',
      ...direccion,
      codigoPostal: entrega.codigoPostal,
      celular: entrega.celular.trim()
    }
  };
}

function precioProducto(producto) {
  const precio = producto.precio;
  if (!Number.isSafeInteger(precio) || precio < 1 || precio > MAX_PRECIO) {
    throw fallo(500, 'Hay un precio de producto inválido en el catálogo. Revisalo desde el panel.');
  }

  const oferta = producto.precioOferta;
  if (oferta === null || oferta === undefined) return precio;
  if (!Number.isSafeInteger(oferta) || oferta < 1 || oferta >= precio) {
    throw fallo(500, 'Hay un precio de oferta inválido en el catálogo. Revisalo desde el panel.');
  }
  return oferta;
}

function descuentoActivo(anuncio) {
  if (!anuncio) return 0;
  if (typeof anuncio !== 'object') {
    throw fallo(500, 'La configuración del descuento es inválida. Revisala desde el panel.');
  }
  const errores = validarAnuncio(anuncio);
  if (Object.keys(errores).length) {
    throw fallo(500, 'La configuración del descuento es inválida. Revisala desde el panel.');
  }
  const hoy = fechaDeHoy();
  if (estadoAnuncio(anuncio, hoy) !== 'visible') return 0;
  return anuncio.descuento;
}

function validarZonas(zonas) {
  if (!Array.isArray(zonas)) throw fallo(500, 'La tabla de tarifas de envío no es válida.');
  for (const zona of zonas) {
    if (
      !zona ||
      typeof zona.nombre !== 'string' ||
      !Number.isSafeInteger(zona.precio) ||
      zona.precio < 0
    ) {
      throw fallo(500, 'Hay una zona de envío con datos inválidos. Revisala desde el panel.');
    }
  }
  return zonas;
}

export default async function comprar(peticion, {serviceAccountJson, projectId}) {
  try {
    if (peticion.method !== 'POST') return responder(405, {error: 'Usá POST.'});
    if (!projectId) return responder(500, {error: 'Falta el projectId de Firebase.'});

    const pedido = validarPedido(await leerJson(peticion));
    const db = obtenerFirestore(serviceAccountJson, projectId);
    const refsProductos = pedido.items.map(item => db.collection('productos').doc(item.id));
    const refEnvios = db.collection('config').doc('envios');
    const refAnuncio = db.collection('config').doc('anuncio');

    const resultado = await db.runTransaction(async transaction => {
      const [snapshotsProductos, snapshotEnvios, snapshotAnuncio] = await Promise.all([
        Promise.all(refsProductos.map(ref => transaction.get(ref))),
        transaction.get(refEnvios),
        transaction.get(refAnuncio)
      ]);

      const stocks = snapshotsProductos.map((snapshot, index) => ({
        id: Number(pedido.items[index].id),
        stock: snapshot.exists && Number.isSafeInteger(snapshot.data().stock) ? snapshot.data().stock : 0
      }));
      const renglones = pedido.items.map((item, index) => {
        const snapshot = snapshotsProductos[index];
        if (!snapshot.exists) throw fallo(409, 'Uno de los productos del carrito ya no existe.', {stocks});

        const producto = snapshot.data();
        if (producto.activo !== true) {
          throw fallo(409, `“${producto.nombre || 'Producto'}” ya no está disponible.`, {stocks});
        }
        if (!Number.isSafeInteger(producto.stock) || producto.stock < 0) {
          throw fallo(500, 'Hay un stock inválido en el catálogo. Revisalo desde el panel.');
        }
        if (producto.stock < item.cantidad) {
          throw fallo(409, `Stock insuficiente para “${producto.nombre}”. Quedan ${producto.stock}.`, {stocks});
        }
        const unitario = precioProducto(producto);
        const totalLinea = unitario * item.cantidad;
        if (!Number.isSafeInteger(totalLinea)) throw fallo(400, 'El total del pedido excede el límite permitido.');
        return {
          ref: snapshot.ref,
          id: Number(item.id),
          nombre: producto.nombre,
          cantidad: item.cantidad,
          stock: producto.stock,
          unitario,
          totalLinea
        };
      });

      const subtotal = renglones.reduce((total, item) => total + item.totalLinea, 0);
      if (!Number.isSafeInteger(subtotal)) throw fallo(400, 'El total del pedido excede el límite permitido.');

      const anuncio = snapshotAnuncio.exists ? snapshotAnuncio.data() : null;
      const descuento = descuentoActivo(anuncio);
      const montoDescuento = Math.round((subtotal * descuento) / 100);
      const totalProductos = subtotal - montoDescuento;

      // Envío gratis desde el umbral
      const envioGratis =
        pedido.entrega.metodo === 'envio' && totalProductos > UMBRAL_ENVIO_GRATIS;

      let zona = null;
      if (pedido.entrega.metodo === 'envio' && !envioGratis) {
        const zonas = validarZonas(snapshotEnvios.exists ? snapshotEnvios.data().zonas : []);
        zona =
          zonaParaCodigoPostal(zonas, pedido.entrega.codigoPostal) ??
          zonaParaLocalidad(zonas, pedido.entrega.localidad);
        if (!zona) {
          throw fallo(400, 'No hay una tarifa configurada para ese código postal ni para esa localidad.');
        }
      }

      const envio = pedido.entrega.metodo === 'retiro' || envioGratis ? 0 : zona.precio;
      const total = totalProductos + envio;
      if (!Number.isSafeInteger(total)) throw fallo(400, 'El total del pedido excede el límite permitido.');

      const nuevosStocks = renglones.map(item => ({id: item.id, stock: item.stock - item.cantidad}));
      renglones.forEach(item => transaction.update(item.ref, {stock: item.stock - item.cantidad}));

      return {
        // El pedido no se guarda
        numero: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        cantidad: renglones.reduce((sum, item) => sum + item.cantidad, 0),
        items: renglones.map(({id, nombre, cantidad, unitario, totalLinea}) => ({
          id,
          nombre,
          cantidad,
          precioUnitario: unitario,
          total: totalLinea
        })),
        subtotal,
        descuento,
        montoDescuento,
        metodo: pedido.entrega.metodo,
        email: pedido.email,
        pago: pedido.pago,
        pagoTexto: textoPago(pedido.pago),
        envio,
        envioGratis,
        zona: zona?.nombre ?? null,
        direccion:
          pedido.entrega.metodo === 'retiro'
            ? 'Retiro en tienda — coordinar por contacto'
            : `${pedido.entrega.calle} ${pedido.entrega.numero}${
                pedido.entrega.piso ? `, Piso ${pedido.entrega.piso}` : ''
              }${
                pedido.entrega.departamento ? `, Depto. ${pedido.entrega.departamento}` : ''
              }, ${pedido.entrega.localidad} (CP ${pedido.entrega.codigoPostal}) · Cel. ${pedido.entrega.celular}${
                pedido.entrega.indicaciones ? ` — ${pedido.entrega.indicaciones}` : ''
              }`,
        total,
        stocks: nuevosStocks
      };
    });

    return responder(200, resultado);
  } catch (error) {
    if (!error.estado) console.error(error);
    return responder(error.estado || 500, {
      error: error.estado ? error.message : 'No se pudo confirmar la compra simulada.',
      ...(error.datos || {})
    });
  }
}
