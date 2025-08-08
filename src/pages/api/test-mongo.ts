import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { ConfiguracionModel } from '../../models/configuracionModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    if (req.method === 'GET') {
      // Obtener todas las configuraciones
      const configuraciones = await ConfiguracionModel.find({});
      return res.status(200).json({ 
        success: true, 
        message: 'Conexión a MongoDB exitosa', 
        count: configuraciones.length,
        data: configuraciones 
      });
    } 
    else if (req.method === 'POST') {
      // Crear una configuración de prueba
      const testConfig = new ConfiguracionModel({
        loyverseToken: 'token-prueba',
        ruc: '0000000000001',
        razonSocial: 'Empresa de Prueba',
        nombreComercial: 'Prueba MongoDB',
        direccion: 'Dirección de prueba',
        email: 'test@example.com',
        impuestoIVA: '12',
        ambiente: 'pruebas',
        automatizacion: false,
        intervaloMinutos: '15'
      });
      
      // Guardar en la base de datos
      const savedConfig = await testConfig.save();
      
      return res.status(201).json({ 
        success: true, 
        message: 'Configuración de prueba guardada correctamente', 
        data: savedConfig 
      });
    }
    
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en test-mongo:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error al conectar con MongoDB: ${error.message}`,
      error: error.toString()
    });
  }
}
