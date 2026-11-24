import {useEffect, useState} from 'react';
import {eliminarCupon, guardarCupon, listarUsuarios, observarCupones} from '../services/cuponesApi';

function useAdminCupones() {
  const [cupones, setCupones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(
    () =>
      observarCupones(
        datos => {
          setCupones([...datos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)));
          setCargando(false);
        },
        errorCapturado => {
          setError(errorCapturado.message);
          setCargando(false);
        }
      ),
    []
  );

  useEffect(() => {
    let cancelado = false;

    listarUsuarios()
      .then(datos => {
        if (!cancelado) setUsuarios(datos);
      })
      .catch(errorCapturado => {
        if (!cancelado) setError(errorCapturado.message);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return {cupones, usuarios, cargando, error, crearCupon: guardarCupon, eliminarCupon};
}

export default useAdminCupones;
