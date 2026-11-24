import {useContext} from 'react';
import CuponesContext from '../context/CuponesContext';

function useCupones() {
  const contexto = useContext(CuponesContext);

  if (!contexto) {
    throw new Error('useCupones tiene que usarse dentro de <CuponesProvider>');
  }

  return contexto;
}

export default useCupones;
