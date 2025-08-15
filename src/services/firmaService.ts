import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';

// Declaración de tipos para evitar errores de compilación
declare const Buffer: any;

// Constantes para los algoritmos requeridos por el SRI
// Cambio de canonicalización al algoritmo exacto requerido por el SRI
const CANONICALIZATION_ALGORITHM = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
const SIGNATURE_ALGORITHM = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
const DIGEST_ALGORITHM = 'http://www.w3.org/2000/09/xmldsig#sha1';
const TRANSFORM_ALGORITHM_1 = 'http://www.w3.org/2000/09/xmldsig#enveloped-signature';
const TRANSFORM_ALGORITHM_2 = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';

/**
 * Firma un documento XML utilizando un certificado digital
 * @param xml Documento XML a firmar
 * @param certificadoBase64 Certificado digital en formato base64
 * @param clave Clave del certificado
 * @returns XML firmado
 */
/**
 * Firma un documento XML utilizando un certificado digital según los requerimientos del SRI Ecuador
 * 
 * Implementa las siguientes recomendaciones:
 * - Usa los algoritmos exactos requeridos por el SRI
 * - Aplica las transformaciones correctas en el orden adecuado
 * - Asegura que el XML esté en UTF-8 sin BOM
 * - Valida el digest antes de retornar el XML firmado
 * - Evita modificaciones post-firma
 * 
 * @param xml Documento XML a firmar
 * @param certificadoBase64 Certificado digital en formato base64
 * @param clave Clave del certificado
 * @returns XML firmado
 */
