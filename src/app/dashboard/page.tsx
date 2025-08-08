'use client';

import { useState, useEffect } from 'react';

interface Factura {
  id: string;
  numero: string;
  fecha: string;
  cliente: string;
  ruc: string;
  total: number;
  estado: 'Aceptada' | 'Rechazada' | 'Pendiente';
  mensajeError?: string;
  ambiente: 'Pruebas' | 'Producción';
}

export default function DashboardPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [filtroAmbiente, setFiltroAmbiente] = useState<'Todos' | 'Pruebas' | 'Producción'>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Aceptada' | 'Rechazada' | 'Pendiente'>('Todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroRuc, setFiltroRuc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Datos de ejemplo para simular la carga de facturas
  useEffect(() => {
    const facturasEjemplo: Factura[] = [
      {
        id: '1',
        numero: '001-001-000000001',
        fecha: '2023-08-10',
        cliente: 'Juan Pérez',
        ruc: '1723456789001',
        total: 112.00,
        estado: 'Aceptada',
        ambiente: 'Pruebas'
      },
      {
        id: '2',
        numero: '001-001-000000002',
        fecha: '2023-08-11',
        cliente: 'María López',
        ruc: '1798765432001',
        total: 56.50,
        estado: 'Rechazada',
        mensajeError: 'Error en la estructura del XML',
        ambiente: 'Pruebas'
      },
      {
        id: '3',
        numero: '001-001-000000003',
        fecha: '2023-08-12',
        cliente: 'Pedro Gómez',
        ruc: '1712345678001',
        total: 89.75,
        estado: 'Pendiente',
        ambiente: 'Producción'
      },
      {
        id: '4',
        numero: '001-001-000000004',
        fecha: '2023-08-13',
        cliente: 'Ana Rodríguez',
        ruc: '1787654321001',
        total: 145.20,
        estado: 'Aceptada',
        ambiente: 'Producción'
      },
      {
        id: '5',
        numero: '001-001-000000005',
        fecha: '2023-08-14',
        cliente: 'Carlos Sánchez',
        ruc: '1756789012001',
        total: 78.30,
        estado: 'Pendiente',
        ambiente: 'Pruebas'
      }
    ];

    // Simular carga de datos
    setTimeout(() => {
      setFacturas(facturasEjemplo);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filtrar facturas según los criterios seleccionados
  const facturasFiltradas = facturas.filter(factura => {
    // Filtro por ambiente
    if (filtroAmbiente !== 'Todos' && factura.ambiente !== filtroAmbiente) {
      return false;
    }
    
    // Filtro por estado
    if (filtroEstado !== 'Todos' && factura.estado !== filtroEstado) {
      return false;
    }
    
    // Filtro por RUC
    if (filtroRuc && !factura.ruc.includes(filtroRuc)) {
      return false;
    }
    
    // Filtro por fecha desde
    if (filtroFechaDesde && factura.fecha < filtroFechaDesde) {
      return false;
    }
    
    // Filtro por fecha hasta
    if (filtroFechaHasta && factura.fecha > filtroFechaHasta) {
      return false;
    }
    
    return true;
  });

  const handleExportarCSV = () => {
    // Implementar lógica para exportar a CSV
    alert('Exportando a CSV...');
  };

  const handleExportarPDF = () => {
    // Implementar lógica para exportar a PDF
    alert('Exportando a PDF...');
  };

  const handleReintentarFactura = (id: string) => {
    // Implementar lógica para reintentar el envío de la factura
    alert(`Reintentando envío de factura ${id}...`);
  };

  const handleVerDetalles = (id: string) => {
    // Implementar lógica para ver detalles de la factura
    alert(`Ver detalles de factura ${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Dashboard de Facturas</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExportarCSV}
            className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Exportar CSV
          </button>
          <button
            onClick={handleExportarPDF}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filtroAmbiente" className="form-label">
              Ambiente
            </label>
            <select
              id="filtroAmbiente"
              value={filtroAmbiente}
              onChange={(e) => setFiltroAmbiente(e.target.value as 'Todos' | 'Pruebas' | 'Producción')}
              className="form-input"
            >
              <option value="Todos">Todos</option>
              <option value="Pruebas">Pruebas</option>
              <option value="Producción">Producción</option>
            </select>
          </div>
          <div>
            <label htmlFor="filtroEstado" className="form-label">
              Estado
            </label>
            <select
              id="filtroEstado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'Todos' | 'Aceptada' | 'Rechazada' | 'Pendiente')}
              className="form-input"
            >
              <option value="Todos">Todos</option>
              <option value="Aceptada">Aceptada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
          <div>
            <label htmlFor="filtroRuc" className="form-label">
              RUC
            </label>
            <input
              type="text"
              id="filtroRuc"
              value={filtroRuc}
              onChange={(e) => setFiltroRuc(e.target.value)}
              className="form-input"
              placeholder="Buscar por RUC"
            />
          </div>
          <div>
            <label htmlFor="filtroFechaDesde" className="form-label">
              Fecha Desde
            </label>
            <input
              type="date"
              id="filtroFechaDesde"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="filtroFechaHasta" className="form-label">
              Fecha Hasta
            </label>
            <input
              type="date"
              id="filtroFechaHasta"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600">Cargando facturas...</p>
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No se encontraron facturas con los filtros seleccionados.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
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
                {facturasFiltradas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {factura.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.fecha}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.cliente}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.ruc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${factura.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          factura.estado === 'Aceptada'
                            ? 'bg-green-100 text-green-800'
                            : factura.estado === 'Rechazada'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {factura.estado}
                      </span>
                      {factura.mensajeError && (
                        <div className="text-xs text-red-600 mt-1">
                          {factura.mensajeError}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          factura.ambiente === 'Pruebas'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {factura.ambiente}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleVerDetalles(factura.id)}
                        className="text-primary hover:text-blue-700 mr-3"
                      >
                        Ver
                      </button>
                      {factura.estado === 'Rechazada' && (
                        <button
                          onClick={() => handleReintentarFactura(factura.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Reintentar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
