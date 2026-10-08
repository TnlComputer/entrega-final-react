import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import imagenesDev from './server/imagenesDev.js'
import firebaseConfig from './src/services/firebaseConfig.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' para leer también las variables sin VITE_
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      imagenesDev({
        claveImgbb: env.IMGBB_KEY,
        cuentaServicioFirebase: env.FIREBASE_SERVICE_ACCOUNT_JSON,
        proyectoFirebase: firebaseConfig.projectId
      })
    ],
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    },
  }
})
