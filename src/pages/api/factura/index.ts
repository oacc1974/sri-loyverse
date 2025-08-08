import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { FacturaModel } from '../../../models/facturaModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    // Manejar diferentes métodos HTTP
    switch (req.method) {
      case 'GET':
        return await getFacturas(req, res);
      case 'POST':
        return await crearFactura(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }
  } catch (error: any) {
    console.error('Error en el endpoint de factura:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error en el servidor: ${error.message}`,
      error: error.toString()
    });
  }
}

// GET - Obtener todas las facturas con filtros opcionales
async function getFacturas(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      estado, 
      fechaDesde, 
      fechaHasta, 
      ruc, 
      ambiente,
      limit = 50, 
      page = 1 
    } = req.query;
    
    // Construir filtro
    const filtro: any = {};
    
    if (estado) filtro.estado = estado;
    if (ambiente) filtro.ambiente = ambiente;
    if (ruc) filtro['cliente.ruc'] = ruc;
    
    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      filtro.createdAt = {};
      if (fechaDesde) filtro.createdAt.$gte = new Date(fechaDesde as string);
      if (fechaHasta) filtro.createdAt.$lte = new Date(fechaHasta as string);
    }
    
    // Calcular paginación
    const skip = (Number(page) - 1) * Number(limit);
    
    // Obtener facturas con paginación
    const facturas = await FacturaModel.find(filtro)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Contar total de facturas para la paginación
    const total = await FacturaModel.countDocuments(filtro);
    
    return res.status(200).json({ 
      success: true, 
      count: facturas.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: facturas 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al obtener facturas: ${error.message}` 
    });
  }
}

// POST - Crear una nueva factura
async function crearFactura(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validar datos requeridos mínimos
    const { 
      ambiente, ruc, razonSocial, nombreComercial, 
      codDoc, estab, ptoEmi, secuencial, 
      fechaEmision, cliente, detalles 
    } = req.body;

    if (!ambiente || !ruc || !razonSocial || !nombreComercial || 
        !codDoc || !estab || !ptoEmi || !secuencial || 
        !fechaEmision || !cliente || !detalles || !Array.isArray(detalles)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos para la factura' 
      });
    }

    // Crear nueva factura
    const factura = await FacturaModel.create(req.body);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Factura creada exitosamente',
      data: factura 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: `Error al crear factura: ${error.message}` 
    });
  }
}
