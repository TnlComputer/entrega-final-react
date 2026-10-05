import {useEffect, useState} from 'react';
import * as adminApi from '../services/adminApi';
import AuthContext from './AuthContext';

// En local, la contraseña se valida en server/catalogoApi.js (con ADMIN_EMAIL y
// ADMIN_PASSWORD de .env.local), nunca en el navegador.
// En el sitio publicado, por ahora, no se valida: ver MODO_DEMO en services/adminApi.js.
function AuthProvider({children}) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(adminApi.leerToken()));

  useEffect(() => {
    if (!adminApi.leerToken()) return;

    let cancelado = false;
    adminApi.consultarSesion().then(email => {
      if (cancelado) return;
      setUsuario(email ? {email} : null);
      setCargando(false);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  const iniciarSesion = async (email, contrasenia) => {
    const emailConfirmado = await adminApi.iniciarSesion(email, contrasenia);
    setUsuario({email: emailConfirmado});
  };

  const cerrarSesion = async () => {
    await adminApi.cerrarSesion().catch(() => {});
    setUsuario(null);
  };

  // Hay un solo usuario y es el admin
  const esAdmin = Boolean(usuario);

  return (
    <AuthContext.Provider value={{usuario, esAdmin, cargando, iniciarSesion, cerrarSesion}}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
