'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FacturaDetalle from '../../components/FacturaDetalle';
// Definición de interfaces necesarias para el dashboard
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

// Definición del componente Modal para evitar errores de JSX IntrinsicElements
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps): React.ReactElement | null => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-10rem)]">{children}</div>
        <div className="px-6 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [filtroAmbiente, setFiltroAmbiente] = useState<'Todos' | '1' | '2'>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'AUTORIZADO' | 'RECHAZADO' | 'PENDIENTE' | 'DESCONOCIDO'>('Todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroRuc, setFiltroRuc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [verificandoFactura, setVerificandoFactura] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  // Cargar facturas reales desde la API
  const cargarFacturas = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Construir parámetros de consulta
      const params: Record<string, string> = {};
      
      if (filtroAmbiente !== 'Todos') {
        params.ambiente = filtroAmbiente;
      }
      
      if (filtroEstado !== 'Todos') {
        params.estado = filtroEstado;
      }
      
      if (filtroRuc) {
        params.ruc = filtroRuc;
      }
      
      if (filtroFechaDesde) {
        params.fechaDesde = filtroFechaDesde;
      }
      
      if (filtroFechaHasta) {
        params.fechaHasta = filtroFechaHasta;
      }
      
      const response = await axios.get('/api/factura', { params });
      
      if (response.data.success) {
        setFacturas(response.data.data || []);
        setUltimaActualizacion(new Date());
      } else {
        setError('Error al cargar facturas: ' + response.data.message);
      }
    } catch (error: any) {
      setError(`Error al cargar facturas: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar estado de una factura específica ante el SRI
  const verificarEstadoSRI = async (facturaId: string, ambiente?: string) => {
    if (verificandoFactura) return;
    
    setVerificandoFactura(true);
    setError('');
    setSuccess('');
    
    try {
      setIsLoading(true);
      const url = ambiente 
        ? `/api/factura/verificar/${facturaId}?ambiente=${ambiente}` 
        : `/api/factura/verificar/${facturaId}`;
      
      const response = await axios.get(url);
      setSuccess(`Factura verificada correctamente: ${response.data.mensaje || 'Estado actualizado'}`);
      await cargarFacturas(); // Recargar facturas para mostrar el estado actualizado
    } catch (error: any) {
      console.error('Error al verificar factura:', error);
      setError(`Error al verificar la factura: ${error.response?.data?.mensaje || error.message || 'Intente nuevamente.'}`);
    } finally {
      setIsLoading(false);
      setVerificandoFactura(false);
    }
  };
  
  // Función para verificar todas las facturas en estado DESCONOCIDO
  const verificarFacturasDesconocidas = async () => {
    if (verificandoFactura) return;
    
    setVerificandoFactura(true);
    setError('');
    setSuccess('');
    
    try {
      setIsLoading(true);
      const response = await axios.get('/api/factura/verificar-desconocidas');
      setSuccess(`Verificación automática iniciada: ${response.data.mensaje || 'Procesando facturas en estado DESCONOCIDO'}`);
      await cargarFacturas(); // Recargar facturas para mostrar estados actualizados
    } catch (error: any) {
      console.error('Error al verificar facturas desconocidas:', error);
      setError(`Error al verificar facturas: ${error.response?.data?.mensaje || error.message || 'Intente nuevamente.'}`);
    } finally {
      setIsLoading(false);
      setVerificandoFactura(false);
    }
  };
  
  // Reintentar procesamiento de una factura rechazada
  const reintentarFactura = async (facturaId: string) => {
    if (verificandoFactura) return;
    
    setVerificandoFactura(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`/api/factura/reprocesar/${facturaId}`);
      
      if (response.data.success) {
        setSuccess(`Reprocesamiento exitoso: ${response.data.message}`);
        // Recargar facturas para mostrar el estado actualizado
        await cargarFacturas();
      } else {
        setError(`Error en reprocesamiento: ${response.data.message}`);
      }
    } catch (error: any) {
      setError(`Error al reprocesar factura: ${error.response?.data?.message || error.message}`);
    } finally {
      setVerificandoFactura(false);
    }
  };
  
  // Cargar facturas al iniciar y cuando cambien los filtros
  useEffect(() => {
    cargarFacturas();
  }, [filtroAmbiente, filtroEstado, filtroFechaDesde, filtroFechaHasta, filtroRuc]);

  // Mostrar fecha en formato legible
  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color según estado
  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'AUTORIZADO':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      case 'DESCONOCIDO':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDIENTE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener nombre de ambiente
  const getNombreAmbiente = (ambiente: '1' | '2') => {
    return ambiente === '1' ? 'Pruebas' : 'Producción';
  };

  // Obtener color según ambiente
  const getColorAmbiente = (ambiente: '1' | '2') => {
    return ambiente === '1' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  // Ver detalles de una factura
  const handleVerDetalles = (factura: Factura) => {
    setSelectedFactura(factura);
    setShowDetalleModal(true);
  };

  // Cerrar modal de detalles
  const handleCerrarDetalles = () => {
    setShowDetalleModal(false);
    setSelectedFactura(null);
  };

  // Exportar a CSV
  const handleExportarCSV = (): void => {
    if (facturas.length === 0) {
      setError('No hay facturas para exportar');
      return;
    }
    
    // Implementación básica de exportación CSV
    const headers = ['Secuencial', 'Fecha', 'Cliente', 'RUC', 'Total', 'Estado', 'Ambiente'];
    const csvContent = [
      headers.join(','),
      ...facturas.map((f: Factura) => [
        `${f.estab}-${f.ptoEmi}-${f.secuencial}`,
        formatearFecha(f.fechaEmision),
        f.cliente.razonSocial.replace(/,/g, ' '),
        f.cliente.ruc,
        f.importeTotal,
        f.estado,
        getNombreAmbiente(f.ambiente)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `facturas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess('Archivo CSV exportado correctamente');
  };

  // Exportar a PDF (placeholder)
  const handleExportarPDF = () => {
    setError('Exportación a PDF no implementada aún');
  };

  // Filtrar facturas según los criterios seleccionados
  const facturasFiltradas = facturas.filter((factura: Factura) => {
    // Si no hay facturas, no filtrar
    if (facturas.length === 0) return true;
    
    // Filtrar por ambiente
    if (filtroAmbiente !== 'Todos' && factura.ambiente !== filtroAmbiente) {
      return false;
    }
    
    // Filtrar por estado
    if (filtroEstado !== 'Todos' && factura.estado !== filtroEstado) {
      return false;
    }
    
    // Filtrar por RUC
    if (filtroRuc && !factura.cliente.ruc.includes(filtroRuc)) {
      return false;
    }
    
    // Filtrar por fecha desde
    if (filtroFechaDesde) {
      const fechaDesde = new Date(filtroFechaDesde);
      const fechaFactura = new Date(factura.fechaEmision);
      if (fechaFactura < fechaDesde) {
        return false;
      }
    }
    
    // Filtrar por fecha hasta
    if (filtroFechaHasta) {
      const fechaHasta = new Date(filtroFechaHasta);
      fechaHasta.setHours(23, 59, 59, 999); // Fin del día
      const fechaFactura = new Date(factura.fechaEmision);
      if (fechaFactura > fechaHasta) {
        return false;
      }
    }
    
    return true;
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Dashboard de Facturas</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => verificarFacturasDesconocidas()}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
            disabled={isLoading || verificandoFactura}
          >
            Verificar Desconocidas
          </button>
          <button
            onClick={handleExportarCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            disabled={isLoading || facturas.length === 0}
          >
            Exportar CSV
          </button>
          <button
            onClick={handleExportarPDF}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            disabled={isLoading || facturas.length === 0}
          >
            Exportar PDF
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
            <select
              value={filtroAmbiente}
              onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setFiltroAmbiente(e.target.value as 'Todos' | '1' | '2')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
              disabled={isLoading}
            >
              <option value="Todos">Todos</option>
              <option value="1">Pruebas</option>
              <option value="2">Producción</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setFiltroEstado(e.target.value as 'Todos' | 'AUTORIZADO' | 'RECHAZADO' | 'PENDIENTE' | 'DESCONOCIDO')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
              disabled={isLoading}
            >
              <option value="Todos">Todos</option>
              <option value="AUTORIZADO">Autorizado</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="DESCONOCIDO">Desconocido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC Cliente</label>
            <input
              type="text"
              value={filtroRuc}
              onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setFiltroRuc(e.target.value)}
              placeholder="Ingrese RUC"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setFiltroFechaDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setFiltroFechaHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Facturas</h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron facturas con los filtros seleccionados
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Secuencial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ambiente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facturasFiltradas.map((factura: Factura) => (
                  <tr key={factura._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {`${factura.estab}-${factura.ptoEmi}-${factura.secuencial}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearFecha(factura.fechaEmision)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.cliente.razonSocial}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.cliente.ruc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${factura.importeTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorEstado(factura.estado)}`}>
                        {factura.estado}
                      </span>
                      {factura.mensajeError && (
                        <div className="text-xs text-red-600 mt-1">
                          {factura.mensajeError}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorAmbiente(factura.ambiente)}`}>
                        {getNombreAmbiente(factura.ambiente)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleVerDetalles(factura)}
                        className="text-primary hover:text-blue-700 mr-3"
                      >
                        Ver
                      </button>
                      {factura.estado === 'RECHAZADO' && (
                        <button
                          onClick={() => reintentarFactura(factura._id)}
                          className="text-red-600 hover:text-red-800 mr-3"
                        >
                          Reintentar
                        </button>
                      )}
                      <button
                        onClick={() => verificarEstadoSRI(factura._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Verificar SRI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Detalles de Factura */}
      <Modal
        isOpen={showDetalleModal}
        onClose={handleCerrarDetalles}
        title={`Factura ${selectedFactura ? `${selectedFactura.estab}-${selectedFactura.ptoEmi}-${selectedFactura.secuencial}` : ''}`}
        children={undefined}
      >
        {selectedFactura && (
          <FacturaDetalle
            factura={selectedFactura}
            verificarEstadoSRI={verificarEstadoSRI}
            reintentarFactura={reintentarFactura}
            verificandoFactura={verificandoFactura}
            getColorEstado={getColorEstado}
            getColorAmbiente={getColorAmbiente}
            getNombreAmbiente={getNombreAmbiente}
            formatearFecha={formatearFecha}
          />
        )}
      </Modal>
    </div>
  );
}
