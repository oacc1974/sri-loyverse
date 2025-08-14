// Interfaces para el modelo de factura

export interface Cliente {
  ruc: string;
  razonSocial: string;
  email?: string;
  direccion?: string;
  telefono?: string;
}

export interface HistorialEstado {
  estado: string;
  fecha: string;
  mensaje?: string;
}

export interface Impuesto {
  codigo: string;
  codigoPorcentaje: string;
  baseImponible: number;
  valor: number;
}

export interface Pago {
  formaPago: string;
  total: number;
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
  _id: string;
  claveAcceso?: string;
  loyverseId?: string;
  ambiente: '1' | '2'; // 1=Pruebas, 2=Producción
  tipoEmision?: string;
  razonSocial?: string;
  nombreComercial?: string;
  ruc?: string;
  codDoc?: string;
  estab: string;
  ptoEmi: string;
  secuencial: string;
  dirMatriz?: string;
  fechaEmision: string;
  dirEstablecimiento?: string;
  contribuyenteEspecial?: string;
  obligadoContabilidad?: string;
  tipoIdentificacionComprador?: string;
  cliente: Cliente;
  totalSinImpuestos?: number;
  totalDescuento?: number;
  totalConImpuestos?: Impuesto[];
  propina?: number;
  importeTotal: number;
  moneda?: string;
  pagos?: Pago[];
  detalles?: ProductoDetalle[];
  estado: string;
  mensajeError?: string;
  historialEstados?: HistorialEstado[];
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  xmlSinFirma?: string;
  xmlFirmado?: string;
  respuestaSRI?: any;
  createdAt?: string;
  updatedAt?: string;
}
