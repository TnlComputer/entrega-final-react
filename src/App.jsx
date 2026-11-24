import {BrowserRouter, Route, Routes} from 'react-router-dom';
import ItemDetalle from './components/ItemDetalle/ItemDetalle';
import Layout from './components/Layout/Layout';
import RutaPrivada from './components/RutaPrivada/RutaPrivada';
import ScrollAlInicio from './components/ScrollAlInicio/ScrollAlInicio';
import AuthProvider from './context/AuthProvider';
import CartProvider from './context/CartProvider';
import CuponesProvider from './context/CuponesProvider';
import useCatalogo from './hooks/useCatalogo';
import AdminAnuncio from './Pages/Admin/AdminAnuncio';
import AdminCupones from './Pages/Admin/AdminCupones';
import AdminEnvios from './Pages/Admin/AdminEnvios';
import AdminLayout from './Pages/Admin/AdminLayout';
import AdminProductos from './Pages/Admin/AdminProductos';
import AdminRubros from './Pages/Admin/AdminRubros';
import ProductoForm from './Pages/Admin/ProductoForm';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Nosotros from './Pages/Nosotros';
import Perfil from './Pages/Perfil';
import Productos from './Pages/Productos';
import Registro from './Pages/Registro';
import "./styles.css";

function App() {
  const catalogo = useCatalogo();

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollAlInicio />
      <AuthProvider>
        <CuponesProvider>
          <CartProvider catalogo={catalogo}>
            <Routes>
              <Route element={<Layout catalogo={catalogo} />}>
                <Route path="/" element={<Home />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/productos/:id" element={<ItemDetalle />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route
                  path="/perfil"
                  element={
                    <RutaPrivada>
                      <Perfil />
                    </RutaPrivada>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RutaPrivada soloAdmin>
                      <AdminLayout />
                    </RutaPrivada>
                  }>
                  <Route index element={<AdminProductos />} />
                  <Route path="productos/nuevo" element={<ProductoForm />} />
                  <Route path="productos/:id" element={<ProductoForm />} />
                  <Route path="rubros" element={<AdminRubros />} />
                  <Route path="anuncio" element={<AdminAnuncio />} />
                  <Route path="cupones" element={<AdminCupones />} />
                  <Route path="envios" element={<AdminEnvios />} />
                </Route>
                <Route path="*" element={<p>No encontramos esta página.</p>} />
              </Route>
            </Routes>
          </CartProvider>
        </CuponesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
