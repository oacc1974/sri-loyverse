import mongoose, { Schema, Document } from 'mongoose';
import { Configuracion } from './configuracion';

// Extendemos la interfaz Configuracion para incluir los métodos de Document de Mongoose
// Usamos Omit para evitar conflicto con la propiedad 'id'
export interface ConfiguracionDocument extends Omit<Configuracion, 'id'>, Document {}

// Schema para Configuracion
const ConfiguracionSchema = new Schema({
  loyverseToken: { type: String, required: true },
  ruc: { type: String, required: true },
  razonSocial: { type: String, required: true },
  nombreComercial: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String },
  email: { type: String, required: true },
  impuestoIVA: { type: String, required: true },
  ambiente: { type: String, enum: ['pruebas', 'produccion'], required: true },
  automatizacion: { type: Boolean, default: false },
  intervaloMinutos: { type: String, default: '15' },
  certificadoBase64: { type: String },
  claveCertificado: { type: String }
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Verificamos si el modelo ya existe para evitar errores de compilación
export const ConfiguracionModel = mongoose.models.Configuracion || mongoose.model<ConfiguracionDocument>('Configuracion', ConfiguracionSchema);
