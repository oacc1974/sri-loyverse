import axios from 'axios';
import { Factura } from '../models/factura';

interface SRIResponse {
  estado: string;
  comprobantes?: {
    comprobante: {
      claveAcceso: string;
      mensajes?: {
        mensaje: {
          identificador: string;
          mensaje: string;
          informacionAdicional?: string;
          tipo: string;
        } | Array<{
          identificador: string;
          mensaje: string;
          informacionAdicional?: string;
          tipo: string;
        }>
      }
    }
  };
  mensajes?: {
    mensaje: {
      identificador: string;
      mensaje: string;
      informacionAdicional?: string;
      tipo: string;
    } | Array<{
      identificador: string;
      mensaje: string;
      informacionAdicional?: string;
      tipo: string;
    }>
  };
}

export class SRIService {
  private recepcionUrl: string;
  private autorizacionUrl: string;
  private ambiente: '1' | '2'; // 1=Pruebas, 2=Producción

  constructor(ambiente: '1' | '2') {
    this.ambiente = ambiente;
    
    if (ambiente === '1') {
      // URLs de ambiente de pruebas
      this.recepcionUrl = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
      this.autorizacionUrl = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
    } else {
      // URLs de ambiente de producción
      this.recepcionUrl = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
      this.autorizacionUrl = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
    }
  }

  /**
   * Envía un XML firmado al servicio de recepción del SRI
   * @param xmlFirmado XML firmado en formato string
   * @returns Respuesta del SRI
   */
  async enviarComprobante(xmlFirmado: string): Promise<SRIResponse> {
    try {
      // Convertir XML a base64
      const xmlBase64 = Buffer.from(xmlFirmado).toString('base64');
      
      // Crear el envelope SOAP
      const soapEnvelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
          <soapenv:Header/>
          <soapenv:Body>
            <ec:validarComprobante>
              <xml>${xmlBase64}</xml>
            </ec:validarComprobante>
          </soapenv:Body>
        </soapenv:Envelope>
      `;
      
      // Enviar la petición SOAP
      const response = await axios.post(this.recepcionUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': ''
        }
      });
      
      // Procesar la respuesta
      const responseData = response.data;
      
      // Extraer la respuesta del envelope SOAP
      // Nota: Esto es una simplificación, en un caso real se debería usar un parser XML
      const estadoMatch = responseData.match(/<estado>(.*?)<\/estado>/);
      const estado = estadoMatch ? estadoMatch[1] : 'DESCONOCIDO';
      
      // Construir objeto de respuesta
      const sriResponse: SRIResponse = {
        estado
      };
      
      // Si hay mensajes, extraerlos
      const mensajesMatch = responseData.match(/<mensajes>(.*?)<\/mensajes>/s);
      if (mensajesMatch) {
        // Extraer mensajes (simplificado)
        const identificadorMatch = responseData.match(/<identificador>(.*?)<\/identificador>/);
        const mensajeMatch = responseData.match(/<mensaje>(.*?)<\/mensaje>/);
        const infoAdicionalMatch = responseData.match(/<informacionAdicional>(.*?)<\/informacionAdicional>/);
        const tipoMatch = responseData.match(/<tipo>(.*?)<\/tipo>/);
        
        if (identificadorMatch && mensajeMatch && tipoMatch) {
          sriResponse.mensajes = {
            mensaje: {
              identificador: identificadorMatch[1],
              mensaje: mensajeMatch[1],
              informacionAdicional: infoAdicionalMatch ? infoAdicionalMatch[1] : undefined,
              tipo: tipoMatch[1]
            }
          };
        }
      }
      
      return sriResponse;
    } catch (error) {
      console.error('Error al enviar comprobante al SRI:', error);
      throw new Error('Error al enviar comprobante al SRI');
    }
  }

  /**
   * Consulta el estado de autorización de un comprobante en el SRI
   * @param claveAcceso Clave de acceso del comprobante
   * @returns Respuesta del SRI
   */
  async consultarAutorizacion(claveAcceso: string): Promise<SRIResponse> {
    try {
      // Crear el envelope SOAP
      const soapEnvelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
          <soapenv:Header/>
          <soapenv:Body>
            <ec:autorizacionComprobante>
              <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
            </ec:autorizacionComprobante>
          </soapenv:Body>
        </soapenv:Envelope>
      `;
      
      // Enviar la petición SOAP
      const response = await axios.post(this.autorizacionUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': ''
        }
      });
      
      // Procesar la respuesta
      const responseData = response.data;
      
