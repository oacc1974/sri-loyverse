import React, { useState, useEffect } from 'react';
import { Configuracion } from '../models/configuracion';
import axios from 'axios';

export default function PruebaSRI() {
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [selectedFactura, setSelectedFactura] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Cargar configuración al iniciar
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await axios.get('/api/configuracion');
        if (response.data.success && response.data.data.length > 0) {
          setConfiguracion(response.data.data[0]);
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        setError('Error al cargar configuración. Verifica que exista una configuración guardada.');
      }
    };

    cargarConfiguracion();
  }, []);

  // Cargar facturas de Loyverse
  const cargarFacturasLoyverse = async () => {
    if (!configuracion?.loyverseToken) {
      setError('No hay token de Loyverse configurado');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.get('/api/loyverse/receipts', {
        headers: {
          Authorization: `Bearer ${configuracion.loyverseToken}`
        }
      });
      
      if (response.data.success) {
        setFacturas(response.data.data);
        setSuccess(`Se cargaron ${response.data.data.length} facturas de Loyverse`);
      } else {
        setError('Error al cargar facturas: ' + response.data.message);
      }
    } catch (error: any) {
      setError(`Error al cargar facturas: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Procesar factura seleccionada
  const procesarFactura = async () => {
    if (!selectedFactura) {
      setError('Selecciona una factura para procesar');
      return;
    }

    if (!configuracion?.certificadoBase64 || !configuracion?.claveCertificado) {
      setError('No hay certificado o clave configurados');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResultado(null);
    
    try {
      // Encontrar la factura seleccionada
      const factura = facturas.find(f => f.id === selectedFactura);
      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      // Enviar a procesar
      const response = await axios.post('/api/factura/procesar', {
        factura,
        certificado: configuracion.certificadoBase64,
        clave: configuracion.claveCertificado,
        ambiente: configuracion.ambiente === 'produccion' ? '2' : '1',
        configuracion
      });
      
      if (response.data.success) {
        setResultado(response.data);
        setSuccess('Factura procesada correctamente');
      } else {
        setError('Error al procesar factura: ' + response.data.message);
      }
    } catch (error: any) {
      setError(`Error al procesar factura: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Prueba de Autorización SRI</h1>
      
      {/* Estado de la configuración */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuración</h2>
        {configuracion ? (
          <div>
            <p><strong>RUC:</strong> {configuracion.ruc}</p>
            <p><strong>Razón Social:</strong> {configuracion.razonSocial}</p>
            <p><strong>Ambiente:</strong> {configuracion.ambiente}</p>
            <p><strong>Certificado:</strong> {configuracion.certificadoBase64 ? 'Configurado' : 'No configurado'}</p>
          </div>
        ) : (
          <p className="text-red-500">No hay configuración disponible. Por favor, configura los parámetros primero.</p>
        )}
      </div>

      {/* Mensajes de error/éxito */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Cargar facturas */}
      <div className="mb-6">
        <button 
          onClick={cargarFacturasLoyverse}
          disabled={loading || !configuracion?.loyverseToken}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Cargar Facturas de Loyverse'}
        </button>
      </div>

      {/* Lista de facturas */}
      {facturas.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Facturas Disponibles</h2>
          <select 
            value={selectedFactura} 
            onChange={(e) => setSelectedFactura(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona una factura</option>
            {facturas.map((factura) => (
              <option key={factura.id} value={factura.id}>
                {factura.receipt_number} - {new Date(factura.receipt_date).toLocaleString()} - ${factura.total_money}
              </option>
            ))}
          </select>
          
          <button 
            onClick={procesarFactura}
            disabled={loading || !selectedFactura}
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Procesar Factura Seleccionada'}
          </button>
        </div>
      )}

      {/* Resultado del procesamiento */}
      {resultado && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Resultado del Procesamiento</h2>
          <div className="overflow-auto">
            <pre className="bg-gray-800 text-white p-4 rounded">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
