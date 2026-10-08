// /api/imagenes en Netlify
import firebaseConfig from '../../src/services/firebaseConfig.js';
import subirImagen from '../../server/subirImagen.js';

export default peticion =>
  subirImagen(peticion, {
    claveImgbb: process.env.IMGBB_KEY,
    proyectoFirebase: firebaseConfig.projectId
  });
