import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { FacturaModel } from '../../../models/facturaModel';
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
        message: 'ID de factura inválido' 
      });
    }
    
    // Manejar diferentes métodos HTTP
    switch (req.method) {
      case 'GET':
        return await getFactura(req, res, id as string);
      case 'PUT':
        return await actualizarFactura(req, res, id as string);
      case 'DELETE':
        return await eliminarFactura(req, res, id as string);
      default:
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
  } catch (error: any) {
    console.error('Error en el endpoint de factura por ID:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error en el servidor: ${error.message}`,
      error: error.toString()
    });
  }
}

// GET - Obtener una factura específica
async function getFactura(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const factura = await FacturaModel.findById(id);
    
    if (!factura) {
      return res.status(404).json({ 
        success: false, 
        message: 'Factura no encontrada' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: factura 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al obtener factura: ${error.message}` 
    });
  }
}

// PUT - Actualizar una factura existente
async function actualizarFactura(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Buscar y actualizar la factura
    const facturaActualizada = await FacturaModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!facturaActualizada) {
      return res.status(404).json({ 
        success: false, 
        message: 'Factura no encontrada' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Factura actualizada exitosamente',
      data: facturaActualizada 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al actualizar factura: ${error.message}` 
    });
  }
}

// DELETE - Eliminar una factura
async function eliminarFactura(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const facturaEliminada = await FacturaModel.findByIdAndDelete(id);
    
    if (!facturaEliminada) {
      return res.status(404).json({ 
        success: false, 
        message: 'Factura no encontrada' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Factura eliminada exitosamente' 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al eliminar factura: ${error.message}` 
    });
  }
}
