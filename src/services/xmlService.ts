import { Factura } from '../models/factura';
import { js2xml } from 'xml-js';
import { SignedXml } from 'xml-crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class XMLService {
  /**
   * Genera el XML para una factura según el formato del SRI
   * @param factura Datos de la factura
   * @returns XML generado
   */
  generateXML(factura: Factura): string {
    // Crear la estructura del XML
    const xmlObj = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'UTF-8'
        }
      },
      factura: {
        _attributes: {
          id: 'comprobante',
          version: '1.1.0'
        },
        infoTributaria: {
          ambiente: factura.ambiente,
          tipoEmision: factura.tipoEmision,
          razonSocial: factura.razonSocial,
          nombreComercial: factura.nombreComercial,
          ruc: factura.ruc,
          claveAcceso: factura.claveAcceso || this.generateClaveAcceso(factura),
          codDoc: factura.codDoc,
          estab: factura.estab,
          ptoEmi: factura.ptoEmi,
          secuencial: factura.secuencial,
          dirMatriz: factura.dirMatriz
        },
        infoFactura: {
          fechaEmision: factura.fechaEmision,
          dirEstablecimiento: factura.dirEstablecimiento,
          contribuyenteEspecial: factura.contribuyenteEspecial,
          obligadoContabilidad: factura.obligadoContabilidad,
          tipoIdentificacionComprador: factura.tipoIdentificacionComprador,
          razonSocialComprador: factura.cliente.razonSocial,
          identificacionComprador: factura.cliente.ruc,
          totalSinImpuestos: factura.totalSinImpuestos.toFixed(2),
          totalDescuento: factura.totalDescuento.toFixed(2),
          totalConImpuestos: {
            totalImpuesto: factura.totalConImpuestos.map(impuesto => ({
              codigo: impuesto.codigo,
              codigoPorcentaje: impuesto.codigoPorcentaje,
              baseImponible: impuesto.baseImponible.toFixed(2),
              valor: impuesto.valor.toFixed(2)
            }))
          },
          propina: factura.propina.toFixed(2),
          importeTotal: factura.importeTotal.toFixed(2),
          moneda: factura.moneda
        },
        detalles: {
          detalle: factura.detalles.map(detalle => ({
            codigoPrincipal: detalle.codigo,
            descripcion: detalle.descripcion,
            cantidad: detalle.cantidad.toFixed(2),
            precioUnitario: detalle.precioUnitario.toFixed(2),
            descuento: detalle.descuento.toFixed(2),
            precioTotalSinImpuesto: detalle.precioTotalSinImpuesto.toFixed(2),
            impuestos: {
              impuesto: detalle.impuestos.map(impuesto => ({
                codigo: impuesto.codigo,
                codigoPorcentaje: impuesto.codigoPorcentaje,
                tarifa: impuesto.tarifa.toFixed(2),
                baseImponible: impuesto.baseImponible.toFixed(2),
                valor: impuesto.valor.toFixed(2)
              }))
            }
          }))
        }
      }
    };

    // Agregar información adicional si existe
    if (factura.infoAdicional && factura.infoAdicional.length > 0) {
      // Usar asignación con tipo para evitar error de TypeScript
      (xmlObj.factura as any).infoAdicional = {
        campoAdicional: factura.infoAdicional.map(info => ({
          _attributes: {
            nombre: info.nombre
          },
          _text: info.valor
        }))
      };
    }

    // Convertir objeto a XML
    const options = {
      compact: true,
      ignoreComment: true,
      spaces: 2
    };

    return js2xml(xmlObj, options);
  }

  /**
   * Genera la clave de acceso para una factura
   * @param factura Datos de la factura
   * @returns Clave de acceso generada
   */
  generateClaveAcceso(factura: Factura): string {
    // Formato: fechaEmision(ddmmaaaa) + tipoComprobante(2) + ruc(13) + ambiente(1) + 
    // serie(6) + numeroComprobante(9) + codigoNumerico(8) + tipoEmision(1) + digito verificador(1)
    
    console.log('[XML-DEBUG] Generando clave de acceso para factura:', JSON.stringify(factura, null, 2));
    
    // Validar y formatear fecha (soporta formatos dd/mm/yyyy y yyyy-mm-dd)
    let fechaFormato = '';
    if (factura.fechaEmision) {
      if (factura.fechaEmision.includes('/')) {
        // Formato dd/mm/yyyy
        const fechaParts = factura.fechaEmision.split('/');
        if (fechaParts.length === 3) {
          fechaFormato = `${fechaParts[0]}${fechaParts[1]}${fechaParts[2]}`;
        }
      } else if (factura.fechaEmision.includes('-')) {
        // Formato yyyy-mm-dd
        const fechaParts = factura.fechaEmision.split('-');
        if (fechaParts.length === 3) {
          fechaFormato = `${fechaParts[2]}${fechaParts[1]}${fechaParts[0]}`;
        }
      }
    }
    
    // Si no se pudo formatear la fecha, usar la fecha actual
    if (!fechaFormato) {
      const hoy = new Date();
      const dia = hoy.getDate().toString().padStart(2, '0');
      const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
      const anio = hoy.getFullYear().toString();
      fechaFormato = `${dia}${mes}${anio}`;
      console.log('[XML-DEBUG] Usando fecha actual para clave de acceso:', fechaFormato);
    }
    
    // Validar y asignar valores por defecto si es necesario
    const codDoc = factura.codDoc || '01'; // 01 = Factura
    const ruc = factura.ruc || ''; // No hay valor por defecto para RUC, debe estar definido
    const ambiente = factura.ambiente || '1'; // 1 = Pruebas
    const estab = factura.estab || '001'; // Establecimiento por defecto
    const ptoEmi = factura.ptoEmi || '001'; // Punto de emisión por defecto
    
    // Asegurar que secuencial tenga 9 dígitos
    let secuencial = '';
    if (factura.secuencial) {
      // Eliminar caracteres no numéricos
      const secuencialNumerico = factura.secuencial.replace(/\D/g, '');
      secuencial = secuencialNumerico.padStart(9, '0');
    } else {
      secuencial = '000000001'; // Secuencial por defecto
    }
    
    // Código numérico aleatorio de 8 dígitos
    const codigoNumerico = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Tipo de emisión (1 = Normal)
    const tipoEmision = factura.tipoEmision || '1';
    
    // Construir clave sin dígito verificador
    const claveBase = `${fechaFormato}${codDoc}${ruc}${ambiente}${estab}${ptoEmi}${secuencial}${codigoNumerico}${tipoEmision}`;
    
    console.log('[XML-DEBUG] Componentes de la clave de acceso:');
    console.log(`  - Fecha: ${fechaFormato}`);
    console.log(`  - Tipo de comprobante: ${codDoc}`);
    console.log(`  - RUC: ${ruc}`);
    console.log(`  - Ambiente: ${ambiente}`);
    console.log(`  - Establecimiento: ${estab}`);
    console.log(`  - Punto de emisión: ${ptoEmi}`);
    console.log(`  - Secuencial: ${secuencial}`);
    console.log(`  - Código numérico: ${codigoNumerico}`);
    console.log(`  - Tipo de emisión: ${tipoEmision}`);
    console.log(`  - Clave base: ${claveBase}`);
    
    // Verificar que la clave base tenga la longitud correcta (48 caracteres)
    let claveBaseCorregida = claveBase;
    if (claveBase.length !== 48) {
      console.error('[XML-ERROR] La clave base no tiene la longitud correcta:', claveBase.length);
      // Intentar corregir la longitud
      if (claveBase.length < 48) {
        // Si es más corta, rellenar con ceros
        console.log('[XML-DEBUG] Rellenando clave base con ceros');
        claveBaseCorregida = claveBase.padEnd(48, '0');
      } else {
        // Si es más larga, truncar
        console.log('[XML-DEBUG] Truncando clave base');
        claveBaseCorregida = claveBase.substring(0, 48);
      }
      console.log(`  - Clave base corregida: ${claveBaseCorregida}`);
    }
    
    // Calcular dígito verificador (algoritmo módulo 11)
    const digitoVerificador = this.calcularDigitoModulo11(claveBase);
    
    // Retornar clave completa
    const claveCompleta = `${claveBase}${digitoVerificador}`;
    console.log(`[XML-DEBUG] Clave de acceso generada: ${claveCompleta}`);
    
    return claveCompleta;
  }

  /**
   * Calcula el dígito verificador usando el algoritmo módulo 11
   * @param claveBase Clave base sin dígito verificador
   * @returns Dígito verificador
   */
  calcularDigitoModulo11(claveBase: string): string {
    const factores = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5];
    
    let suma = 0;
    for (let i = 0; i < claveBase.length; i++) {
      suma += parseInt(claveBase.charAt(i)) * factores[i];
    }
    
    const modulo = 11;
    const residuo = suma % modulo;
    const resultado = residuo === 0 ? 0 : modulo - residuo;
    
    return resultado.toString();
  }

  /**
   * Firma digitalmente un XML usando un certificado .p12/.pfx
   * @param xml XML a firmar
   * @param certificadoBase64 Certificado en formato Base64
   * @param clave Clave del certificado
   * @returns XML firmado
   */
  async signXML(xml: string, certificadoBase64: string, clave: string): Promise<string> {
    try {
      // Decodificar el certificado Base64
      const certificadoBuffer = Buffer.from(certificadoBase64, 'base64');
      
      // Crear directorio temporal si no existe
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      // Guardar certificado temporalmente
      const certificadoPath = path.join(tempDir, `cert_${Date.now()}.p12`);
      fs.writeFileSync(certificadoPath, certificadoBuffer);
      
      // Configurar la firma XML
      const sig = new SignedXml();
      
      // Cargar el certificado
      const p12 = fs.readFileSync(certificadoPath);
      
      // En versiones recientes de Node.js, la API ha cambiado
      // Necesitamos exportar la clave privada como un Buffer para xml-crypto
      try {
        // Primero creamos el objeto KeyObject
        const p12Asn1 = crypto.createPrivateKey({
          key: p12,
          passphrase: clave
        });
        
        // Luego exportamos la clave como un Buffer PEM que xml-crypto pueda usar
        const privateKeyPem = p12Asn1.export({
          type: 'pkcs8',
          format: 'pem'
        });
        
        // Configurar opciones de firma con el Buffer
        sig.signingKey = privateKeyPem;  // Ahora es un string PEM compatible
        
        // Configurar el proveedor de información de clave dentro del mismo scope
        sig.keyInfoProvider = {
          getKeyInfo: () => {
            // Aquí se debe extraer el certificado X509 del p12
            // Esta es una implementación simplificada
            return `<X509Data><X509Certificate>${certificadoBase64}</X509Certificate></X509Data>`;
          },
          getKey: () => {
            // Devolver la clave privada para la firma como Buffer
            // xml-crypto requiere que getKey devuelva un Buffer
            return Buffer.from(privateKeyPem);
          }
        };
      } catch (error: any) {
        console.error('Error al procesar el certificado:', error);
        throw new Error(`Error al procesar el certificado: ${error.message || 'Error desconocido'}`);
      }
      
      // Configurar transformaciones
      sig.addReference(
        "//*[local-name(.)='factura' and @id='comprobante']",
        [
          "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
          "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
        ],
        "http://www.w3.org/2000/09/xmldsig#sha1"
      );
      
      // Firmar el XML
      sig.computeSignature(xml);
      const signedXml = sig.getSignedXml();
      
      // Eliminar el archivo temporal
      fs.unlinkSync(certificadoPath);
      
      return signedXml;
    } catch (error) {
      console.error('Error al firmar XML:', error);
      throw new Error('Error al firmar XML: ' + (error as Error).message);
    }
  }
}

// Instancia del servicio XML para uso externo
const xmlService = new XMLService();

/**
 * Genera el XML para una factura según el formato del SRI
 * @param factura Datos de la factura
 * @returns XML generado
 */
export async function generarXML(factura: Factura): Promise<string> {
  return xmlService.generateXML(factura);
}
