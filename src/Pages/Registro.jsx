import {useState} from 'react';
import {Alert, Button, Form} from 'react-bootstrap';
import {Link, Navigate, useLocation} from 'react-router-dom';
import {MAX_EMAIL, emailValido, normalizarEmail} from '../data/modeloCompra';
import useAuth from '../hooks/useAuth';
import styles from './Login.module.css';

const FORMULARIO_VACIO = {nombre: '', email: '', contrasenia: '', repetida: ''};

function validar({nombre, email, contrasenia, repetida}) {
  const errores = {};
  if (nombre.trim().length < 2) errores.nombre = 'Ingresá tu nombre.';
  if (!emailValido(email)) errores.email = 'Ingresá un correo electrónico válido.';
  if (contrasenia.length < 6) errores.contrasenia = 'Usá al menos 6 caracteres.';
  if (repetida !== contrasenia) errores.repetida = 'Las contraseñas no coinciden.';
  return errores;
}

function Registro() {
  const {usuario, cargando, registrarse} = useAuth();
  const ubicacion = useLocation();
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const errores = validar(formulario);
  const error = campo => (intentoEnviar ? errores[campo] : undefined);

  // Espera a que termine el alta antes de salir
  if (!cargando && usuario && !enviando && !errorGeneral) {
    return <Navigate to={ubicacion.state?.desde || '/perfil'} replace />;
  }

  const cambiar = campo => evento => setFormulario(actual => ({...actual, [campo]: evento.target.value}));

  const enviar = async evento => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setErrorGeneral(null);
    if (Object.keys(errores).length) return;

    setEnviando(true);
    try {
      await registrarse({
        nombre: formulario.nombre.trim(),
        email: normalizarEmail(formulario.email),
        contrasenia: formulario.contrasenia
      });
    } catch (errorCapturado) {
      setErrorGeneral(errorCapturado.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={styles.loginPage}>
      <div className={styles.loginCard}>
        <span className="eyebrow">Cuenta nueva</span>
        <h2>Registrarse</h2>

        <Form onSubmit={enviar} noValidate>
          <Form.Group className="mb-3" controlId="registro-nombre">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              autoComplete="name"
              maxLength={60}
              value={formulario.nombre}
              onChange={cambiar('nombre')}
              isInvalid={Boolean(error('nombre'))}
            />
            <Form.Control.Feedback type="invalid">{error('nombre')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="registro-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              autoComplete="username"
              maxLength={MAX_EMAIL}
              value={formulario.email}
              onChange={cambiar('email')}
              isInvalid={Boolean(error('email'))}
            />
            <Form.Control.Feedback type="invalid">{error('email')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="registro-contrasenia">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              maxLength={4096}
              value={formulario.contrasenia}
              onChange={cambiar('contrasenia')}
              isInvalid={Boolean(error('contrasenia'))}
            />
            <Form.Control.Feedback type="invalid">{error('contrasenia')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="registro-repetida">
            <Form.Label>Repetí la contraseña</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              maxLength={4096}
              value={formulario.repetida}
              onChange={cambiar('repetida')}
              isInvalid={Boolean(error('repetida'))}
            />
            <Form.Control.Feedback type="invalid">{error('repetida')}</Form.Control.Feedback>
          </Form.Group>

          {errorGeneral && (
            <Alert variant="danger" className={styles.loginError}>
              {errorGeneral}
            </Alert>
          )}

          <Button type="submit" variant="dark" className="w-100" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </Form>

        <p className={styles.alternativa}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" state={ubicacion.state}>
            Ingresá
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Registro;
