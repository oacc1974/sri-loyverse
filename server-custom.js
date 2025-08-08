// server-custom.js - Archivo personalizado para iniciar Next.js en Render
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Determinar el entorno
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '10000', 10);

// Preparar la aplicación Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Crear servidor HTTP
  const server = createServer(async (req, res) => {
    try {
      // Parsear la URL
      const parsedUrl = parse(req.url, true);
      
      // Permitir solicitudes desde cualquier origen (CORS)
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
      
      // Manejar la solicitud con Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error al procesar la solicitud:', err);
      res.statusCode = 500;
      res.end('Error interno del servidor');
    }
  });

  // Escuchar en todos los interfaces (0.0.0.0) para que Render pueda acceder
  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Servidor listo en http://0.0.0.0:${port}`);
  });
});