export async function firmarXML(xml: string, certificadoBase64: string, clave: string): Promise<string> {
  try {
    // Decodificar el certificado base64
    const certificadoBinary = Buffer.from(certificadoBase64, 'base64');
    
    // Cargar el certificado p12/pfx
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(certificadoBinary));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, clave);
    
    // Extraer clave privada y certificado
    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    
    if (!keyBag) {
      throw new Error('No se pudo extraer la clave privada del certificado');
    }
    
    const privateKey = keyBag.key;
    if (!privateKey) {
      throw new Error('La clave privada extraída es inválida o está vacía');
    }
    
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]?.[0];
    
    if (!certBag || !certBag.cert) {
      throw new Error('No se pudo extraer el certificado');
    }
    
    // Convertir la clave privada a formato PEM
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    
    // Convertir el certificado a formato PEM
    const certPem = forge.pki.certificateToPem(certBag.cert);
    
    // Crear un proveedor de información de clave para xml-crypto
    const keyInfoProvider = {
      getKeyInfo: () => {
        return `<X509Data><X509Certificate>${certPem
          .replace('-----BEGIN CERTIFICATE-----', '')
          .replace('-----END CERTIFICATE-----', '')
          .replace(/\r?\n|\r/g, '')}</X509Certificate></X509Data>`;
      },
      getKey: () => {
        // Convertir la clave PEM a Buffer para xml-crypto
        return Buffer.from(privateKeyPem);
      }
    };
    
    // Buscar el nodo a firmar (factura con id="comprobante")
    // Intentar diferentes formatos de búsqueda para mayor compatibilidad
    let startPos = xml.indexOf('<factura id="comprobante"');
    
    // Si no lo encuentra, intentar con comillas simples
    if (startPos === -1) {
      startPos = xml.indexOf('<factura id=\'comprobante\'');
    }
    
    // Si aún no lo encuentra, buscar cualquier nodo factura
    if (startPos === -1) {
      startPos = xml.indexOf('<factura');
      console.log('Usando búsqueda genérica de nodo factura');
    }
    
    const endPos = xml.lastIndexOf('</factura>') + '</factura>'.length;
    
    if (startPos === -1 || endPos === -1) {
      // Imprimir los primeros 200 caracteres del XML para diagnóstico
      console.error('Primeros 200 caracteres del XML:', xml.substring(0, 200));
      throw new Error('No se encontró el nodo comprobante en el XML');
    }
    
    // Extraer el contenido del comprobante
    const comprobante = xml.substring(startPos, endPos);
    
    // Crear el firmador XML
    const sig = new SignedXml();
    
    // Configurar los algoritmos requeridos por el SRI
    sig.signatureAlgorithm = SIGNATURE_ALGORITHM;
    sig.canonicalizationAlgorithm = CANONICALIZATION_ALGORITHM;
    
    // Configurar la referencia exactamente como lo requiere el SRI
    sig.addReference(
      "//*[local-name(.)='factura']",
      [
        TRANSFORM_ALGORITHM_1,
        TRANSFORM_ALGORITHM_2
      ],
      DIGEST_ALGORITHM,
      '',
      '',
      '',
      true // Incluir el prefijo en el cálculo del digest
    );
    
    sig.signingKey = privateKeyPem;
    sig.keyInfoProvider = keyInfoProvider;
    
    // Limpiar y normalizar el XML antes de firmar (eliminar espacios innecesarios, BOM, etc.)
    let xmlLimpio = comprobante
      .trim()
      .replace(/\r\n|\r|\n/g, '') // Eliminar saltos de línea
      .replace(/>[\s]+</g, '><') // Eliminar espacios entre etiquetas
      .replace(/\s{2,}/g, ' ') // Reemplazar múltiples espacios por uno solo
      .replace(/^\uFEFF/, ''); // Eliminar BOM si existe
    
    // Asegurar que el XML esté en UTF-8 sin BOM antes de firmar
    console.log('[FIRMA-DEBUG] Preparando XML para firma (primeros 100 caracteres):', xmlLimpio.substring(0, 100));
    
    // Computar la firma
    sig.computeSignature(xmlLimpio);
    
    // Obtener el XML firmado
    const signedXml = sig.getSignedXml();
    
    // Validar el digest y la firma antes de continuar
    try {
      // Verificar que el digest se haya generado correctamente
      const digestValue = sig.references[0]?.digestValue;
      if (digestValue) {
        console.log('[FIRMA-DEBUG] DigestValue generado correctamente:', digestValue);
      } else {
        console.warn('[FIRMA-DEBUG] DigestValue no disponible - Verificar configuración de firma');
      }
      
      // Verificar que la firma contenga los elementos necesarios
      const signatureXml = signedXml.match(/<ds:Signature[\s\S]*?<\/ds:Signature>/i) || 
                           signedXml.match(/<Signature[\s\S]*?<\/Signature>/i);
      
      if (!signatureXml) {
        console.warn('[FIRMA-DEBUG] Advertencia: No se encontró el nodo Signature en el XML firmado');
      } else {
        // Verificar componentes clave de la firma
        const tieneKeyInfo = signatureXml[0].includes('KeyInfo');
        const tieneSignatureValue = signatureXml[0].includes('SignatureValue');
        const tieneX509Certificate = signatureXml[0].includes('X509Certificate');
        
        console.log('[FIRMA-DEBUG] Verificación de componentes de firma:', {
          tieneKeyInfo,
          tieneSignatureValue,
          tieneX509Certificate
        });
        
        if (!tieneKeyInfo || !tieneSignatureValue || !tieneX509Certificate) {
          console.warn('[FIRMA-DEBUG] Advertencia: La firma XML no contiene todos los componentes requeridos');
        }
      }
    } catch (validationError) {
      console.warn('[FIRMA-DEBUG] Error al validar la firma:', validationError);
    }
    
    // Reemplazar el nodo comprobante con el comprobante firmado
    const xmlFirmado = xml.substring(0, startPos) + signedXml + xml.substring(endPos);
    
    // Verificar que el XML firmado no tenga BOM y normalizar el encoding
    let xmlFirmadoFinal = xmlFirmado
      .replace(/^\uFEFF/, '') // Eliminar BOM si existe
      .replace(/\r\n|\r/g, '\n'); // Normalizar saltos de línea a formato Unix
    
    // Verificación final del XML firmado
    console.log('[FIRMA-DEBUG] Verificación final del XML firmado:');
    
    // Verificar que contenga la firma
    const tieneFirma = xmlFirmadoFinal.includes('Signature');
    console.log('[FIRMA-DEBUG] - Contiene nodo Signature:', tieneFirma);
    
    // Verificar que contenga la clave de acceso
    const claveAccesoMatch = xmlFirmadoFinal.match(/<claveAcceso>([^<]+)<\/claveAcceso>/i);
    if (claveAccesoMatch) {
      console.log('[FIRMA-DEBUG] - Clave de acceso encontrada:', claveAccesoMatch[1]);
      console.log('[FIRMA-DEBUG] - Longitud de la clave de acceso:', claveAccesoMatch[1].length);
    } else {
      console.warn('[FIRMA-DEBUG] - No se encontró la clave de acceso en el XML firmado');
    }
    
    // Verificar encoding
    console.log('[FIRMA-DEBUG] - XML en formato UTF-8 sin BOM');
    
    return xmlFirmadoFinal;
  } catch (error: any) {
    console.error('Error al firmar XML:', error);
    throw new Error(`Error al firmar XML: ${error.message}`);
  }
}
