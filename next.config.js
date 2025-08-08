/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // Aquí se pueden definir variables de entorno públicas
    LOYVERSE_API_URL: 'https://api.loyverse.com/v1.0',
    SRI_AMBIENTE_PRUEBAS: '1',
    SRI_AMBIENTE_PRODUCCION: '2',
  },
  // Configuración para despliegue en Render
  output: 'standalone',
  // Configuraciones adicionales para mejorar compatibilidad
  poweredByHeader: false,
  generateEtags: false,
  // Configurar puerto para Render
  serverRuntimeConfig: {
    PORT: process.env.PORT || 10000
  },
  // Configuración para manejo de imágenes
  images: {
    domains: ['localhost', 'sri-loyverse.onrender.com'],
    unoptimized: true
  }
}

module.exports = nextConfig
