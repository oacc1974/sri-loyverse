import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { ConfiguracionModel } from '../../../models/configuracionModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    // Manejar diferentes métodos HTTP
    switch (req.method) {
      case 'GET':
        return await getConfiguraciones(req, res);
      case 'POST':
        return await crearConfiguracion(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
  } catch (error: any) {
    console.error('Error en el endpoint de configuración:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error en el servidor: ${error.message}`,
      error: error.toString()
    });
  }
}

// GET - Obtener todas las configuraciones
async function getConfiguraciones(req: NextApiRequest, res: NextApiResponse) {
  try {
    const configuraciones = await ConfiguracionModel.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ 
      success: true, 
      count: configuraciones.length,
      data: configuraciones 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al obtener configuraciones: ${error.message}` 
    });
  }
}

// POST - Crear o actualizar configuración
async function crearConfiguracion(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validar datos requeridos
    const { 
      loyverseToken, ruc, razonSocial, nombreComercial, 
      direccion, email, impuestoIVA, ambiente 
    } = req.body;

    if (!loyverseToken || !ruc || !razonSocial || !nombreComercial || 
        !direccion || !email || !impuestoIVA || !ambiente) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos' 
      });
    }

    // Buscar si ya existe una configuración para este ambiente
    let configuracion = await ConfiguracionModel.findOne({ ambiente });
    
    if (configuracion) {
      // Actualizar la configuración existente
      configuracion = await ConfiguracionModel.findByIdAndUpdate(
        configuracion._id,
        req.body,
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({ 
        success: true, 
        message: 'Configuración actualizada exitosamente',
        data: configuracion 
      });
    } else {
      // Crear nueva configuración
      configuracion = await ConfiguracionModel.create(req.body);
      
      return res.status(201).json({ 
        success: true, 
        message: 'Configuración creada exitosamente',
        data: configuracion 
      });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al crear/actualizar configuración: ${error.message}` 
    });
  }
}
