import { Factura, Cliente, ProductoDetalle } from '../models/factura';
import { Configuracion } from '../models/configuracion';

export class ValidacionService {
  /**
   * Valida que una factura cumpla con todos los requisitos del SRI
   * @param factura Factura a validar
   * @returns Objeto con resultado de validación y mensajes de error
   */
  validarFactura(factura: Factura): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar campos obligatorios
    this.validarCamposObligatorios(factura, errores);

    // Validar cliente
    this.validarCliente(factura.cliente, errores);

    // Validar detalles
    this.validarDetalles(factura.detalles, errores);

    // Validar cálculos
    this.validarCalculos(factura, errores);

    // Validar clave de acceso
    if (factura.claveAcceso) {
      this.validarClaveAcceso(factura.claveAcceso, errores);
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida que la configuración sea correcta y completa
   * @param config Configuración a validar
   * @returns Objeto con resultado de validación y mensajes de error
   */
  validarConfiguracion(config: Configuracion): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar token de Loyverse
    if (!config.loyverseToken) {
      errores.push('El token de Loyverse es obligatorio');
    }

    // Validar datos del contribuyente
    if (!config.ruc) {
      errores.push('El RUC es obligatorio');
    } else if (!this.validarRUC(config.ruc)) {
      errores.push('El RUC no es válido');
    }

    if (!config.razonSocial) {
      errores.push('La razón social es obligatoria');
    }

    if (!config.nombreComercial) {
      errores.push('El nombre comercial es obligatorio');
    }

    if (!config.direccion) {
      errores.push('La dirección es obligatoria');
    }

    if (!config.email) {
      errores.push('El email es obligatorio');
    } else if (!this.validarEmail(config.email)) {
      errores.push('El email no es válido');
    }

    // Validar certificado y clave si se va a usar firma digital
    if (config.certificadoBase64 && !config.claveCertificado) {
      errores.push('La clave del certificado es obligatoria si se ha cargado un certificado');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida los campos obligatorios de una factura
   * @param factura Factura a validar
   * @param errores Array donde se acumularán los errores
   */
  private validarCamposObligatorios(factura: Factura, errores: string[]): void {
    if (!factura.ambiente) {
      errores.push('El ambiente es obligatorio');
    } else if (factura.ambiente !== '1' && factura.ambiente !== '2') {
      errores.push('El ambiente debe ser 1 (pruebas) o 2 (producción)');
    }

    if (!factura.tipoEmision) {
      errores.push('El tipo de emisión es obligatorio');
    }

    if (!factura.razonSocial) {
      errores.push('La razón social es obligatoria');
    }

    if (!factura.nombreComercial) {
      errores.push('El nombre comercial es obligatorio');
    }

    if (!factura.ruc) {
      errores.push('El RUC es obligatorio');
    } else if (!this.validarRUC(factura.ruc)) {
      errores.push('El RUC no es válido');
    }

    if (!factura.codDoc) {
      errores.push('El código de documento es obligatorio');
    }

    if (!factura.estab) {
      errores.push('El establecimiento es obligatorio');
    }

    if (!factura.ptoEmi) {
      errores.push('El punto de emisión es obligatorio');
    }

    if (!factura.secuencial) {
      errores.push('El secuencial es obligatorio');
    }

    if (!factura.dirMatriz) {
      errores.push('La dirección de matriz es obligatoria');
    }

    if (!factura.fechaEmision) {
      errores.push('La fecha de emisión es obligatoria');
    } else if (!this.validarFecha(factura.fechaEmision)) {
      errores.push('La fecha de emisión no es válida, debe tener formato YYYY-MM-DD');
    }

    if (!factura.dirEstablecimiento) {
      errores.push('La dirección del establecimiento es obligatoria');
    }

    if (!factura.obligadoContabilidad) {
      errores.push('El campo obligado a contabilidad es obligatorio');
    }

    if (!factura.tipoIdentificacionComprador) {
      errores.push('El tipo de identificación del comprador es obligatorio');
    }

    if (!factura.moneda) {
      errores.push('La moneda es obligatoria');
    }
  }

  /**
   * Valida los datos del cliente
   * @param cliente Cliente a validar
   * @param errores Array donde se acumularán los errores
   */
  private validarCliente(cliente: Cliente, errores: string[]): void {
    if (!cliente) {
      errores.push('Los datos del cliente son obligatorios');
      return;
    }

    if (!cliente.ruc) {
      errores.push('El RUC/Cédula del cliente es obligatorio');
    }

    if (!cliente.razonSocial) {
      errores.push('La razón social del cliente es obligatoria');
    }
  }

  /**
   * Valida los detalles de la factura
   * @param detalles Detalles a validar
   * @param errores Array donde se acumularán los errores
   */
  private validarDetalles(detalles: ProductoDetalle[], errores: string[]): void {
    if (!detalles || detalles.length === 0) {
      errores.push('La factura debe tener al menos un detalle');
      return;
    }

    detalles.forEach((detalle, index) => {
      if (!detalle.descripcion) {
        errores.push(`El detalle ${index + 1} debe tener una descripción`);
      }

      if (!detalle.cantidad || detalle.cantidad <= 0) {
        errores.push(`El detalle ${index + 1} debe tener una cantidad válida`);
      }

      if (!detalle.precioUnitario || detalle.precioUnitario < 0) {
        errores.push(`El detalle ${index + 1} debe tener un precio unitario válido`);
      }

      if (detalle.descuento < 0) {
        errores.push(`El detalle ${index + 1} tiene un descuento inválido`);
      }

      // Validar cálculos del detalle
      const precioTotalCalculado = detalle.cantidad * detalle.precioUnitario - detalle.descuento;
      if (Math.abs(detalle.precioTotalSinImpuesto - precioTotalCalculado) > 0.01) {
        errores.push(`El detalle ${index + 1} tiene un precio total sin impuesto incorrecto`);
      }

      // Validar impuestos del detalle
      if (!detalle.impuestos || detalle.impuestos.length === 0) {
        errores.push(`El detalle ${index + 1} debe tener al menos un impuesto`);
      } else {
        detalle.impuestos.forEach((impuesto, impIndex) => {
          if (!impuesto.codigo) {
            errores.push(`El impuesto ${impIndex + 1} del detalle ${index + 1} debe tener un código`);
          }

          if (!impuesto.codigoPorcentaje) {
            errores.push(`El impuesto ${impIndex + 1} del detalle ${index + 1} debe tener un código de porcentaje`);
          }

          if (!impuesto.tarifa || impuesto.tarifa < 0) {
            errores.push(`El impuesto ${impIndex + 1} del detalle ${index + 1} debe tener una tarifa válida`);
          }

          // Validar cálculos del impuesto
          const valorImpuestoCalculado = detalle.precioTotalSinImpuesto * (impuesto.tarifa / 100);
          if (Math.abs(impuesto.valor - valorImpuestoCalculado) > 0.01) {
            errores.push(`El impuesto ${impIndex + 1} del detalle ${index + 1} tiene un valor incorrecto`);
          }
        });
      }
    });
  }

  /**
   * Valida los cálculos de la factura
   * @param factura Factura a validar
   * @param errores Array donde se acumularán los errores
   */
  private validarCalculos(factura: Factura, errores: string[]): void {
    // Validar total sin impuestos
    const totalSinImpuestosCalculado = factura.detalles.reduce(
      (total, detalle) => total + detalle.precioTotalSinImpuesto,
      0
    );
    if (Math.abs(factura.totalSinImpuestos - totalSinImpuestosCalculado) > 0.01) {
      errores.push('El total sin impuestos es incorrecto');
    }

    // Validar total descuento
    const totalDescuentoCalculado = factura.detalles.reduce(
      (total, detalle) => total + detalle.descuento,
      0
    );
    if (Math.abs(factura.totalDescuento - totalDescuentoCalculado) > 0.01) {
      errores.push('El total de descuento es incorrecto');
    }

    // Validar total con impuestos
    if (!factura.totalConImpuestos || factura.totalConImpuestos.length === 0) {
      errores.push('La factura debe tener al menos un impuesto total');
    } else {
      // Agrupar impuestos por código y codigoPorcentaje
      const impuestosPorCodigo: { [key: string]: number } = {};
      factura.detalles.forEach(detalle => {
        detalle.impuestos.forEach(impuesto => {
          const key = `${impuesto.codigo}-${impuesto.codigoPorcentaje}`;
          impuestosPorCodigo[key] = (impuestosPorCodigo[key] || 0) + impuesto.valor;
        });
      });

      // Validar cada impuesto total
      factura.totalConImpuestos.forEach((impuestoTotal, index) => {
        const key = `${impuestoTotal.codigo}-${impuestoTotal.codigoPorcentaje}`;
        const valorCalculado = impuestosPorCodigo[key] || 0;
        if (Math.abs(impuestoTotal.valor - valorCalculado) > 0.01) {
          errores.push(`El valor del impuesto total ${index + 1} es incorrecto`);
        }
      });
    }

    // Validar importe total
    const importeTotalCalculado = factura.totalSinImpuestos + 
      factura.totalConImpuestos.reduce((total, impuesto) => total + impuesto.valor, 0) +
      factura.propina;
    if (Math.abs(factura.importeTotal - importeTotalCalculado) > 0.01) {
      errores.push('El importe total es incorrecto');
    }
  }

  /**
   * Valida la clave de acceso
   * @param claveAcceso Clave de acceso a validar
   * @param errores Array donde se acumularán los errores
   */
  private validarClaveAcceso(claveAcceso: string, errores: string[]): void {
    // Verificar longitud
    if (claveAcceso.length !== 49) {
      errores.push('La clave de acceso debe tener 49 dígitos');
      return;
    }

    // Verificar que sean solo dígitos
    if (!/^\d+$/.test(claveAcceso)) {
      errores.push('La clave de acceso debe contener solo dígitos');
      return;
    }

    // Verificar dígito verificador (algoritmo módulo 11)
    const claveBase = claveAcceso.substring(0, 48);
    const digitoVerificador = claveAcceso.substring(48, 49);
    const digitoCalculado = this.calcularDigitoModulo11(claveBase);

    if (digitoVerificador !== digitoCalculado) {
      errores.push('El dígito verificador de la clave de acceso es incorrecto');
    }
  }

  /**
   * Calcula el dígito verificador usando el algoritmo módulo 11
   * @param claveBase Clave base sin dígito verificador
   * @returns Dígito verificador
   */
  private calcularDigitoModulo11(claveBase: string): string {
    const factores = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7];
    
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
   * Valida un RUC ecuatoriano
   * @param ruc RUC a validar
   * @returns true si el RUC es válido, false en caso contrario
   */
  private validarRUC(ruc: string): boolean {
    // Verificar longitud
    if (ruc.length !== 13) {
      return false;
    }

    // Verificar que sean solo dígitos
    if (!/^\d+$/.test(ruc)) {
      return false;
    }

    // Verificar que los últimos 3 dígitos sean 001
    if (ruc.substring(10) !== '001') {
      return false;
    }

    // Verificar dígito verificador (simplificado)
    // En una implementación real, se debería validar según el tipo de RUC
    return true;
  }

  /**
   * Valida un email
   * @param email Email a validar
   * @returns true si el email es válido, false en caso contrario
   */
  private validarEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Valida una fecha en formato YYYY-MM-DD
   * @param fecha Fecha a validar
   * @returns true si la fecha es válida, false en caso contrario
   */
  private validarFecha(fecha: string): boolean {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(fecha)) {
      return false;
    }

    const partes = fecha.split('-');
    const year = parseInt(partes[0]);
    const month = parseInt(partes[1]);
    const day = parseInt(partes[2]);

    // Verificar rango de año
    if (year < 2000 || year > 2100) {
      return false;
    }

    // Verificar rango de mes
    if (month < 1 || month > 12) {
      return false;
    }

    // Verificar rango de día
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // Ajustar febrero en año bisiesto
    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
      diasPorMes[1] = 29;
    }

    return day >= 1 && day <= diasPorMes[month - 1];
  }
}
