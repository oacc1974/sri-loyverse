export interface Cliente {
  ruc: string;
  razonSocial: string;
  direccion: string;
  telefono?: string;
  email?: string;
}

export interface ProductoDetalle {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  impuestos: {
    codigo: string;
    codigoPorcentaje: string;
    tarifa: number;
    baseImponible: number;
    valor: number;
  }[];
}

export interface Factura {
  id?: string;
  loyverseId?: string;
  claveAcceso?: string;
  ambiente: '1' | '2'; // 1=Pruebas, 2=Producción
  tipoEmision: string;
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  codDoc: string;
  estab: string;
  ptoEmi: string;
  secuencial: string;
  dirMatriz: string;
  fechaEmision: string;
  dirEstablecimiento: string;
  contribuyenteEspecial: string;
  obligadoContabilidad: 'SI' | 'NO';
  tipoIdentificacionComprador: string;
  cliente: Cliente;
  totalSinImpuestos: number;
  totalDescuento: number;
  totalConImpuestos: {
    codigo: string;
    codigoPorcentaje: string;
    baseImponible: number;
    valor: number;
  }[];
  propina: number;
  importeTotal: number;
  moneda: string;
  detalles: ProductoDetalle[];
  infoAdicional?: {
    nombre: string;
    valor: string;
  }[];
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  mensajeError?: string;
  xmlFirmado?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FacturaResponse {
  success: boolean;
  message: string;
  data?: Factura;
}

export interface FacturasResponse {
  success: boolean;
  message: string;
  data?: Factura[];
  total?: number;
  page?: number;
  limit?: number;
}
