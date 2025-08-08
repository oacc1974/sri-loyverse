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
}

module.exports = nextConfig
