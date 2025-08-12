import mongoose, { Schema, Document } from 'mongoose';
import { Factura, Cliente, ProductoDetalle } from './factura';

// Extendemos la interfaz Factura para incluir los métodos de Document de Mongoose
// Usamos Omit para evitar conflicto con la propiedad 'id'
// También necesitamos evitar conflicto con '_id' que viene de Document
export interface FacturaDocument extends Omit<Factura, 'id' | '_id'>, Document {}

// Schema para Cliente
const ClienteSchema = new Schema({
  ruc: { type: String, required: true },
  razonSocial: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String },
  email: { type: String }
});

// Schema para ProductoDetalle
const ProductoDetalleSchema = new Schema({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  descuento: { type: Number, required: true },
  precioTotalSinImpuesto: { type: Number, required: true },
  impuestos: [{
    codigo: { type: String, required: true },
    codigoPorcentaje: { type: String, required: true },
    tarifa: { type: Number, required: true },
    baseImponible: { type: Number, required: true },
    valor: { type: Number, required: true }
  }]
});

// Schema principal para Factura
const FacturaSchema = new Schema({
  loyverseId: { type: String },
  claveAcceso: { type: String },
  ambiente: { type: String, enum: ['1', '2'], required: true }, // 1=Pruebas, 2=Producción
  tipoEmision: { type: String, required: true },
  razonSocial: { type: String, required: true },
  nombreComercial: { type: String, required: true },
  ruc: { type: String, required: true },
  codDoc: { type: String, required: true },
  estab: { type: String, required: true },
  ptoEmi: { type: String, required: true },
  secuencial: { type: String, required: true },
  dirMatriz: { type: String, required: true },
  fechaEmision: { type: String, required: true },
  dirEstablecimiento: { type: String, required: true },
  contribuyenteEspecial: { type: String },
  obligadoContabilidad: { type: String, enum: ['SI', 'NO'], required: true },
  tipoIdentificacionComprador: { type: String, required: true },
  cliente: { type: ClienteSchema, required: true },
  totalSinImpuestos: { type: Number, required: true },
  totalDescuento: { type: Number, required: true },
  totalConImpuestos: [{
    codigo: { type: String, required: true },
    codigoPorcentaje: { type: String, required: true },
    baseImponible: { type: Number, required: true },
    valor: { type: Number, required: true }
  }],
  propina: { type: Number, required: true },
  importeTotal: { type: Number, required: true },
  moneda: { type: String, required: true },
  pagos: [{
    formaPago: { type: String, required: true },
    total: { type: Number, required: true }
  }],
  detalles: { type: [ProductoDetalleSchema], required: true },
  infoAdicional: { type: Map, of: String },
  estado: { type: String, default: 'PENDIENTE' }, // PENDIENTE, ENVIADO, AUTORIZADO, RECHAZADO
  numeroAutorizacion: { type: String },
  fechaAutorizacion: { type: String },
  xmlSinFirma: { type: String },
  xmlFirmado: { type: String },
  respuestaSRI: { type: Object }
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Verificamos si el modelo ya existe para evitar errores de compilación
export const FacturaModel = mongoose.models.Factura || mongoose.model<FacturaDocument>('Factura', FacturaSchema);
