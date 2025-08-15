import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { ConfiguracionModel } from '../../../models/configuracionModel';
import { FacturaModel } from '../../../models/facturaModel';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Solo permitir método GET
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    // Conectar a la base de datos
    await connectToDatabase();
    
    // Obtener parámetros de consulta
    const { 
      created_at_min, 
      created_at_max,
      ambiente = 'pruebas',
      limit = '10'
    } = req.query;
    
    // Obtener la configuración activa para el ambiente especificado
    const configuracion = await ConfiguracionModel.findOne({
      ambiente: ambiente
    }).sort({ createdAt: -1 });
    
    if (!configuracion) {
      return res.status(404).json({ 
        success: false, 
        message: `No se encontró configuración para el ambiente ${ambiente}` 
      });
    }
    
    if (!configuracion.loyverseToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha configurado el token de Loyverse' 
      });
    }
    
    // Construir URL para la API de Loyverse
    let url = 'https://api.loyverse.com/v1.0/receipts';
    const params: any = {};
    
    if (created_at_min) params.created_at_min = created_at_min;
    if (created_at_max) params.created_at_max = created_at_max;
    if (limit) params.limit = limit;
    
    // Realizar solicitud a la API de Loyverse
    const loyverseResponse = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${configuracion.loyverseToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Procesar las facturas recibidas de Loyverse
    const receipts = loyverseResponse.data.receipts || [];
    const facturasProcesadas = [];
    
    for (const receipt of receipts) {
      // Verificar si la factura ya existe en la base de datos
      const facturaExistente = await FacturaModel.findOne({ loyverseId: receipt.receipt_number });
      
      if (facturaExistente) {
        facturasProcesadas.push({
          loyverseId: receipt.receipt_number,
          estado: 'YA_EXISTE',
          facturaId: facturaExistente._id
        });
        continue;
      }
      
      // Mapear datos de Loyverse a formato de factura SRI
      const nuevaFactura = mapearLoyverseAFactura(receipt, configuracion);
      
      // Guardar la nueva factura en la base de datos
      const facturaGuardada = await FacturaModel.create(nuevaFactura);
      
      facturasProcesadas.push({
        loyverseId: receipt.receipt_number,
        estado: 'CREADA',
        facturaId: facturaGuardada._id
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Se procesaron ${receipts.length} facturas de Loyverse`,
      total: receipts.length,
      facturas: facturasProcesadas
    });
  } catch (error: any) {
    console.error('Error al obtener facturas de Loyverse:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error al obtener facturas de Loyverse: ${error.message}`,
      error: error.toString()
    });
  }
}

// Función para mapear datos de Loyverse al formato de factura SRI
function mapearLoyverseAFactura(receipt: any, configuracion: any) {
  // Obtener fecha en formato dd/mm/yyyy
  const fecha = new Date(receipt.created_at);
  const fechaEmision = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
  
  // Generar secuencial con padding de ceros
  const secuencial = receipt.receipt_number.toString().padStart(9, '0');
  
  // Mapear cliente
  const cliente = {
    ruc: receipt.customer?.id || '9999999999999',
    razonSocial: receipt.customer?.name || 'CONSUMIDOR FINAL',
    direccion: receipt.customer?.address || 'N/A',
    telefono: receipt.customer?.phone_number || '',
    email: receipt.customer?.email || ''
  };
  
  // Mapear detalles de productos
  const detalles = receipt.line_items.map((item: any) => {
    const precioUnitario = parseFloat(item.price);
    const cantidad = parseFloat(item.quantity);
    const descuento = parseFloat(item.discount_amount || '0');
    const precioTotalSinImpuesto = (precioUnitario * cantidad) - descuento;
    
    // Calcular impuestos
    const impuestos = [];
    // Usar el impuesto IVA desde la configuración
    const impuestoIVA = parseFloat(configuracion.impuestoIVA || '12');
    
    // Determinar el código de porcentaje según la tasa de IVA de la configuración
    const codigoPorcentajeIVA = impuestoIVA.toString();
    
    // Agregar IVA
    impuestos.push({
      codigo: '2', // Código para IVA
      codigoPorcentaje: codigoPorcentajeIVA, // Usar directamente el valor de la configuración
      tarifa: impuestoIVA, // Usar el valor de la configuración
      baseImponible: precioTotalSinImpuesto,
      valor: precioTotalSinImpuesto * (impuestoIVA / 100)
    });
    
    return {
      codigo: item.item_code || item.item_id,
      descripcion: item.item_name,
      cantidad: cantidad,
      precioUnitario: precioUnitario,
      descuento: descuento,
      precioTotalSinImpuesto: precioTotalSinImpuesto,
      impuestos: impuestos
    };
  });
  
  // Calcular totales
  const totalSinImpuestos = detalles.reduce((sum: number, item: any) => sum + item.precioTotalSinImpuesto, 0);
  const totalDescuento = detalles.reduce((sum: number, item: any) => sum + item.descuento, 0);
  const totalIVA = detalles.reduce((sum: number, item: any) => {
    return sum + item.impuestos.reduce((ivaSum: number, impuesto: any) => {
      return ivaSum + impuesto.valor;
    }, 0);
  }, 0);
  const importeTotal = totalSinImpuestos + totalIVA;
  
  // Construir objeto de factura
  return {
    loyverseId: receipt.receipt_number,
    ambiente: configuracion.ambiente === 'pruebas' ? '1' : '2', // 1=Pruebas, 2=Producción
    tipoEmision: '1', // Emisión normal
    razonSocial: configuracion.razonSocial,
    nombreComercial: configuracion.nombreComercial,
    ruc: configuracion.ruc,
    codDoc: '01', // Código para factura
    estab: '001', // Establecimiento (configurable)
    ptoEmi: '001', // Punto de emisión (configurable)
    secuencial: secuencial,
    dirMatriz: configuracion.direccion,
    fechaEmision: fechaEmision,
    dirEstablecimiento: configuracion.direccion,
    contribuyenteEspecial: 'NO',
    obligadoContabilidad: 'SI',
    tipoIdentificacionComprador: cliente.ruc.length === 13 ? '04' : '05', // 04=RUC, 05=Cédula
    cliente: cliente,
    totalSinImpuestos: totalSinImpuestos,
    totalDescuento: totalDescuento,
    totalConImpuestos: [
      {
        codigo: '2', // Código para IVA
        codigoPorcentaje: parseFloat(configuracion.impuestoIVA || '12').toString(), // Usar directamente el valor de la configuración
        baseImponible: totalSinImpuestos,
        valor: totalIVA
      }
    ],
    propina: 0,
    importeTotal: importeTotal,
    moneda: 'DOLAR',
    pagos: [
      {
        formaPago: '01', // Efectivo
        total: importeTotal
      }
    ],
    detalles: detalles,
    infoAdicional: {
      'Origen': 'Loyverse',
      'ID Loyverse': receipt.receipt_number
    },
    estado: 'PENDIENTE'
  };
}
