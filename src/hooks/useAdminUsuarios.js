import {useEffect, useState} from 'react';
import * as usuariosApi from '../services/usuariosApi';

function useAdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    usuariosApi
      .listarUsuarios()
      .then(datos => {
        if (!cancelado) setUsuarios(datos);
      })
      .catch(errorCapturado => {
        if (!cancelado) setError(errorCapturado.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const eliminarUsuario = async uid => {
    await usuariosApi.eliminarUsuario(uid);
    setUsuarios(actuales => actuales.filter(usuario => usuario.uid !== uid));
  };

  return {usuarios, cargando, error, eliminarUsuario};
}

export default useAdminUsuarios;