      // Extraer la respuesta del envelope SOAP
      // Nota: Esto es una simplificación, en un caso real se debería usar un parser XML
      const estadoMatch = responseData.match(/<estado>(.*?)<\/estado>/);
      const estado = estadoMatch ? estadoMatch[1] : 'DESCONOCIDO';
      
      // Construir objeto de respuesta
      const sriResponse: SRIResponse = {
        estado
      };
      
      // Si hay comprobantes, extraerlos
      const comprobantesMatch = responseData.match(/<comprobantes>(.*?)<\/comprobantes>/s);
      if (comprobantesMatch) {
        // Extraer información del comprobante (simplificado)
        const claveAccesoMatch = responseData.match(/<claveAcceso>(.*?)<\/claveAcceso>/);
        
        if (claveAccesoMatch) {
          sriResponse.comprobantes = {
            comprobante: {
              claveAcceso: claveAccesoMatch[1]
            }
          };
          
          // Si hay mensajes, extraerlos
          const mensajesMatch = responseData.match(/<mensajes>(.*?)<\/mensajes>/s);
          if (mensajesMatch) {
            // Extraer mensajes (simplificado)
            const identificadorMatch = responseData.match(/<identificador>(.*?)<\/identificador>/);
            const mensajeMatch = responseData.match(/<mensaje>(.*?)<\/mensaje>/);
            const infoAdicionalMatch = responseData.match(/<informacionAdicional>(.*?)<\/informacionAdicional>/);
            const tipoMatch = responseData.match(/<tipo>(.*?)<\/tipo>/);
            
            if (identificadorMatch && mensajeMatch && tipoMatch) {
              sriResponse.comprobantes.comprobante.mensajes = {
                mensaje: {
                  identificador: identificadorMatch[1],
                  mensaje: mensajeMatch[1],
                  informacionAdicional: infoAdicionalMatch ? infoAdicionalMatch[1] : undefined,
                  tipo: tipoMatch[1]
                }
              };
            }
          }
        }
      }
      
      return sriResponse;
    } catch (error) {
      console.error('Error al consultar autorización en el SRI:', error);
      throw new Error('Error al consultar autorización en el SRI');
    }
  }

  /**
   * Procesa una factura completa: envía al SRI y consulta su autorización
   * @param factura Factura a procesar
   * @param xmlFirmado XML firmado de la factura
   * @returns Factura actualizada con el estado del SRI
   */
  async procesarFactura(factura: Factura, xmlFirmado: string): Promise<Factura> {
    try {
      // Enviar comprobante al SRI
      const recepcionResponse = await this.enviarComprobante(xmlFirmado);
      
      // Si la recepción fue exitosa, consultar autorización
      if (recepcionResponse.estado === 'RECIBIDA') {
        // Esperar un momento antes de consultar la autorización
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Consultar autorización
        const autorizacionResponse = await this.consultarAutorizacion(factura.claveAcceso!);
        
        // Actualizar estado de la factura según la respuesta
        if (autorizacionResponse.estado === 'AUTORIZADO') {
          factura.estado = 'Aceptada';
        } else {
          factura.estado = 'Rechazada';
          
          // Extraer mensaje de error si existe
          if (autorizacionResponse.comprobantes?.comprobante.mensajes) {
            const mensaje = autorizacionResponse.comprobantes.comprobante.mensajes.mensaje;
            if (Array.isArray(mensaje)) {
              factura.mensajeError = mensaje.map(m => `${m.identificador}: ${m.mensaje}`).join('; ');
            } else {
              factura.mensajeError = `${mensaje.identificador}: ${mensaje.mensaje}`;
            }
          }
        }
      } else {
        factura.estado = 'Rechazada';
        
        // Extraer mensaje de error si existe
        if (recepcionResponse.mensajes) {
          const mensaje = recepcionResponse.mensajes.mensaje;
          if (Array.isArray(mensaje)) {
            factura.mensajeError = mensaje.map(m => `${m.identificador}: ${m.mensaje}`).join('; ');
          } else {
            factura.mensajeError = `${mensaje.identificador}: ${mensaje.mensaje}`;
          }
        }
      }
      
      // Guardar XML firmado
      factura.xmlFirmado = xmlFirmado;
      
      return factura;
    } catch (error) {
      console.error('Error al procesar factura en el SRI:', error);
      
      // Actualizar estado de la factura
      factura.estado = 'Rechazada';
      factura.mensajeError = `Error de comunicación con el SRI: ${(error as Error).message}`;
      
      return factura;
    }
  }
}
