import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define los tipos aquí en lugar de importarlos
interface Configuracion {
  _id?: string;
  ambiente: string;
  certificadoBase64?: string;
  claveCertificado?: string;
  ruc?: string;
  razonSocial?: string;
  nombreComercial?: string;
  direccion?: string;
  email?: string;
}

interface Cliente {
  nombre?: string;
  identificacion?: string;
  email?: string;
  direccion?: string;
}

interface Factura {
  _id?: string;
  facturaId: string;
  cliente?: Cliente;
  total?: number;
  fecha?: string;
  estado?: string;
}

const PruebaSRI: React.FC = () => {
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [selectedFactura, setSelectedFactura] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  
  // Manejar cambios en los campos de configuración
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Manejar checkbox (automatización)
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfiguracion(prev => prev ? {...prev, [name]: checked} : null);
    } else {
      setConfiguracion(prev => prev ? {...prev, [name]: value} : null);
    }
  };
  
  // Manejar carga de certificado
  const handleCertificadoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const base64 = event.target.result.toString().split(',')[1];
          setConfiguracion(prev => prev ? {...prev, certificadoBase64: base64} : null);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Cargar configuración al iniciar
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await axios.get('/api/configuracion');
        if (response.data && response.data.length > 0) {
          // Usar la configuración más reciente
          setConfiguracion(response.data[0]);
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    };

    cargarConfiguracion();
  }, []);

  // Cargar facturas al iniciar
  useEffect(() => {
    const cargarFacturas = async () => {
      try {
        const response = await axios.get('/api/factura');
        if (response.data && response.data.length > 0) {
          setFacturas(response.data);
        }
      } catch (error) {
        console.error('Error al cargar facturas:', error);
      }
    };

    cargarFacturas();
  }, []);

  // Guardar configuración
  const guardarConfiguracion = async () => {
    if (!configuracion) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (configuracion._id) {
        // Actualizar configuración existente
        response = await axios.put(`/api/configuracion/${configuracion._id}`, configuracion);
      } else {
        // Crear nueva configuración
        response = await axios.post('/api/configuracion', configuracion);
      }
      
      if (response.data) {
        setConfiguracion(response.data);
        setSuccess('Configuración guardada correctamente');
      }
    } catch (error: any) {
      setError(`Error al guardar configuración: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Importar facturas desde Loyverse
  const importarFacturas = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get('/api/loyverse/receipts');
      if (response.data && response.data.length > 0) {
        setFacturas(response.data);
        setSuccess(`Se importaron ${response.data.length} facturas desde Loyverse`);
      } else {
        setSuccess('No se encontraron nuevas facturas para importar');
      }
    } catch (error: any) {
      setError(`Error al importar facturas: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Procesar factura seleccionada
  const procesarFactura = async () => {
    if (!selectedFactura) {
      setError('Debe seleccionar una factura');
      return;
    }

    if (!configuracion) {
      setError('Debe configurar los parámetros SRI primero');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
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
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={guardarConfiguracion}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Sección de Facturas */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-bold mb-4">Facturas</h2>

        <div className="flex items-center justify-between mb-4">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={importarFacturas}
            disabled={loading}
          >
            {loading ? 'Importando...' : 'Importar desde Loyverse'}
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="factura">
            Seleccionar Factura
          </label>
          <select
            id="factura"
            name="factura"
            value={selectedFactura}
            onChange={(e) => setSelectedFactura(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Seleccione una factura</option>
            {facturas.map((factura) => (
              <option key={factura.facturaId} value={factura.facturaId}>
                {factura.facturaId} - {factura.cliente?.nombre || 'Cliente Final'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={procesarFactura}
            disabled={loading || !selectedFactura}
          >
            {loading ? 'Procesando...' : 'Procesar Factura'}
          </button>
        </div>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}

      {/* Resultados */}
      {resultado && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4">Resultado del Procesamiento</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
      {/* Indicador de hora de actualización */}
      <div className="fixed bottom-2 right-2 text-xs text-gray-500">
        Última actualización: 13/08/2025 13:45
      </div>
    </div>
  );
};

export default PruebaSRI;
