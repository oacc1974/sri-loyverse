import React from 'react';

// Definición de interfaces necesarias para el componente
interface Cliente {
  ruc: string;
  razonSocial: string;
  email?: string;
  direccion?: string;
  telefono?: string;
}

interface HistorialEstado {
  estado: string;
  fecha: string;
  mensaje?: string;
}

interface Impuesto {
  codigo: string;
  codigoPorcentaje: string;
  baseImponible: number;
  valor: number;
}

interface Factura {
  _id: string;
  claveAcceso?: string;
  loyverseId?: string;
  ambiente: '1' | '2';
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
  pagos?: { formaPago: string; total: number; }[];
  detalles?: any[];
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

interface FacturaDetalleProps {
  factura: Factura;
  verificarEstadoSRI: (facturaId: string, ambiente?: string) => Promise<void>;
  reintentarFactura: (facturaId: string) => Promise<void>;
  verificandoFactura: boolean;
  getColorEstado: (estado: string) => string;
  getColorAmbiente: (ambiente: string) => string;
  getNombreAmbiente: (ambiente: string) => string;
  formatearFecha: (fecha: string) => string;
}

const FacturaDetalle: React.FC<FacturaDetalleProps> = ({
  factura,
  verificarEstadoSRI,
  reintentarFactura,
  verificandoFactura,
  getColorEstado,
  getColorAmbiente,
  getNombreAmbiente,
  formatearFecha
}: FacturaDetalleProps) => {
  return (
    <div className="space-y-6">
      {/* Información General */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Información General</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Estado</p>
            <p className="text-sm">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorEstado(factura.estado)}`}>
                {factura.estado}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ambiente</p>
            <p className="text-sm">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorAmbiente(factura.ambiente)}`}>
                {getNombreAmbiente(factura.ambiente)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha Emisión</p>
            <p className="text-sm">{formatearFecha(factura.fechaEmision)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha Autorización</p>
            <p className="text-sm">{factura.fechaAutorizacion ? formatearFecha(factura.fechaAutorizacion) : 'No autorizada'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Número Autorización</p>
            <p className="text-sm">{factura.numeroAutorizacion || 'No disponible'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Clave Acceso</p>
            <p className="text-sm break-all">{factura.claveAcceso || 'No disponible'}</p>
          </div>
        </div>
      </div>
      
      {/* Información del Cliente */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Información del Cliente</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Razón Social</p>
            <p className="text-sm">{factura.cliente.razonSocial}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">RUC</p>
            <p className="text-sm">{factura.cliente.ruc}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-sm">{factura.cliente.email || 'No disponible'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Dirección</p>
            <p className="text-sm">{factura.cliente.direccion || 'No disponible'}</p>
          </div>
        </div>
      </div>
      
      {/* Totales */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Totales</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Subtotal</p>
            <p className="text-sm">${factura.totalSinImpuestos?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Descuento</p>
            <p className="text-sm">${factura.totalDescuento?.toFixed(2) || '0.00'}</p>
          </div>
          {factura.totalConImpuestos?.map((impuesto: Impuesto, index: number) => (
            <div key={index}>
              <p className="text-sm font-medium text-gray-500">IVA {impuesto.codigoPorcentaje === '3' ? '15%' : impuesto.codigoPorcentaje === '2' ? '12%' : impuesto.codigoPorcentaje === '0' ? '0%' : impuesto.codigoPorcentaje}</p>
              <p className="text-sm">${impuesto.valor.toFixed(2)}</p>
            </div>
          ))}
          <div>
            <p className="text-sm font-medium text-gray-500">Total</p>
            <p className="text-sm font-bold">${factura.importeTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      {/* Historial de Estados */}
      {factura.historialEstados && factura.historialEstados.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-2">Historial de Estados</h4>
          <div className="space-y-2">
            {factura.historialEstados.map((historial: HistorialEstado, index: number) => (
              <div key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                <p className="text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorEstado(historial.estado)}`}>
                    {historial.estado}
                  </span>
                  <span className="ml-2 text-gray-500">{formatearFecha(historial.fecha)}</span>
                </p>
                {historial.mensaje && (
                  <p className="text-xs text-gray-600 mt-1">{historial.mensaje}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Mensaje de Error */}
      {factura.mensajeError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-lg font-semibold text-red-700 mb-2">Mensaje de Error</h4>
          <p className="text-sm text-red-600">{factura.mensajeError}</p>
        </div>
      )}
      
      {/* Acciones */}
      <div className="flex justify-between pt-4 border-t">
        <div>
          <button
            onClick={() => verificarEstadoSRI(factura._id, '1')}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors mr-2"
            disabled={verificandoFactura}
          >
            Verificar en Pruebas
          </button>
          <button
            onClick={() => verificarEstadoSRI(factura._id, '2')}
            className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md hover:bg-purple-200 transition-colors"
            disabled={verificandoFactura}
          >
            Verificar en Producción
          </button>
        </div>
        {factura.estado === 'RECHAZADO' && (
          <button
            onClick={() => reintentarFactura(factura._id)}
            className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
            disabled={verificandoFactura}
          >
            Reintentar Procesamiento
          </button>
        )}
      </div>
    </div>
  );
};

export default FacturaDetalle;
