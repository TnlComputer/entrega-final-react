// Sesión de usuarios (Firebase Authentication)
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import traducir from './erroresFirebase';
import {auth, db} from './firebase';

async function esAdmin(uid) {
  try {
    return (await getDoc(doc(db, 'admins', uid))).exists();
  } catch {
    return false;
  }
}

const aUsuario = async cuenta => {
  const admin = await esAdmin(cuenta.uid);
  return {
    uid: cuenta.uid,
    email: cuenta.email,
    nombre: cuenta.displayName || cuenta.email.split('@')[0],
    esAdmin: admin
  };
};

// Avisa cuando cambia la sesión
export function observarSesion(callback) {
  return onAuthStateChanged(auth, async cuenta => {
    const usuario = cuenta ? await aUsuario(cuenta) : null;
    // Ignora la respuesta si la sesión cambió en el medio
    if (auth.currentUser?.uid === cuenta?.uid) callback(usuario);
  });
}

export async function iniciarSesion(email, contrasenia) {
  try {
    const {user} = await signInWithEmailAndPassword(auth, email, contrasenia);
    return await aUsuario(user);
  } catch (error) {
    throw traducir(error);
  }
}

export async function registrarse({nombre, email, contrasenia}) {
  try {
    const {user} = await createUserWithEmailAndPassword(auth, email, contrasenia);
    await updateProfile(user, {displayName: nombre});
    await setDoc(doc(db, 'usuarios', user.uid), {
      uid: user.uid,
      nombre,
      email: user.email,
      creadoEn: new Date().toISOString()
    });
    return await aUsuario(user);
  } catch (error) {
    throw traducir(error);
  }
}

export function cerrarSesion() {
  return signOut(auth);
}

// Cabecera con la sesión, si hay
export async function cabeceraSesion() {
  return auth.currentUser ? {Authorization: `Bearer ${await auth.currentUser.getIdToken()}`} : {};
}

// Token para las funciones del servidor
export async function obtenerToken() {
  if (!auth.currentUser) throw new Error('Iniciá sesión de nuevo.');
  return auth.currentUser.getIdToken();
}
