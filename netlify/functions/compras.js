import firebaseConfig from '../../src/services/firebaseConfig.js';
import comprar from '../../server/comprar.js';

export default peticion =>
  comprar(peticion, {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: firebaseConfig.projectId
  });
