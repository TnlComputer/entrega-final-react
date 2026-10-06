import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import imagenesDev from './server/imagenesDev.js'
import firebaseConfig from './src/services/firebaseConfig.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // El prefijo '' lee también las variables sin VITE_ (solo quedan en el servidor)
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
        // .team-card se usa como styles.teamCard (y también styles['team-card'])
        localsConvention: 'camelCase'
      }
    },
  }
})
