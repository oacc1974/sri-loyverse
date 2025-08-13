import axios, { AxiosError } from 'axios';
import { Factura } from '../models/factura';

// Extender la interfaz Factura para incluir _id para MongoDB
declare module '../models/factura' {
  interface Factura {
    _id?: string;
  }
}

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
  error?: {
    codigo: string;
    mensaje: string;
    detalles: string;
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
      this.recepcionUrl = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline';
      this.autorizacionUrl = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline';
    } else {
      // URLs de ambiente de producción
      this.recepcionUrl = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline';
      this.autorizacionUrl = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline';
    }
  }

  /**
   * Envía un XML firmado al servicio de recepción del SRI
   * @param xmlFirmado XML firmado en formato string
   * @returns Respuesta del SRI
   */
  async enviarComprobante(xmlFirmado: string): Promise<SRIResponse> {
    try {
      console.log(`[SRI-DEBUG] Iniciando envío de comprobante al SRI - Ambiente: ${this.ambiente}`);
      console.log(`[SRI-DEBUG] URL de recepción: ${this.recepcionUrl}`);
      
      // Convertir XML a base64
      const xmlBase64 = Buffer.from(xmlFirmado).toString('base64');
      console.log(`[SRI-DEBUG] XML convertido a base64 (primeros 100 caracteres): ${xmlBase64.substring(0, 100)}...`);
      
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
      
      console.log(`[SRI-DEBUG] Enviando petición SOAP al SRI - Timestamp: ${new Date().toISOString()}`);
      
      // Configurar timeout más largo para evitar ECONNRESET
      const axiosConfig = {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': ''
        },
        timeout: 60000 // 60 segundos de timeout para dar más tiempo al SRI
      };
      
      // Enviar la petición SOAP
      console.log(`[SRI-DEBUG] Configuración de la petición:`, axiosConfig);
      const response = await axios.post(this.recepcionUrl, soapEnvelope, axiosConfig);
      
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
      const mensajesMatch = responseData.match(/<mensajes>([^]*?)<\/mensajes>/);
      if (mensajesMatch) {
        // Extraer mensajes (simplificado)
        const identificadorMatch = responseData.match(/<identificador>([^]*?)<\/identificador>/);
        const mensajeMatch = responseData.match(/<mensaje>([^]*?)<\/mensaje>/);
        const infoAdicionalMatch = responseData.match(/<informacionAdicional>([^]*?)<\/informacionAdicional>/);
        const tipoMatch = responseData.match(/<tipo>([^]*?)<\/tipo>/);
        
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
      const axiosError = error as AxiosError;
      console.error('[SRI-ERROR] Error al enviar comprobante al SRI:', axiosError);
      
      // Logs detallados del error para diagnóstico
      if (axiosError.response) {
        // La solicitud fue realizada y el servidor respondió con un código de estado
        // que cae fuera del rango 2xx
        console.error('[SRI-ERROR] Datos de respuesta de error:', axiosError.response.data);
        console.error('[SRI-ERROR] Código de estado:', axiosError.response.status);
        console.error('[SRI-ERROR] Cabeceras de respuesta:', axiosError.response.headers);
      } else if (axiosError.request) {
        // La solicitud fue realizada pero no se recibió respuesta
        console.error('[SRI-ERROR] Solicitud sin respuesta:', axiosError.request);
        
        // Información adicional para errores de conexión
        if (axiosError.code === 'ECONNRESET') {
          console.error('[SRI-ERROR] Conexión reiniciada (ECONNRESET). Posibles causas:');
          console.error('  - Timeout en la conexión');
          console.error('  - Servidor SRI caído o en mantenimiento');
          console.error('  - Problemas de red entre Render y SRI');
          console.error('  - Firewall o restricciones de red');
        } else if (axiosError.code === 'ETIMEDOUT') {
          console.error('[SRI-ERROR] Timeout en la conexión (ETIMEDOUT)');
        } else if (axiosError.code === 'ENOTFOUND') {
          console.error('[SRI-ERROR] Host no encontrado (ENOTFOUND)');
        }
      } else {
        // Algo sucedió al configurar la solicitud que desencadenó un error
        console.error('[SRI-ERROR] Error de configuración:', axiosError.message);
      }
      
      // Incluir stack trace para depuración
      console.error('[SRI-ERROR] Stack trace:', axiosError.stack);
      
      throw new Error(`Error al enviar comprobante al SRI: ${axiosError.message || 'Error desconocido'}`);
    }
  }

  /**
   * Consulta el estado de autorización de un comprobante en el SRI
   * @param claveAcceso Clave de acceso del comprobante
   * @returns Respuesta del SRI
   */
  async consultarAutorizacion(claveAcceso: string): Promise<SRIResponse> {
    try {
      console.log(`[SRI-DEBUG] ====== INICIO CONSULTA DE AUTORIZACIÓN ======`);
      console.log(`[SRI-DEBUG] Clave de acceso: ${claveAcceso}`);
      console.log(`[SRI-DEBUG] Longitud de la clave: ${claveAcceso.length} caracteres`);
      console.log(`[SRI-DEBUG] Dígito verificador: ${claveAcceso.substring(48)}`);
      console.log(`[SRI-DEBUG] URL de autorización: ${this.autorizacionUrl}`);
      console.log(`[SRI-DEBUG] Ambiente: ${this.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}`);
      
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
      
      console.log(`[SRI-DEBUG] Enviando petición de autorización - Timestamp: ${new Date().toISOString()}`);
      
      // Configurar timeout más largo para evitar ECONNRESET
      const axiosConfig = {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': ''
        },
        timeout: 60000 // 60 segundos de timeout para dar más tiempo al SRI
      };
      
      console.log(`[SRI-DEBUG] Configuración de la solicitud:`, JSON.stringify(axiosConfig));
      
      // Enviar la petición SOAP
      console.log(`[SRI-DEBUG] Enviando solicitud SOAP al SRI...`);
      const startTime = Date.now();
      const response = await axios.post(this.autorizacionUrl, soapEnvelope, axiosConfig);
      const endTime = Date.now();
      console.log(`[SRI-DEBUG] Respuesta recibida en ${endTime - startTime}ms`);
      
      // Procesar la respuesta
      const responseData = response.data;
      console.log(`[SRI-DEBUG] Respuesta completa del SRI (primeros 500 caracteres): ${responseData.substring(0, 500)}...`);
      
      // Extraer la respuesta del envelope SOAP
      const estadoMatch = responseData.match(/<estado>(.*?)<\/estado>/);
      const estado = estadoMatch ? estadoMatch[1] : 'DESCONOCIDO';
      console.log(`[SRI-DEBUG] Estado de la autorización: ${estado}`);
      
      // Construir objeto de respuesta
      const sriResponse: SRIResponse = {
        estado
      };
      
      // Si hay comprobantes, extraerlos
      const comprobantesMatch = responseData.match(/<comprobantes>([^]*?)<\/comprobantes>/);
      if (comprobantesMatch) {
        console.log(`[SRI-DEBUG] Se encontraron comprobantes en la respuesta`);
        
        // Extraer información del comprobante
        const claveAccesoMatch = responseData.match(/<claveAcceso>([^]*?)<\/claveAcceso>/);
        
        if (claveAccesoMatch) {
          console.log(`[SRI-DEBUG] Clave de acceso en respuesta: ${claveAccesoMatch[1]}`);
          sriResponse.comprobantes = {
            comprobante: {
              claveAcceso: claveAccesoMatch[1]
            }
          };
          
          // Si hay mensajes, extraerlos
          const mensajesMatch = responseData.match(/<mensajes>([^]*?)<\/mensajes>/);
          if (mensajesMatch) {
            console.log(`[SRI-DEBUG] Se encontraron mensajes en la respuesta`);
            
            // Extraer mensajes
            const identificadorMatch = responseData.match(/<identificador>([^]*?)<\/identificador>/);
            const mensajeMatch = responseData.match(/<mensaje>([^]*?)<\/mensaje>/);
            const infoAdicionalMatch = responseData.match(/<informacionAdicional>([^]*?)<\/informacionAdicional>/);
            const tipoMatch = responseData.match(/<tipo>([^]*?)<\/tipo>/);
            
            if (identificadorMatch) console.log(`[SRI-DEBUG] Identificador: ${identificadorMatch[1]}`);
            if (mensajeMatch) console.log(`[SRI-DEBUG] Mensaje: ${mensajeMatch[1]}`);
            if (infoAdicionalMatch) console.log(`[SRI-DEBUG] Información adicional: ${infoAdicionalMatch[1]}`);
            if (tipoMatch) console.log(`[SRI-DEBUG] Tipo: ${tipoMatch[1]}`);
            
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
          } else {
            console.log(`[SRI-DEBUG] No se encontraron mensajes en la respuesta`);
          }
        } else {
          console.log(`[SRI-DEBUG] No se encontró clave de acceso en la respuesta`);
        }
      } else {
        console.log(`[SRI-DEBUG] No se encontraron comprobantes en la respuesta`);
      }
      
      console.log(`[SRI-DEBUG] Respuesta final procesada:`, JSON.stringify(sriResponse, null, 2));
      console.log(`[SRI-DEBUG] ====== FIN CONSULTA DE AUTORIZACIÓN ======`);
      
      return sriResponse;
    } catch (error) {
      console.error(`[SRI-ERROR] ====== ERROR EN CONSULTA DE AUTORIZACIÓN ======`);
      const axiosError = error as AxiosError;
      console.error(`[SRI-ERROR] Mensaje de error: ${axiosError.message}`);
      console.error(`[SRI-ERROR] Código de error: ${axiosError.code}`);
      console.error(`[SRI-ERROR] Stack trace: ${axiosError.stack}`);
      
      // Logs detallados del error para diagnóstico
      if (axiosError.response) {
        console.error(`[SRI-ERROR] Código de estado HTTP: ${axiosError.response.status}`);
        console.error(`[SRI-ERROR] Headers de respuesta: ${JSON.stringify(axiosError.response.headers)}`);
        console.error(`[SRI-ERROR] Datos de respuesta: ${JSON.stringify(axiosError.response.data).substring(0, 1000)}...`);
      } else if (axiosError.request) {
        console.error(`[SRI-ERROR] No se recibió respuesta del servidor`);
        console.error(`[SRI-ERROR] Detalles de la solicitud: ${JSON.stringify(axiosError.request).substring(0, 500)}...`);
        
        // Información adicional para errores de conexión
        if (axiosError.code === 'ECONNRESET') {
          console.error(`[SRI-ERROR] CONEXIÓN REINICIADA (ECONNRESET) - Esto puede indicar un timeout o problema de red con el SRI`);
          console.error(`[SRI-ERROR] La clave de acceso utilizada fue: ${claveAcceso}`);
        } else if (axiosError.code === 'ETIMEDOUT') {
          console.error(`[SRI-ERROR] TIMEOUT EN LA CONEXIÓN - El servidor del SRI tardó demasiado en responder`);
        } else if (axiosError.code === 'ENOTFOUND') {
          console.error(`[SRI-ERROR] SERVIDOR NO ENCONTRADO - Verifique la URL y la conectividad a internet`);
        }
      } else {
        console.error(`[SRI-ERROR] Error en la configuración de la solicitud`);
      }
      
      console.error(`[SRI-ERROR] ====== FIN ERROR EN CONSULTA DE AUTORIZACIÓN ======`);
      
      // Crear una respuesta de error para devolver
      return {
        estado: 'ERROR',
        error: {
          codigo: axiosError.code || 'UNKNOWN',
          mensaje: axiosError.message,
          detalles: `Error al consultar autorización: ${axiosError.message}`
        }
      };
    }
      } else {
        console.error('[SRI-ERROR] Error de configuración en consulta de autorización:', axiosError.message);
      }
      
      // Incluir stack trace para depuración
      console.error('[SRI-ERROR] Stack trace:', axiosError.stack);
      
      throw new Error(`Error al consultar autorización en el SRI: ${axiosError.message || 'Error desconocido'}`);
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
      console.log(`[SRI-DEBUG] Iniciando procesamiento de factura - ID: ${factura._id}, Clave de acceso: ${factura.claveAcceso || 'No disponible'}`);
      console.log(`[SRI-DEBUG] Enviando comprobante al SRI - Timestamp: ${new Date().toISOString()}`);
      // Enviar comprobante al SRI
      const recepcionResponse = await this.enviarComprobante(xmlFirmado);
      console.log(`[SRI-DEBUG] Respuesta de recepción recibida - Estado: ${recepcionResponse.estado}`);
      
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
      const err = error as Error;
      console.error('[SRI-ERROR] Error al procesar factura en el SRI:', err);
      
      // Logs detallados para diagnóstico
      console.error(`[SRI-ERROR] Detalles de la factura con error - ID: ${factura._id || factura.id}, Clave: ${factura.claveAcceso || 'No disponible'}`);
      
      if (err.message && err.message.includes('ECONNRESET')) {
        console.error('[SRI-ERROR] Detectado error ECONNRESET durante el procesamiento de la factura');
        console.error('[SRI-ERROR] Recomendación: Verificar estado del servicio SRI y reintentar más tarde');
        console.error('[SRI-ERROR] Posibles causas:');
        console.error('  - Timeout en la conexión (el servicio SRI tarda demasiado en responder)');
        console.error('  - Servidor SRI caído o en mantenimiento');
        console.error('  - Problemas de red entre Render y SRI');
        console.error('  - Firewall o restricciones de red');
      }
      
      // Actualizar estado de la factura
      factura.estado = 'Rechazada';
      factura.mensajeError = `Error de comunicación con el SRI: ${err.message}`;
      
      return factura;
    }
  }
}

// Instancia del servicio SRI para uso externo
// Usar ambiente de pruebas ('1') por defecto
const sriService = new SRIService('1');

/**
 * Envía un XML firmado al servicio de recepción del SRI
 * @param xmlFirmado XML firmado en formato string
 * @returns Respuesta del SRI
 */
export async function enviarSRI(xmlFirmado: string): Promise<any> {
  return await sriService.enviarComprobante(xmlFirmado);
}

/**
 * Consulta el estado de autorización de un comprobante en el SRI
 * @param claveAcceso Clave de acceso del comprobante
 * @returns Respuesta del SRI
 */
export async function verificarAutorizacion(claveAcceso: string): Promise<any> {
  return await sriService.consultarAutorizacion(claveAcceso);
}
