import {useEffect, useState} from 'react';
import * as authApi from '../services/authApi';
import AuthContext from './AuthContext';

function AuthProvider({children}) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(
    () =>
      authApi.observarSesion(datos => {
        setUsuario(datos);
        setCargando(false);
      }),
    []
  );

  const iniciarSesion = async (email, contrasenia) => setUsuario(await authApi.iniciarSesion(email, contrasenia));

  const registrarse = async datos => setUsuario(await authApi.registrarse(datos));

  const cerrarSesion = async () => {
    await authApi.cerrarSesion().catch(() => {});
    setUsuario(null);
  };

  const esAdmin = Boolean(usuario?.esAdmin);

  return (
    <AuthContext.Provider value={{usuario, esAdmin, cargando, iniciarSesion, registrarse, cerrarSesion}}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
