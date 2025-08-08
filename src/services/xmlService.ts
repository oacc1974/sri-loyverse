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
      xmlObj.factura.infoAdicional = {
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
    
    // Extraer fecha en formato ddmmaaaa
    const fechaParts = factura.fechaEmision.split('-');
    const fechaFormato = `${fechaParts[2]}${fechaParts[1]}${fechaParts[0]}`;
    
    // Código numérico aleatorio de 8 dígitos
    const codigoNumerico = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Construir clave sin dígito verificador
    const claveBase = `${fechaFormato}${factura.codDoc}${factura.ruc}${factura.ambiente}${factura.estab}${factura.ptoEmi}${factura.secuencial}${codigoNumerico}${factura.tipoEmision}`;
    
    // Calcular dígito verificador (algoritmo módulo 11)
    const digitoVerificador = this.calcularDigitoModulo11(claveBase);
    
    // Retornar clave completa
    return `${claveBase}${digitoVerificador}`;
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
      const p12Asn1 = crypto.createPrivateKey({
        key: p12,
        format: 'der',
        type: 'pkcs12',
        passphrase: clave
      });
      
      // Configurar opciones de firma
      sig.signingKey = p12Asn1;
      sig.keyInfoProvider = {
        getKeyInfo: () => {
          // Aquí se debe extraer el certificado X509 del p12
          // Esta es una implementación simplificada
          return `<X509Data><X509Certificate>${certificadoBase64}</X509Certificate></X509Data>`;
        }
      };
      
      // Configurar transformaciones
      sig.addReference(
        "//*[local-name(.)='factura']",
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
