import {useOutletContext} from 'react-router-dom';
import ItemListContainer from '../components/ItemListContainer/ItemListContainer';

function Productos() {
  const {onAgregarAlCarrito, catalogo, comprasConfirmadas} = useOutletContext();

  return (
    <ItemListContainer
      catalogo={catalogo}
      onAgregarAlCarrito={onAgregarAlCarrito}
      comprasConfirmadas={comprasConfirmadas}
    />
  );
}

export default Productos;
