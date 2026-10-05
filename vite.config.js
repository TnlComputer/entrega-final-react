import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import catalogoApi from './server/catalogoApi.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // El prefijo '' lee también las variables sin VITE_ (solo quedan en el servidor)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      catalogoApi({ email: env.ADMIN_EMAIL, contrasenia: env.ADMIN_PASSWORD, claveImgbb: env.IMGBB_KEY })
    ],
    css: {
      modules: {
        // .team-card se usa como styles.teamCard (y también styles['team-card'])
        localsConvention: 'camelCase'
      }
    },
  }
})
