import {useOutletContext} from 'react-router-dom';
import ItemListContainer from '../components/ItemListContainer/ItemListContainer';

function Productos() {
  const {catalogo} = useOutletContext();

  return <ItemListContainer catalogo={catalogo} />;
}

export default Productos;
