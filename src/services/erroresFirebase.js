const MENSAJES_FIREBASE = {
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/email-already-in-use': 'Ya hay una cuenta con ese email.',
  'auth/weak-password': 'La contraseña es muy débil: usá al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisá internet.',
  'permission-denied': 'No tenés permiso para hacer esta operación. Iniciá sesión de nuevo.',
  unavailable: 'No hay conexión con la base de datos. Revisá internet.'
};

const traducir = error => new Error(MENSAJES_FIREBASE[error.code] || error.message || 'Algo salió mal.', {cause: error});

export default traducir;
