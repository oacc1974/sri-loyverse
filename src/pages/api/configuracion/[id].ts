import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { ConfiguracionModel } from '../../../models/configuracionModel';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    const { id } = req.query;
    
    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de configuración inválido' 
      });
    }
    
    // Manejar diferentes métodos HTTP
    switch (req.method) {
      case 'GET':
        return await getConfiguracion(req, res, id as string);
      case 'PUT':
        return await actualizarConfiguracion(req, res, id as string);
      case 'DELETE':
        return await eliminarConfiguracion(req, res, id as string);
      default:
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
  } catch (error: any) {
    console.error('Error en el endpoint de configuración por ID:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error en el servidor: ${error.message}`,
      error: error.toString()
    });
  }
}

// GET - Obtener una configuración específica
async function getConfiguracion(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const configuracion = await ConfiguracionModel.findById(id);
    
    if (!configuracion) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuración no encontrada' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: configuracion 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al obtener configuración: ${error.message}` 
    });
  }
}

// PUT - Actualizar una configuración existente
async function actualizarConfiguracion(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Buscar y actualizar la configuración
    const configuracionActualizada = await ConfiguracionModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!configuracionActualizada) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuración no encontrada' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Configuración actualizada exitosamente',
      data: configuracionActualizada 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al actualizar configuración: ${error.message}` 
    });
  }
}

// DELETE - Eliminar una configuración
async function eliminarConfiguracion(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const configuracionEliminada = await ConfiguracionModel.findByIdAndDelete(id);
    
    if (!configuracionEliminada) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuración no encontrada' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Configuración eliminada exitosamente' 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al eliminar configuración: ${error.message}` 
    });
  }
}
