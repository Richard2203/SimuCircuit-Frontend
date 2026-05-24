/**
 * authService — Autenticacion Firebase Auth + JWT */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { setAuthToken, clearAuthToken } from '../simulator/apiClient';

// Firebase config
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Evitar inicializar Firebase mas de una vez (hot-reload de Vite)
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const auth = getAuth(firebaseApp);

// URL del backend
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// API 

/**
 * Inicia sesion de administrador.
 * 1. Firebase autentica al usuario y devuelve un idToken.
 * 2. El idToken se manda al backend para verificar el claim admin:true.
 *
 * @param {{ correo: string, contrasena: string }} credentials
 * @returns {Promise<{ admin: object, token: string }>}
 */
async function loginAdmin({ correo, contrasena }) {
  // Paso 1 - autenticar con Firebase (cliente)
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, correo, contrasena);
    console.log('Firebase message:', userCredential);
  } catch (firebaseError) {
    // Mapeo de errores
    const mensajes = {
      'auth/invalid-credential':     'Credenciales incorrectas.',
      'auth/user-not-found':         'No existe una cuenta con ese correo.',
      'auth/wrong-password':         'Contraseña incorrecta.',
      'auth/invalid-email':          'El correo no tiene un formato válido.',
      'auth/user-disabled':          'Esta cuenta ha sido deshabilitada.',
      'auth/too-many-requests':      'Demasiados intentos. Intenta más tarde.',
    };
    const err = new Error(mensajes[firebaseError.code] || 'Error al iniciar sesión.');
    err.status = 401;
    throw err;
  }

  // Paso 2 - obtener el idToken firmado por Firebase
  const idToken = await userCredential.user.getIdToken();

  // Paso 3 - verificar en el backend que el usuario tenga claim admin:true
  let backendData;
  try {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken }),
    });

    backendData = await response.json();

    if (!response.ok) {
      // Si el backend rechaza cerrar sesion en Firebase tambien
      await signOut(auth);
      const err = new Error(backendData?.error || 'Acceso denegado.');
      err.status = response.status;
      throw err;
    }
  } catch (e) {
    if (e.status) throw e;
    await signOut(auth);
    throw new Error('No se pudo conectar al servidor.');
  }

  // Paso 4 - guardar el idToken para las siguientes peticiones al backend
  setAuthToken(idToken);

  return {
    admin: backendData.usuario,
    token: idToken,
  };
}

/**
 * Cierra la sesion: revoca en el backend + cierra en Firebase.
 */
async function logoutAdmin() {
  const token = localStorage.getItem('admin_auth_token');

  // Avisar al backend para revocar refresh tokens
  if (token) {
    try {
      await fetch(`${BASE_URL}/api/admin/logout`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // Si falla el backend, igual cerramos sesión localmente
    }
  }

  await signOut(auth);
  clearAuthToken();
}

/**
 * @param {{ correo: string }} params
 */
async function solicitarRecuperacion({ correo }) {
  try {
    await sendPasswordResetEmail(auth, correo);
    return { mensaje: 'Correo de recuperación enviado.' };
  } catch (error) {
    const mensajes = {
      'auth/user-not-found': 'No existe una cuenta con ese correo.',
      'auth/invalid-email':  'El correo no es válido.',
    };
    const err = new Error(mensajes[error.code] || 'Error al solicitar recuperación.');
    err.status = 400;
    throw err;
  }
}

export const authService = {
  loginAdmin,
  logoutAdmin,
  solicitarRecuperacion,
};