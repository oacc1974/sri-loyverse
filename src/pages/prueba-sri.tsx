import { useState, useEffect } from 'react';
import { Configuracion } from '../models/configuracion';
import axios from 'axios';

// Definir la interfaz para la factura
interface Factura {
  facturaId: string;
  loyverseId: string;
  estado: string;
  // Añadir otros campos según sea necesario
}

export default function PruebaSRI() {
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
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
        } else {
          // Si no hay configuración, crear una configuración por defecto para editar
          setConfiguracion({
            loyverseToken: '',
            ruc: '9999999999999',
            razonSocial: 'EMPRESA DE PRUEBA',
            nombreComercial: 'EMPRESA DE PRUEBA',
            direccion: 'DIRECCIÓN DE PRUEBA',
            telefono: '',
            email: 'prueba@ejemplo.com',
            impuestoIVA: '12',
            ambiente: 'pruebas',
            automatizacion: false,
            intervaloMinutos: '15',
            certificadoBase64: '',
            claveCertificado: ''
          });
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        setError('Error al cargar configuración. Se creará una nueva.');
        // Si hay error, crear una configuración por defecto
        setConfiguracion({
          loyverseToken: '',
          ruc: '9999999999999',
          razonSocial: 'EMPRESA DE PRUEBA',
          nombreComercial: 'EMPRESA DE PRUEBA',
          direccion: 'DIRECCIÓN DE PRUEBA',
          telefono: '',
          email: 'prueba@ejemplo.com',
          impuestoIVA: '12',
          ambiente: 'pruebas',
          automatizacion: false,
          intervaloMinutos: '15',
          certificadoBase64: '',
          claveCertificado: ''
        });
      }
    };

    cargarConfiguracion();
  }, []);
  
  // Guardar configuración en la base de datos
  const guardarConfiguracion = async () => {
    if (!configuracion) {
      setError('No hay configuración para guardar');
      return;
    }
    
    if (!configuracion.certificadoBase64 || !configuracion.claveCertificado) {
      setError('Debes cargar un certificado y proporcionar la clave');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('/api/configuracion', configuracion);
      
      if (response.data.success) {
        setSuccess('Configuración guardada exitosamente');
      } else {
        setError('Error al guardar configuración: ' + response.data.message);
      }
    } catch (error: any) {
      setError(`Error al guardar configuración: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
        setFacturas(response.data.facturas || []);
        setSuccess(`Se cargaron ${response.data.facturas?.length || 0} facturas de Loyverse`);
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
      const factura = facturas.find((f: Factura) => f.facturaId === selectedFactura);
      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      // Enviar a procesar
      const response = await axios.post('/api/factura/procesar', {
        facturaId: factura.facturaId,
        accion: 'proceso_completo',
        ambiente: configuracion.ambiente === 'produccion' ? '2' : '1',
        // Enviar certificado y clave para permitir procesamiento sin configuración guardada
        certificadoBase64: configuracion.certificadoBase64,
        claveCertificado: configuracion.claveCertificado,
        ruc: configuracion.ruc,
        razonSocial: configuracion.razonSocial,
        nombreComercial: configuracion.nombreComercial,
        direccion: configuracion.direccion,
        email: configuracion.email
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prueba de Integración SRI</h1>

      {/* Sección de Configuración */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-bold mb-4">Configuración SRI</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ambiente">
              Ambiente
            </label>
            <select
              id="ambiente"
              name="ambiente"
              value={configuracion?.ambiente || 'pruebas'}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="pruebas">Pruebas</option>
              <option value="produccion">Producción</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="certificado">
              Certificado Digital (.p12/.pfx)
            </label>
            <input
              type="file"
              id="certificado"
              name="certificado"
              accept=".p12,.pfx"
              onChange={handleCertificadoChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {configuracion?.certificadoBase64 && (
              <p className="text-sm text-green-600 mt-1">Certificado cargado</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="claveCertificado">
              Clave del Certificado
            </label>
            <input
              type="password"
              id="claveCertificado"
              name="claveCertificado"
              value={configuracion?.claveCertificado || ''}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ruc">
              RUC
            </label>
            <input
              type="text"
              id="ruc"
              name="ruc"
              value={configuracion?.ruc || ''}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="razonSocial">
              Razón Social
            </label>
            <input
              type="text"
              id="razonSocial"
              name="razonSocial"
              value={configuracion?.razonSocial || ''}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombreComercial">
              Nombre Comercial
            </label>
            <input
              type="text"
              id="nombreComercial"
              name="nombreComercial"
              value={configuracion?.nombreComercial || ''}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="direccion">
              Dirección
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={configuracion?.direccion || ''}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={configuracion?.email || ''}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loyverseToken">
              Token de Loyverse
            </label>
            <input
              type="text"
              id="loyverseToken"
              name="loyverseToken"
              value={configuracion?.loyverseToken || ''}
              onChange={handleConfigChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={guardarConfiguracion}
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Guardar Configuración
          </button>
        </div>
      </div>

      {/* Estado de la configuración */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-2">Configuración Actual</h2>
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
              <option key={factura.facturaId} value={factura.facturaId}>
                {factura.loyverseId} - {factura.estado}
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
