// Endpoint simple para probar la conexión a MongoDB
import mongoose from 'mongoose';

export default async function handler(req, res) {
  try {
    // Verificar si existe la variable de entorno
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error: No se ha configurado la variable de entorno MONGODB_URI' 
      });
    }
    
    // Intentar conectar a MongoDB con opciones avanzadas
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
      retryWrites: true,
      retryReads: true,
      w: 'majority'
    });
    
    // Si llegamos aquí, la conexión fue exitosa
    return res.status(200).json({ 
      success: true, 
      message: 'Conexión a MongoDB exitosa',
      dbName: conn.connection.db.databaseName,
      host: conn.connection.host
    });
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error al conectar con MongoDB: ${error.message}`,
      error: error.toString()
    });
  }
}
