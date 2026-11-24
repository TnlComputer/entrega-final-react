import {useEffect, useRef, useState} from 'react';
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
  const quien = uid ?? 'visitante';
  const ultimoRef = useRef(null);
  const [delVisitante, setDelVisitante] = useState([]);
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

  // Cada sesión del navegador cuenta como una entrada
  useEffect(() => {
    if (cargandoSesion || ultimoRef.current === quien) return;
    ultimoRef.current = quien;

    const nueva = !esAdmin && !sessionStorage.getItem(CLAVE_ENTRADA);
    if (nueva) sessionStorage.setItem(CLAVE_ENTRADA, '1');
    registrarEntrada(nueva)
      .then(datos => {
        if (ultimoRef.current !== quien) return;
        if (!uid) setDelVisitante(datos.activos);
        if (datos.cupon) setEntrada({quien, ...datos});
      })
      // Si falla, se reintenta en la próxima carga
      .catch(() => {
        if (nueva) sessionStorage.removeItem(CLAVE_ENTRADA);
      });
  }, [quien, uid, esAdmin, cargandoSesion]);

  const marcarUsado = codigo =>
    setDelVisitante(actuales => actuales.filter(cupon => cupon.codigo !== codigo));

  const propios = guardados.uid === uid ? guardados : SIN_CUPONES;
  const cupones = [...(uid ? propios.cupones : delVisitante)].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
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
        marcarUsado,
        quitarCupon: () => setCodigoElegido(null),
        entrada: entrada?.quien === quien ? entrada : null,
        cerrarEntrada: () => setEntrada(null)
      }}>
      {children}
    </CuponesContext.Provider>
  );
}

export default CuponesProvider;
