import {useState} from 'react';
import {Alert, Button, Form} from 'react-bootstrap';
import {Navigate, useLocation} from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from './Login.module.css';

function Login() {
  const {usuario, cargando, iniciarSesion} = useAuth();
  const ubicacion = useLocation();
  const destino = ubicacion.state?.desde || '/admin';

  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!cargando && usuario) return <Navigate to={destino} replace />;

  const enviar = async evento => {
    evento.preventDefault();
    setError(null);
    const emailLimpio = email.trim();
    if (emailLimpio.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setError('Ingresá un correo electrónico válido.');
      return;
    }
    if (!contrasenia || contrasenia.length > 4096) {
      setError('Ingresá una contraseña válida.');
      return;
    }
    setEnviando(true);

    try {
      await iniciarSesion(emailLimpio, contrasenia);
    } catch (errorCapturado) {
      setError(errorCapturado.message);
      setEnviando(false);
    }
  };

  return (
    <section className={styles.loginPage}>
      <div className={styles.loginCard}>
        <span className="eyebrow">Acceso administración</span>
        <h2>Ingresar</h2>

        <Form onSubmit={enviar} noValidate>
          <Form.Group className="mb-3" controlId="login-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              autoComplete="username"
              maxLength={254}
              value={email}
              onChange={evento => setEmail(evento.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="login-contrasenia">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              maxLength={4096}
              value={contrasenia}
              onChange={evento => setContrasenia(evento.target.value)}
              required
            />
          </Form.Group>

          {error && (
            <Alert variant="danger" className={styles.loginError}>
              {error}
            </Alert>
          )}

          <Button type="submit" variant="dark" className="w-100" disabled={enviando || !email || !contrasenia}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </Form>
      </div>
    </section>
  );
}

export default Login;
