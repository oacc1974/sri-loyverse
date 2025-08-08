import React, { useState, useEffect } from 'react';
import { Configuracion } from '../models/configuracion';
import axios from 'axios';

export default function ConfiguracionPage() {
  const [formData, setFormData] = useState<Configuracion>({
    loyverseToken: '',
    ruc: '',
    razonSocial: '',
    nombreComercial: '',
    direccion: '',
    telefono: '',
    email: '',
    impuestoIVA: '12',
    ambiente: 'pruebas',
    automatizacion: false,
    intervaloMinutos: '15',
    certificadoBase64: '',
    claveCertificado: ''
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([]);
  const [certificadoFile, setCertificadoFile] = useState<File | null>(null);

  // Cargar configuraciones existentes al iniciar
  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      const response = await axios.get('/api/configuracion');
      if (response.data.success) {
        setConfiguraciones(response.data.data);
        
        // Si hay configuraciones, cargar la primera por defecto
        if (response.data.data.length > 0) {
          setFormData(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      setError('Error al cargar configuraciones');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleCertificadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificadoFile(e.target.files[0]);
      
      // Leer el archivo como base64
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const base64 = (event.target.result as string).split(',')[1];
          setFormData({
            ...formData,
            certificadoBase64: base64
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let response;
      
      if (formData.id) {
        // Actualizar configuración existente
        response = await axios.put(`/api/configuracion/${formData.id}`, formData);
      } else {
        // Crear nueva configuración
        response = await axios.post('/api/configuracion', formData);
      }
      
      if (response.data.success) {
        setSuccess(formData.id ? 'Configuración actualizada correctamente' : 'Configuración guardada correctamente');
        cargarConfiguraciones();
      } else {
        setError('Error: ' + response.data.message);
      }
    } catch (error: any) {
      setError(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarConfiguracion = (id: string) => {
    const config = configuraciones.find(c => c.id === id);
    if (config) {
      setFormData(config);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Configuración SRI-Loyverse</h1>
      
      {/* Mensajes de error/éxito */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      
      {/* Configuraciones guardadas */}
      {configuraciones.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Configuraciones Guardadas</h2>
          <select 
            onChange={(e) => seleccionarConfiguracion(e.target.value)}
            value={formData.id || ''}
            className="block w-full p-2 border border-gray-300 rounded"
          >
            <option value="">-- Seleccionar configuración --</option>
            {configuraciones.map((config) => (
              <option key={config.id} value={config.id}>
                {config.nombreComercial} - {config.ruc} ({config.ambiente})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Formulario de configuración */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Datos Generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loyverseToken">
                Token de Loyverse
              </label>
              <input
                type="text"
                id="loyverseToken"
                name="loyverseToken"
                value={formData.loyverseToken}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
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
                value={formData.ruc}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
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
                value={formData.razonSocial}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
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
                value={formData.nombreComercial}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
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
                value={formData.direccion}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="telefono">
                Teléfono
              </label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={formData.telefono || ''}
                onChange={handleInputChange}
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
                value={formData.email}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="impuestoIVA">
                Impuesto IVA (%)
              </label>
              <input
                type="text"
                id="impuestoIVA"
                name="impuestoIVA"
                value={formData.impuestoIVA}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Configuración SRI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ambiente">
                Ambiente
              </label>
              <select
                id="ambiente"
                name="ambiente"
                value={formData.ambiente}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
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
                onChange={handleCertificadoChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                accept=".p12,.pfx"
              />
              {formData.certificadoBase64 && (
                <p className="text-green-500 text-sm mt-1">Certificado cargado</p>
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
                value={formData.claveCertificado || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Automatización</h2>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="automatizacion"
              name="automatizacion"
              checked={formData.automatizacion}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="automatizacion" className="ml-2 text-sm font-medium text-gray-900">
              Habilitar automatización
            </label>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="intervaloMinutos">
              Intervalo (minutos)
            </label>
            <input
              type="text"
              id="intervaloMinutos"
              name="intervaloMinutos"
              value={formData.intervaloMinutos}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={!formData.automatizacion}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Guardando...' : (formData.id ? 'Actualizar Configuración' : 'Guardar Configuración')}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setFormData({
                loyverseToken: '',
                ruc: '',
                razonSocial: '',
                nombreComercial: '',
                direccion: '',
                telefono: '',
                email: '',
                impuestoIVA: '12',
                ambiente: 'pruebas',
                automatizacion: false,
                intervaloMinutos: '15',
                certificadoBase64: '',
                claveCertificado: ''
              });
            }}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Nueva Configuración
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <a href="/prueba-sri" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block">
          Ir a Prueba SRI
        </a>
      </div>
    </div>
  );
}
