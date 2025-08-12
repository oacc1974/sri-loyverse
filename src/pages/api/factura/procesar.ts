import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../../lib/mongodb';
import { FacturaModel } from '../../../models/facturaModel';
import { ConfiguracionModel } from '../../../models/configuracionModel';
import axios from 'axios';

// Importar servicios necesarios para firma y envío al SRI
// Asumiendo que estos servicios ya existen en tu proyecto
import { generarXML } from '../../../services/xmlService';
import { firmarXML } from '../../../services/firmaService';
import { enviarSRI, verificarAutorizacion } from '../../../services/sriService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Solo permitir método POST
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    // Conectar a la base de datos
    await connectToDatabase();
    
    // Obtener ID de factura y acción a realizar
    const { facturaId, accion } = req.body;
    
    if (!facturaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere el ID de la factura' 
      });
    }
    
    // Obtener la factura de la base de datos
    const factura = await FacturaModel.findById(facturaId);
    
    if (!factura) {
      return res.status(404).json({ 
        success: false, 
        message: 'Factura no encontrada' 
      });
    }
    
    // Obtener la configuración activa o usar los parámetros enviados
    let configuracion = await ConfiguracionModel.findOne({
      ambiente: factura.ambiente
    }).sort({ createdAt: -1 });
    
    // Si no hay configuración, usar los parámetros enviados desde el frontend
    if (!configuracion && req.body.certificadoBase64 && req.body.claveCertificado) {
      // Crear una configuración temporal con los datos enviados
      configuracion = {
        certificadoBase64: req.body.certificadoBase64,
        claveCertificado: req.body.claveCertificado,
        ambiente: factura.ambiente,
        // Valores predeterminados para otros campos requeridos
        ruc: req.body.ruc || '9999999999999',
        razonSocial: req.body.razonSocial || 'EMPRESA DE PRUEBA',
        nombreComercial: req.body.nombreComercial || 'EMPRESA DE PRUEBA',
        direccion: req.body.direccion || 'DIRECCIÓN DE PRUEBA',
        email: req.body.email || 'prueba@ejemplo.com'
      };
    } else if (!configuracion) {
      return res.status(404).json({ 
        success: false, 
        message: `No se encontró configuración para el ambiente ${factura.ambiente}. Envía certificado y clave en la solicitud.` 
      });
    }
    
    // Verificar que exista el certificado
    if (!configuracion.certificadoBase64 || !configuracion.claveCertificado) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha configurado el certificado digital o su clave' 
      });
    }
    
    // Procesar según la acción solicitada
    switch (accion) {
      case 'firmar':
        return await firmarDocumento(res, factura, configuracion);
      case 'enviar':
        return await enviarDocumento(res, factura, configuracion);
      case 'autorizar':
        return await autorizarDocumento(res, factura, configuracion);
      case 'proceso_completo':
        return await procesoCompleto(res, factura, configuracion);
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Acción no válida. Opciones: firmar, enviar, autorizar, proceso_completo' 
        });
    }
  } catch (error: any) {
    console.error('Error al procesar factura:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error en el servidor: ${error.message}`,
      error: error.toString()
    });
  }
}

// Firmar el documento XML
async function firmarDocumento(res: NextApiResponse, factura: any, configuracion: any) {
  try {
    // Generar XML si no existe
    if (!factura.xmlFirmado) {
      // Generar XML a partir de los datos de la factura
      const xmlSinFirma = await generarXML(factura);
      
      // Guardar el XML sin firmar para referencia (útil para diagnóstico)
      factura.xmlSinFirma = xmlSinFirma;
      
      // Firmar el XML
      const xmlFirmado = await firmarXML(
        xmlSinFirma, 
        configuracion.certificadoBase64, 
        configuracion.claveCertificado
      );
      
      // Actualizar la factura con el XML firmado
      factura.xmlFirmado = xmlFirmado;
      factura.estado = 'FIRMADO';
      await factura.save();
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Documento firmado exitosamente',
      data: {
        facturaId: factura._id,
        estado: factura.estado,
        xmlFirmado: factura.xmlFirmado?.substring(0, 500) + '...' // Mostrar solo una parte del XML
      }
    });
  } catch (error: any) {
    console.error('Error al firmar documento:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error al firmar documento: ${error.message}`,
      error: error.toString()
    });
  }
}

