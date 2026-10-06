// Configuración web de Firebase (Consola → Configuración del proyecto → Tus apps).
// No es secreta: identifica al proyecto y termina igual en el JavaScript publicado.
// Lo que protege los datos son las reglas de Firestore (firestore.rules).
// La usan la app, el script de datos iniciales y la función de imágenes.
const firebaseConfig = {
  apiKey: 'AIzaSyD4SKH3iHsFEaNerJHo4b4E85tL30zMFRI',
  authDomain: 'el-anzuelo-1c2e0.firebaseapp.com',
  projectId: 'el-anzuelo-1c2e0',
  storageBucket: 'el-anzuelo-1c2e0.firebasestorage.app',
  messagingSenderId: '278020877611',
  appId: '1:278020877611:web:e3024f5f1a2763a0de696e'
};

export default firebaseConfig;
