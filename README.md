# El.Anzuelo · Casa de pesca

> **Proyecto académico** hecho para el curso **React JS de Talento Tech (comisión C26243)**, como entrega final.
> "El Anzuelo" es una tienda **ficticia**: los productos, precios, el equipo y los datos de contacto son de ejemplo.

**Sitio publicado:** _(pendiente: Netlify)_

![Captura de la página de inicio de El.Anzuelo](docs/captura.png)

## De qué se trata

Una tienda online de artículos de pesca, hecha con React. Tiene un catálogo de productos, buscador, carrito de compras y un panel de administración para cargar productos y avisos.

## Funcionalidades

**Tienda**
- Catálogo de productos agrupado por rubros (cañas y reels, señuelos, líneas y anzuelos, indumentaria), con precios de oferta y aviso de últimas unidades.
- Buscador de productos y tarjetas que se dan vuelta para ver las características.
- Favoritos y carrito de compras: se puede sumar o restar cantidades respetando el stock, y el carrito se guarda en el navegador.
- Franja de anuncio arriba de todo (por ejemplo, un "free day"), con fechas de inicio y fin y un descuento opcional que se aplica al total del carrito.
- Diseño adaptable: celular, tablet y escritorio hasta 1920 px; en pantallas más grandes aparece un fondo decorativo de pesca a los costados.

**Panel de administración** (`/admin`, con login)
- Alta, edición, baja y ocultamiento de productos, con subida de imágenes a ImgBB.
- Gestión de rubros y subrubros.
- Edición del anuncio: texto, fechas, descuento y vista previa.

El login es con Firebase Auth y los cambios se guardan en Firestore, tanto en el sitio publicado como en local. Solo pueden entrar las cuentas marcadas como admin.

## Tecnologías

- [React 19](https://react.dev/) con [Vite](https://vite.dev/) y React Compiler
- [React Router](https://reactrouter.com/) para la navegación
- [React Bootstrap](https://react-bootstrap.github.io/) y CSS Modules para los estilos
- [Firebase](https://firebase.google.com/): Firestore para productos, rubros y anuncio; Authentication para el login del panel
- [ImgBB](https://imgbb.com/) para las imágenes, subidas desde una Netlify Function que guarda la clave
- El equipo se lee de `public/data/equipo.json`
- Publicación automática en Netlify

## Cómo correrlo en local

Se necesita [Node.js](https://nodejs.org/) 20.19 o superior (o 22.12+).

```bash
npm install
npm run dev
```

Se abre en http://localhost:5173/

Copiá `.env.example` como `.env.local` y completalo. `.env.local` no se sube al repositorio.

### Firebase (una sola vez)

1. Crear un proyecto en la [consola de Firebase](https://console.firebase.google.com/) y agregarle una app web. Su configuración va en las variables `VITE_FIREBASE_*`.
2. **Firestore Database**: crearla y, en *Reglas*, pegar y publicar el contenido de [firestore.rules](firestore.rules).
3. **Authentication**: activar *Correo electrónico/contraseña* y crear el usuario admin (el mismo de `ADMIN_EMAIL` y `ADMIN_PASSWORD`).
4. En Firestore, crear la colección `admins` con un documento cuyo ID sea el *UID* de ese usuario (se ve en Authentication). Puede quedar sin campos.
5. `npm run cargar-datos` sube el catálogo y el anuncio iniciales de `scripts/datos/`.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo, con el panel de administración |
| `npm run build` | Genera la versión para publicar en `dist/` |
| `npm run preview` | Muestra la versión generada |
| `npm run lint` | Revisa el código con ESLint |
| `npm run cargar-datos` | Carga en Firestore el catálogo y el anuncio iniciales |

## Publicación

Cada `git push` a la rama `main` compila el sitio y lo publica en Netlify (configuración en [netlify.toml](netlify.toml)). En Netlify hay que cargar las variables `VITE_FIREBASE_*` e `IMGBB_KEY`.

## Autor

**Jorge Martinez** · Curso React JS · Talento Tech · Comisión C26243
