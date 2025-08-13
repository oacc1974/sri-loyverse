import React, { useState, useEffect } from 'react';
import { Configuracion } from '../models/configuracion';
import axios from 'axios';

// Definir la interfaz para la factura
interface Factura {
  facturaId: string;
  loyverseId: string;
  estado: string;
  xmlFirmado?: string;
  xmlSinFirma?: string;
  respuestaSRI?: any;
  mensajeError?: string;
  // Añadir otros campos según sea necesario
}

export default function PruebaSRI() {
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [selectedFactura, setSelectedFactura] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'firmado' | 'sinFirma'>('firmado');
  
  // Manejar cambios en los campos de configuración
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Manejar checkbox (automatización)
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfiguracion((prev: any) => prev ? {...prev, [name]: checked} : null);
    } else {
      setConfiguracion((prev: any) => prev ? {...prev, [name]: value} : null);
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

      // Preparar los datos de la factura asegurando que los campos estén correctamente asignados
      const facturaData = {
        facturaId: factura.facturaId,
        accion: 'proceso_completo',
        ambiente: configuracion.ambiente === 'produccion' ? '2' : '1',
        // Enviar certificado y clave para permitir procesamiento sin configuración guardada
        certificadoBase64: configuracion.certificadoBase64,
        claveCertificado: configuracion.claveCertificado,
        // IMPORTANTE: Asegurar que los campos ruc y razonSocial estén correctamente asignados
        // El RUC debe ser el número de identificación fiscal (ej: 9999999999999)
        // La razón social debe ser el nombre de la empresa o persona (ej: EMPRESA DE PRUEBA)
        ruc: configuracion.ruc,
        razonSocial: configuracion.razonSocial,
        nombreComercial: configuracion.nombreComercial,
        direccion: configuracion.direccion,
        email: configuracion.email
      };
      
      // Enviar a procesar
      const response = await axios.post('/api/factura/procesar', facturaData);
      
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
      <div className="fixed bottom-2 right-2 text-xs text-gray-500">
        Última actualización: 2025-08-13 14:05
      </div>

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
          
          {/* Mostrar estado de la factura con color según el estado */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Estado de la Factura:</h3>
            <div className={`mt-2 px-4 py-2 rounded-md inline-block font-bold ${
              resultado.data?.estado === 'RECHAZADA' ? 'bg-red-100 text-red-800' : 
              resultado.data?.estado === 'AUTORIZADA' ? 'bg-green-100 text-green-800' : 
              resultado.data?.estado === 'ENVIADO' ? 'bg-blue-100 text-blue-800' :
              resultado.data?.estado === 'FIRMADO' ? 'bg-purple-100 text-purple-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {resultado.data?.estado || 'PROCESANDO'}
            </div>
            
            {/* Flujo de estados */}
            <div className="mt-4 border-t pt-3">
              <h4 className="font-semibold text-sm mb-2">Flujo de estados:</h4>
              <div className="flex items-center space-x-2 text-xs">
                <div className={`px-2 py-1 rounded ${resultado.data?.estado === 'PENDIENTE' || ['FIRMADO', 'ENVIADO', 'AUTORIZADA', 'RECHAZADA'].includes(resultado.data?.estado) ? 'bg-green-100' : 'bg-gray-100'}`}>PENDIENTE</div>
                <div className="text-gray-400">→</div>
                <div className={`px-2 py-1 rounded ${resultado.data?.estado === 'FIRMADO' || ['ENVIADO', 'AUTORIZADA', 'RECHAZADA'].includes(resultado.data?.estado) ? 'bg-green-100' : 'bg-gray-100'}`}>FIRMADO</div>
                <div className="text-gray-400">→</div>
                <div className={`px-2 py-1 rounded ${resultado.data?.estado === 'ENVIADO' || ['AUTORIZADA', 'RECHAZADA'].includes(resultado.data?.estado) ? 'bg-green-100' : 'bg-gray-100'}`}>ENVIADO</div>
                <div className="text-gray-400">→</div>
                <div className={`px-2 py-1 rounded ${resultado.data?.estado === 'AUTORIZADA' ? 'bg-green-100' : resultado.data?.estado === 'RECHAZADA' ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {resultado.data?.estado === 'AUTORIZADA' ? 'AUTORIZADA' : resultado.data?.estado === 'RECHAZADA' ? 'RECHAZADA' : 'PENDIENTE'}
                </div>
              </div>
            </div>
            
            {resultado.data?.numeroAutorizacion && (
              <div className="mt-2">
                <span className="font-semibold">Número de Autorización:</span> {resultado.data.numeroAutorizacion}
              </div>
            )}
            {resultado.data?.fechaAutorizacion && (
              <div className="mt-1">
                <span className="font-semibold">Fecha de Autorización:</span> {resultado.data.fechaAutorizacion}
              </div>
            )}
            
            {/* Mostrar mensaje de error detallado si la factura fue rechazada */}
            {resultado.data?.estado === 'RECHAZADA' && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                <h4 className="font-bold text-red-700">Motivo del rechazo:</h4>
                {resultado.data?.mensajeError ? (
                  <p className="text-red-700 mt-1">{resultado.data.mensajeError}</p>
                ) : (
                  <p className="text-red-700 mt-1">El SRI rechazó la factura. Revise los detalles en la respuesta completa.</p>
                )}
                
                {/* Mostrar errores específicos de la respuesta SRI si existen */}
                {resultado.data?.respuestaSRI?.comprobantes?.comprobante?.mensajes?.mensaje && (
                  <div className="mt-2 pl-4 border-l-2 border-red-300">
                    <h5 className="font-semibold text-red-700">Detalles del SRI:</h5>
                    <ul className="list-disc pl-5 text-sm">
                      {Array.isArray(resultado.data.respuestaSRI.comprobantes.comprobante.mensajes.mensaje) ? 
                        resultado.data.respuestaSRI.comprobantes.comprobante.mensajes.mensaje.map((msg: any, idx: number) => (
                          <li key={idx} className="mt-1">
                            <span className="font-medium">{msg.tipo} {msg.identificador}:</span> {msg.mensaje}
                            {msg.informacionAdicional && <div className="text-xs mt-1 pl-2">Info adicional: {msg.informacionAdicional}</div>}
                          </li>
                        )) : (
                          <li className="mt-1">
                            <span className="font-medium">
                              {resultado.data.respuestaSRI.comprobantes.comprobante.mensajes.mensaje.tipo} 
                              {resultado.data.respuestaSRI.comprobantes.comprobante.mensajes.mensaje.identificador}:
                            </span> 
                            {resultado.data.respuestaSRI.comprobantes.comprobante.mensajes.mensaje.mensaje}
                            {resultado.data.respuestaSRI.comprobantes.comprobante.mensajes.mensaje.informacionAdicional && 
                              <div className="text-xs mt-1 pl-2">
                                Info adicional: {resultado.data.respuestaSRI.comprobantes.comprobante.mensajes.mensaje.informacionAdicional}
                              </div>
                            }
                          </li>
                        )
                      }
                    </ul>
                  </div>
                )}
                
                <div className="mt-3 text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                  <strong>Sugerencia:</strong> Revise el XML generado a continuación para identificar posibles problemas de formato o datos incorrectos.
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-auto mb-4">
            <h3 className="text-lg font-semibold mb-2">Detalles de la Respuesta:</h3>
            <pre className="bg-gray-800 text-white p-4 rounded">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
          
          {/* Mostrar XML siempre, no solo cuando es rechazada */}
          <div className="mt-4">
              <h3 className={`text-lg font-semibold mb-2 ${resultado.data?.estado === 'RECHAZADA' ? 'text-red-600' : resultado.data?.estado === 'AUTORIZADA' ? 'text-green-600' : 'text-blue-600'}`}>
                XML Generado - {resultado.data?.estado || 'PROCESANDO'}
              </h3>
              <p className="mb-2 text-sm">
                {resultado.data?.estado === 'RECHAZADA' 
                  ? 'Este es el XML que fue enviado al SRI y fue rechazado. Revise el formato y los datos para identificar el problema.'
                  : resultado.data?.estado === 'AUTORIZADA'
                    ? 'Este es el XML que fue enviado al SRI y fue autorizado correctamente.'
                    : 'Este es el XML que fue generado y enviado al SRI. Pendiente de autorización.'}
              </p>
              <p className="mb-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                <strong>Nota:</strong> El XML se regenera completamente cada vez que se procesa la factura, asegurando que se apliquen todas las correcciones.
              </p>
              
              {/* Pestañas para alternar entre XML firmado y sin firmar */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  <button 
                    onClick={() => setActiveTab('firmado')}
                    className={`${activeTab === 'firmado' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                  >
                    XML Firmado
                  </button>
                  <button 
                    onClick={() => setActiveTab('sinFirma')}
                    className={`${activeTab === 'sinFirma' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                  >
                    XML Sin Firma
                  </button>
                </nav>
              </div>
              
              {/* Mostrar XML según la pestaña activa */}
              {activeTab === 'firmado' && resultado.data?.xmlFirmado && (
                <div className="overflow-auto max-h-96">
                  <pre className="bg-gray-800 text-white p-4 rounded">
                    {resultado.data.xmlFirmado}
                  </pre>
                </div>
              )}
              
              {activeTab === 'sinFirma' && resultado.data?.xmlSinFirma && (
                <div className="overflow-auto max-h-96">
                  <pre className="bg-gray-800 text-white p-4 rounded">
                    {resultado.data.xmlSinFirma}
                  </pre>
                </div>
              )}
              
              {/* Mostrar mensaje si no hay XML disponible para la pestaña seleccionada */}
              {activeTab === 'firmado' && !resultado.data?.xmlFirmado && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  No hay XML firmado disponible para esta factura.
                </div>
              )}
              
              {activeTab === 'sinFirma' && !resultado.data?.xmlSinFirma && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  No hay XML sin firma disponible para esta factura.
                </div>
              )}
              
              {/* Mostrar mensajes de error del SRI */}
              {resultado.data?.respuestaSRI?.mensajes && (
                <div className="mt-4">
                  <h4 className="font-semibold text-red-600">Mensajes del SRI:</h4>
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(resultado.data.respuestaSRI.mensajes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Mostrar mensaje de error general si existe */}
              {resultado.data.mensajeError && (
                <div className="mt-2">
                  <h4 className="font-semibold text-red-600">Mensaje de Error:</h4>
                  <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {resultado.data.mensajeError}
                  </p>
                </div>
              )}
            </div>
        </div>
      )}
      {/* Indicador de hora de actualización */}
      <div className="fixed bottom-2 right-2 text-xs text-gray-500">
        Última actualización: 13/08/2025 13:45
      </div>
    </div>
  );
}
