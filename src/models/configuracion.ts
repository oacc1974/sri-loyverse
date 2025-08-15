export interface Configuracion {
  id?: string;
  loyverseToken: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  telefono?: string;
  email: string;
  impuestoIVA: string;
  ambiente: 'pruebas' | 'produccion';
  automatizacion: boolean;
  intervaloMinutos: string;
  certificadoBase64?: string;
  claveCertificado?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConfiguracionResponse {
  success: boolean;
  message: string;
  data?: Configuracion;
}
