// Netlify Function: /api/imagenes en el sitio publicado (la redirección está en netlify.toml).
// IMGBB_KEY se carga en Netlify (Site configuration → Environment variables).
import firebaseConfig from '../../src/services/firebaseConfig.js';
import subirImagen from '../../server/subirImagen.js';

export default peticion =>
  subirImagen(peticion, {
    claveImgbb: process.env.IMGBB_KEY,
    proyectoFirebase: firebaseConfig.projectId
  });
