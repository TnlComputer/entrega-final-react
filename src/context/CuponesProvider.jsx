import {useEffect, useState} from 'react';
import {estadoCupon} from '../data/modeloCupones';
import useAuth from '../hooks/useAuth';
import {observarCuponesDe, registrarEntrada} from '../services/cuponesApi';
import CuponesContext from './CuponesContext';

const CLAVE_ENTRADA = 'entrada';
const INTERVALO_VENCIMIENTO = 15000;
const SIN_CUPONES = {uid: null, cupones: [], error: null};

function CuponesProvider({children}) {
  const {usuario, esAdmin, cargando: cargandoSesion} = useAuth();
  const uid = usuario?.uid ?? null;
  const [guardados, setGuardados] = useState(SIN_CUPONES);
  const [codigoElegido, setCodigoElegido] = useState(null);
  const [entrada, setEntrada] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!uid) return undefined;
    return observarCuponesDe(
      uid,
      cupones => {
        setAhora(Date.now());
        setGuardados({uid, cupones, error: null});
      },
      error => setGuardados({uid, cupones: [], error: error.message})
    );
  }, [uid]);

  // Para que los vencidos dejen de ofrecerse
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), INTERVALO_VENCIMIENTO);
    return () => clearInterval(id);
  }, []);

  // Una entrada por inicio de sesión
  useEffect(() => {
    if (cargandoSesion) return;
    if (!uid) {
      sessionStorage.removeItem(CLAVE_ENTRADA);
      return;
    }
    if (esAdmin || sessionStorage.getItem(CLAVE_ENTRADA) === uid) return;

    sessionStorage.setItem(CLAVE_ENTRADA, uid);
    registrarEntrada()
      .then(datos => {
        if (datos.cupon) setEntrada({uid, ...datos});
      })
      // Si falla, se reintenta en la próxima carga
      .catch(() => sessionStorage.removeItem(CLAVE_ENTRADA));
  }, [uid, esAdmin, cargandoSesion]);

  const propios = guardados.uid === uid ? guardados : SIN_CUPONES;
  const cupones = [...propios.cupones].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  const activos = cupones.filter(cupon => estadoCupon(cupon, ahora) === 'activo');

  return (
    <CuponesContext.Provider
      value={{
        cupones,
        activos,
        ahora,
        cargando: Boolean(uid) && guardados.uid !== uid,
        error: propios.error,
        cuponAplicado: activos.find(cupon => cupon.codigo === codigoElegido) ?? null,
        aplicarCupon: setCodigoElegido,
        quitarCupon: () => setCodigoElegido(null),
        entrada: entrada?.uid === uid ? entrada : null,
        cerrarEntrada: () => setEntrada(null)
      }}>
      {children}
    </CuponesContext.Provider>
  );
}

export default CuponesProvider;
