import cron from 'node-cron';
import { LoyverseService } from './loyverseService';
import { XMLService } from './xmlService';
import { SRIService } from './sriService';
import { Configuracion } from '../models/configuracion';
import { Factura } from '../models/factura';

export class AutomatizacionService {
  private loyverseService: LoyverseService;
  private xmlService: XMLService;
  private sriService: SRIService;
  private configuracion: Configuracion;
  private cronJob: cron.ScheduledTask | null = null;
  private isProcessing: boolean = false;
  private lastProcessedDate: Date | null = null;

  constructor(configuracion: Configuracion) {
    this.configuracion = configuracion;
    this.loyverseService = new LoyverseService(configuracion.loyverseToken);
    this.xmlService = new XMLService();
    this.sriService = new SRIService(configuracion.ambiente === 'pruebas' ? '1' : '2');
  }

  /**
   * Inicia el proceso de automatización según la configuración
   */
  iniciarAutomatizacion(): void {
    // Detener trabajo anterior si existe
    this.detenerAutomatizacion();

    // Si la automatización está habilitada, programar el trabajo
    if (this.configuracion.automatizacion) {
      // Determinar la expresión cron según el intervalo configurado
      let cronExpression = '';
      switch (this.configuracion.intervaloMinutos) {
        case '15':
          cronExpression = '*/15 * * * *'; // Cada 15 minutos
          break;
        case '30':
          cronExpression = '*/30 * * * *'; // Cada 30 minutos
          break;
        case '60':
          cronExpression = '0 * * * *'; // Cada hora
          break;
        default:
          cronExpression = '*/15 * * * *'; // Por defecto, cada 15 minutos
      }

      // Programar el trabajo
      this.cronJob = cron.schedule(cronExpression, () => {
        this.procesarFacturas().catch(error => {
          console.error('Error en el proceso automático de facturación:', error);
        });
      });

      console.log(`Automatización iniciada con intervalo de ${this.configuracion.intervaloMinutos} minutos`);
    } else {
      console.log('Automatización deshabilitada');
    }
  }

