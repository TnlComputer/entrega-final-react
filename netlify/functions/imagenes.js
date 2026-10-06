// Netlify Function: /api/imagenes en el sitio publicado (la redirección está en netlify.toml).
// IMGBB_KEY y VITE_FIREBASE_PROJECT_ID se cargan en Netlify (Site configuration → Environment variables).
import subirImagen from '../../server/subirImagen.js';

export default peticion =>
  subirImagen(peticion, {
    claveImgbb: process.env.IMGBB_KEY,
    proyectoFirebase: process.env.VITE_FIREBASE_PROJECT_ID
  });
