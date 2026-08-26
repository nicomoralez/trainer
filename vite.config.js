import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Sin esto, Vite en Windows a veces solo escucha en IPv6 (::1) y
    // "localhost"/"127.0.0.1" no conectan según cómo resuelva el navegador.
    host: true,
  },
})
