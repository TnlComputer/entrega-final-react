import {useEffect, useState} from 'react';
import * as adminApi from '../services/adminApi';
import AuthContext from './AuthContext';

function AuthProvider({children}) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(
    () =>
      adminApi.observarSesion(email => {
        setUsuario(email ? {email} : null);
        setCargando(false);
      }),
    []
  );

  const iniciarSesion = async (email, contrasenia) => {
    const emailConfirmado = await adminApi.iniciarSesion(email, contrasenia);
    setUsuario({email: emailConfirmado});
  };

  const cerrarSesion = async () => {
    await adminApi.cerrarSesion().catch(() => {});
    setUsuario(null);
  };

  // Solo los admins quedan con sesión iniciada
  const esAdmin = Boolean(usuario);

  return (
    <AuthContext.Provider value={{usuario, esAdmin, cargando, iniciarSesion, cerrarSesion}}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