// Enviar el documento al SRI
async function enviarDocumento(res: NextApiResponse, factura: any, configuracion: any) {
  try {
    // Verificar que el documento esté firmado
    if (!factura.xmlFirmado) {
      return res.status(400).json({ 
        success: false, 
        message: 'El documento debe estar firmado antes de enviarlo al SRI' 
      });
    }
    
    // Enviar al SRI
    const respuestaSRI = await enviarSRI(factura.xmlFirmado);
    
    // Actualizar la factura con la respuesta del SRI
    factura.respuestaSRI = respuestaSRI;
    factura.estado = respuestaSRI.estado || 'ENVIADO';
    await factura.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Documento enviado al SRI exitosamente',
      data: {
        facturaId: factura._id,
        estado: factura.estado,
        respuestaSRI
      }
    });
  } catch (error: any) {
    console.error('Error al enviar documento al SRI:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error al enviar documento al SRI: ${error.message}`,
      error: error.toString()
    });
  }
}

// Verificar autorización del documento en el SRI
async function autorizarDocumento(res: NextApiResponse, factura: any, configuracion: any) {
  try {
    // Verificar que el documento haya sido enviado
    if (!factura.respuestaSRI || factura.estado !== 'ENVIADO') {
      return res.status(400).json({ 
        success: false, 
        message: 'El documento debe estar enviado al SRI antes de verificar su autorización' 
      });
    }
    
    // Verificar autorización en el SRI
    const respuestaAutorizacion = await verificarAutorizacion(factura.claveAcceso);
    
    // Actualizar la factura con la respuesta de autorización
    factura.numeroAutorizacion = respuestaAutorizacion.numeroAutorizacion;
    factura.fechaAutorizacion = respuestaAutorizacion.fechaAutorizacion;
    factura.estado = respuestaAutorizacion.estado || factura.estado;
    await factura.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Verificación de autorización completada',
      data: {
        facturaId: factura._id,
        estado: factura.estado,
        numeroAutorizacion: factura.numeroAutorizacion,
        fechaAutorizacion: factura.fechaAutorizacion,
        respuestaAutorizacion
      }
    });
  } catch (error: any) {
    console.error('Error al verificar autorización:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error al verificar autorización: ${error.message}`,
      error: error.toString()
    });
  }
}

// Proceso completo: firmar, enviar y autorizar
async function procesoCompleto(res: NextApiResponse, factura: any, configuracion: any) {
  try {
    // 1. Firmar
    if (!factura.xmlFirmado) {
      const xmlSinFirma = await generarXML(factura);
      // Guardar el XML sin firmar para referencia (útil para diagnóstico)
      factura.xmlSinFirma = xmlSinFirma;
      factura.xmlFirmado = await firmarXML(
        xmlSinFirma, 
        configuracion.certificadoBase64, 
        configuracion.claveCertificado
      );
      factura.estado = 'FIRMADO';
      await factura.save();
    }
    
    // 2. Enviar
    const respuestaSRI = await enviarSRI(factura.xmlFirmado);
    factura.respuestaSRI = respuestaSRI;
    factura.estado = respuestaSRI.estado || 'ENVIADO';
    await factura.save();
    
    // 3. Autorizar (verificar)
    const respuestaAutorizacion = await verificarAutorizacion(factura.claveAcceso);
    
    factura.numeroAutorizacion = respuestaAutorizacion.numeroAutorizacion;
    factura.fechaAutorizacion = respuestaAutorizacion.fechaAutorizacion;
    factura.estado = respuestaAutorizacion.estado || factura.estado;
    await factura.save();
    
    // Preparar la respuesta con datos básicos
    const responseData: any = {
      facturaId: factura._id,
      estado: factura.estado,
      numeroAutorizacion: factura.numeroAutorizacion,
      fechaAutorizacion: factura.fechaAutorizacion,
      respuestaSRI: factura.respuestaSRI
    };
    
    // Si la factura fue rechazada, incluir los XMLs para diagnóstico
    if (factura.estado === 'RECHAZADA') {
      responseData.xmlFirmado = factura.xmlFirmado;
      responseData.xmlSinFirma = factura.xmlSinFirma;
      responseData.mensajeError = factura.mensajeError || 'Factura rechazada por el SRI';
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Proceso completo ejecutado exitosamente',
      data: responseData
    });
  } catch (error: any) {
    console.error('Error en proceso completo:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error en proceso completo: ${error.message}`,
      error: error.toString()
    });
  }
}