  /**
   * Detiene el proceso de automatización
   */
  detenerAutomatizacion(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Automatización detenida');
    }
  }

  /**
   * Actualiza la configuración de automatización
   * @param configuracion Nueva configuración
   */
  actualizarConfiguracion(configuracion: Configuracion): void {
    this.configuracion = configuracion;
    
    // Actualizar servicios con la nueva configuración
    this.loyverseService = new LoyverseService(configuracion.loyverseToken);
    this.sriService = new SRIService(configuracion.ambiente === 'pruebas' ? '1' : '2');
    
    // Reiniciar la automatización con la nueva configuración
    this.iniciarAutomatizacion();
  }

  /**
   * Procesa las facturas pendientes de Loyverse
   */
  async procesarFacturas(): Promise<void> {
    // Evitar ejecuciones simultáneas
    if (this.isProcessing) {
      console.log('Ya hay un proceso de facturación en ejecución');
      return;
    }

    this.isProcessing = true;

    try {
      console.log('Iniciando proceso automático de facturación');

      // Determinar fecha desde la cual obtener facturas
      const fechaDesde = this.lastProcessedDate 
        ? this.lastProcessedDate.toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Último día si no hay fecha anterior

      console.log(`Obteniendo facturas desde ${fechaDesde}`);

      // Obtener facturas de Loyverse
      const { receipts } = await this.loyverseService.getReceipts(fechaDesde);
      
      console.log(`Se encontraron ${receipts.length} facturas para procesar`);

      // Procesar cada factura
      const facturasProcesadas: Factura[] = [];
      
      for (const receipt of receipts) {
        try {
          // Convertir factura de Loyverse al formato SRI
          const facturaData = this.loyverseService.mapToSRIFactura(receipt);
          
          // Completar datos de la factura con la configuración
          const factura: Factura = {
            ...facturaData as Factura,
            ambiente: this.configuracion.ambiente === 'pruebas' ? '1' : '2',
            razonSocial: this.configuracion.razonSocial,
            nombreComercial: this.configuracion.nombreComercial,
            ruc: this.configuracion.ruc,
            dirMatriz: this.configuracion.direccion,
            dirEstablecimiento: this.configuracion.direccion
          };
          
          // Generar clave de acceso si no existe
          if (!factura.claveAcceso) {
            factura.claveAcceso = this.xmlService.generateClaveAcceso(factura);
          }
          
          // Generar XML
          const xml = this.xmlService.generateXML(factura);
          
          // Verificar si hay certificado para firmar
          if (this.configuracion.certificadoBase64 && this.configuracion.claveCertificado) {
            // Firmar XML
            const xmlFirmado = await this.xmlService.signXML(
              xml, 
              this.configuracion.certificadoBase64, 
              this.configuracion.claveCertificado
            );
            
            // Procesar factura en el SRI
            const facturaActualizada = await this.sriService.procesarFactura(factura, xmlFirmado);
            
            // Guardar factura procesada
            facturasProcesadas.push(facturaActualizada);
            
            console.log(`Factura ${factura.secuencial} procesada con estado: ${facturaActualizada.estado}`);
          } else {
            console.warn('No se puede firmar la factura: falta certificado o clave');
            
            // Marcar factura como pendiente
            factura.estado = 'Pendiente';
            factura.mensajeError = 'No se ha configurado el certificado digital';
            
            facturasProcesadas.push(factura);
          }
        } catch (error) {
          console.error(`Error al procesar factura ${receipt.id}:`, error);
        }
      }

      // Actualizar fecha del último procesamiento
      this.lastProcessedDate = new Date();

      console.log(`Proceso automático de facturación completado. ${facturasProcesadas.length} facturas procesadas`);

      // Aquí se implementaría la lógica para guardar las facturas procesadas en la base de datos
      // ...

    } catch (error) {
      console.error('Error en el proceso automático de facturación:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Ejecuta el proceso de facturación manualmente
   */
  async ejecutarProcesoManual(): Promise<Factura[]> {
    // Evitar ejecuciones simultáneas
    if (this.isProcessing) {
      throw new Error('Ya hay un proceso de facturación en ejecución');
    }

    this.isProcessing = true;
    
    try {
      // Obtener facturas del último día
      const fechaDesde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Obtener facturas de Loyverse
      const { receipts } = await this.loyverseService.getReceipts(fechaDesde);
      
      // Procesar cada factura
      const facturasProcesadas: Factura[] = [];
      
      for (const receipt of receipts) {
        try {
          // Convertir factura de Loyverse al formato SRI
          const facturaData = this.loyverseService.mapToSRIFactura(receipt);
          
          // Completar datos de la factura con la configuración
          const factura: Factura = {
            ...facturaData as Factura,
            ambiente: this.configuracion.ambiente === 'pruebas' ? '1' : '2',
            razonSocial: this.configuracion.razonSocial,
            nombreComercial: this.configuracion.nombreComercial,
            ruc: this.configuracion.ruc,
            dirMatriz: this.configuracion.direccion,
            dirEstablecimiento: this.configuracion.direccion
          };
          
          // Generar clave de acceso si no existe
          if (!factura.claveAcceso) {
            factura.claveAcceso = this.xmlService.generateClaveAcceso(factura);
          }
          
          // Generar XML
          const xml = this.xmlService.generateXML(factura);
          
          // Verificar si hay certificado para firmar
          if (this.configuracion.certificadoBase64 && this.configuracion.claveCertificado) {
            // Firmar XML
            const xmlFirmado = await this.xmlService.signXML(
              xml, 
              this.configuracion.certificadoBase64, 
              this.configuracion.claveCertificado
            );
            
            // Procesar factura en el SRI
            const facturaActualizada = await this.sriService.procesarFactura(factura, xmlFirmado);
            
            // Guardar factura procesada
            facturasProcesadas.push(facturaActualizada);
          } else {
            // Marcar factura como pendiente
            factura.estado = 'Pendiente';
            factura.mensajeError = 'No se ha configurado el certificado digital';
            
            facturasProcesadas.push(factura);
          }
        } catch (error) {
          console.error(`Error al procesar factura ${receipt.id}:`, error);
        }
      }

      // Actualizar fecha del último procesamiento
      this.lastProcessedDate = new Date();

      return facturasProcesadas;
    } finally {
      this.isProcessing = false;
    }
  }
}
