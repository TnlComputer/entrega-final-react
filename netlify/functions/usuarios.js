import firebaseConfig from '../../src/services/firebaseConfig.js';
import usuarios from '../../server/usuarios.js';

export default peticion =>
  usuarios(peticion, {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: firebaseConfig.projectId
  });
