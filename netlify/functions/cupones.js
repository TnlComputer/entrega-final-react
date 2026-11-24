import firebaseConfig from '../../src/services/firebaseConfig.js';
import registrarEntrada from '../../server/cupones.js';

export default peticion =>
  registrarEntrada(peticion, {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: firebaseConfig.projectId
  });
