import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                // Reescribimos correctamente eliminando el prefijo /api
                rewrite: path => path.replace(/^\/api/, ''),
                ws: true,
            }
        }
    }
})
