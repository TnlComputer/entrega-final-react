import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Layout from './components/Layout/Layout';
import RutaPrivada from './components/RutaPrivada/RutaPrivada';
import ScrollAlInicio from './components/ScrollAlInicio/ScrollAlInicio';
import AuthProvider from './context/AuthProvider';
import useCatalogo from './hooks/useCatalogo';
import AdminAnuncio from './Pages/Admin/AdminAnuncio';
import AdminEnvios from './Pages/Admin/AdminEnvios';
import AdminLayout from './Pages/Admin/AdminLayout';
import AdminProductos from './Pages/Admin/AdminProductos';
import AdminRubros from './Pages/Admin/AdminRubros';
import ProductoForm from './Pages/Admin/ProductoForm';
import Home from './Pages/Home';
import Login from './Pages/Login';
import "./styles.css";

function App() {
  const catalogo = useCatalogo();
  const {productos} = catalogo;

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollAlInicio />
      <AuthProvider>
        <Routes>
          <Route element={<Layout productos={productos} catalogo={catalogo} />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <RutaPrivada>
                  <AdminLayout />
                </RutaPrivada>
              }>
              <Route index element={<AdminProductos />} />
              <Route path="productos/nuevo" element={<ProductoForm />} />
              <Route path="productos/:id" element={<ProductoForm />} />
              <Route path="rubros" element={<AdminRubros />} />
              <Route path="anuncio" element={<AdminAnuncio />} />
              <Route path="envios" element={<AdminEnvios />} />
            </Route>
            <Route path="*" element={<p>No encontramos esta página.</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
