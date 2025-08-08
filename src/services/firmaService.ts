import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';

/**
 * Firma un documento XML utilizando un certificado digital
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
    
    // Extraer la clave privada y el certificado
    let privateKey: forge.pki.PrivateKey | null = null;
    let cert: forge.pki.Certificate | null = null;
    
    // Buscar la clave privada y el certificado
    try {
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      if (keyBags && keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]) {
        privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key || null;
      }
      
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      if (certBags && certBags[forge.pki.oids.certBag]) {
        cert = certBags[forge.pki.oids.certBag][0].cert || null;
      }
    } catch (error: any) {
      throw new Error(`Error al procesar el certificado: ${error?.message || 'Error desconocido'}`);
    }
    
    if (!privateKey || !cert) {
      throw new Error('No se pudo extraer la clave privada o el certificado');
    }
    
    // Convertir la clave privada a formato PEM
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    
    // Convertir el certificado a formato PEM
    const certPem = forge.pki.certificateToPem(cert);
    
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
    
    // Buscar el nodo a firmar (comprobante)
    const startTag = '<comprobante>';
    const endTag = '</comprobante>';
    const startPos = xml.indexOf(startTag);
    const endPos = xml.indexOf(endTag) + endTag.length;
    
    if (startPos === -1 || endPos === -1) {
      throw new Error('No se encontró el nodo comprobante en el XML');
    }
    
    // Extraer el contenido del comprobante
    const comprobante = xml.substring(startPos, endPos);
    
    // Crear el firmador XML
    const sig = new SignedXml();
    sig.addReference(
      "//*[local-name(.)='comprobante']",
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ],
      'http://www.w3.org/2000/09/xmldsig#sha1'
    );
    
    sig.signingKey = privateKeyPem;
    sig.keyInfoProvider = keyInfoProvider;
    sig.computeSignature(comprobante);
    
    // Obtener el XML firmado
    const signedXml = sig.getSignedXml();
    
    // Reemplazar el nodo comprobante con el comprobante firmado
    const xmlFirmado = xml.substring(0, startPos) + signedXml + xml.substring(endPos);
    
    return xmlFirmado;
  } catch (error: any) {
    console.error('Error al firmar XML:', error);
    throw new Error(`Error al firmar XML: ${error.message}`);
  }
}
