'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfiguracionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
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
  });
  const [certificado, setCertificado] = useState<File | null>(null);
  const [claveCertificado, setClaveCertificado] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificado(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Aquí se implementará la lógica para guardar la configuración
      // Se enviará a la API los datos del formulario y el certificado

      // Simulación de guardado exitoso
      setTimeout(() => {
        setIsLoading(false);
        setMensaje({ 
          tipo: 'success', 
          texto: 'Configuración guardada correctamente' 
        });
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error al guardar la configuración. Por favor, inténtelo de nuevo.' 
      });
      console.error('Error al guardar la configuración:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Configuración</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'general'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('certificado')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'certificado'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              Certificado Digital
            </button>
            <button
              onClick={() => setActiveTab('automatizacion')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'automatizacion'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              Automatización
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Mensaje de éxito o error */}
          {mensaje.texto && (
            <div
              className={`mb-6 p-4 rounded-md ${
                mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          {/* Tab: General */}
          {activeTab === 'general' && (
            <div>
              <div className="mb-6">
                <label htmlFor="loyverseToken" className="form-label">
                  Token de Loyverse
                </label>
                <input
                  type="text"
                  id="loyverseToken"
                  name="loyverseToken"
                  value={formData.loyverseToken}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ingrese su token de API de Loyverse"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Puede obtener su token en la configuración de su cuenta Loyverse.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Datos del Contribuyente</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ruc" className="form-label">
                      RUC
                    </label>
                    <input
                      type="text"
                      id="ruc"
                      name="ruc"
                      value={formData.ruc}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ingrese su RUC"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="razonSocial" className="form-label">
                      Razón Social
                    </label>
                    <input
                      type="text"
                      id="razonSocial"
                      name="razonSocial"
                      value={formData.razonSocial}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ingrese su razón social"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="nombreComercial" className="form-label">
                      Nombre Comercial
                    </label>
                    <input
                      type="text"
                      id="nombreComercial"
                      name="nombreComercial"
                      value={formData.nombreComercial}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ingrese su nombre comercial"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="direccion" className="form-label">
                      Dirección
                    </label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ingrese su dirección"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="form-label">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ingrese su teléfono"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Ingrese su email"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Configuración de Impuestos</h3>
                <div>
                  <label htmlFor="impuestoIVA" className="form-label">
                    Porcentaje de IVA
                  </label>
                  <select
                    id="impuestoIVA"
                    name="impuestoIVA"
                    value={formData.impuestoIVA}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="12">12%</option>
                    <option value="15">15%</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Ambiente</h3>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="ambiente"
                      value="pruebas"
                      checked={formData.ambiente === 'pruebas'}
                      onChange={handleInputChange}
                      className="form-radio h-5 w-5 text-primary"
                    />
                    <span className="ml-2">Pruebas</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="ambiente"
                      value="produccion"
                      checked={formData.ambiente === 'produccion'}
                      onChange={handleInputChange}
                      className="form-radio h-5 w-5 text-primary"
                    />
                    <span className="ml-2">Producción</span>
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.ambiente === 'pruebas'
                    ? 'En modo pruebas, las facturas no tendrán validez fiscal.'
                    : 'En modo producción, las facturas tendrán validez fiscal.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab: Certificado Digital */}
          {activeTab === 'certificado' && (
            <div>
              <div className="mb-6">
                <label htmlFor="certificado" className="form-label">
                  Certificado Digital (.p12/.pfx)
                </label>
                <div className="flex items-center">
                  <input
                    type="file"
                    id="certificado"
                    accept=".p12,.pfx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="certificado"
                    className="cursor-pointer bg-gray-100 border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-200 transition-colors"
                  >
                    Seleccionar archivo
                  </label>
                  <span className="ml-3 text-gray-600">
                    {certificado ? certificado.name : 'Ningún archivo seleccionado'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Suba su certificado digital en formato .p12 o .pfx.
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="claveCertificado" className="form-label">
                  Clave del Certificado
                </label>
                <input
                  type="password"
                  id="claveCertificado"
                  value={claveCertificado}
                  onChange={(e) => setClaveCertificado(e.target.value)}
                  className="form-input"
                  placeholder="Ingrese la clave de su certificado digital"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esta clave se utilizará para acceder a su certificado digital.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Automatización */}
          {activeTab === 'automatizacion' && (
            <div>
              <div className="mb-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="automatizacion"
                    checked={formData.automatizacion as boolean}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-primary"
                  />
                  <span className="ml-2 font-medium">Habilitar proceso automático</span>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Al habilitar esta opción, el sistema generará y enviará facturas automáticamente al SRI.
                </p>
              </div>

              {formData.automatizacion && (
                <div className="mb-6">
                  <label htmlFor="intervaloMinutos" className="form-label">
                    Intervalo de sincronización (minutos)
                  </label>
                  <select
                    id="intervaloMinutos"
                    name="intervaloMinutos"
                    value={formData.intervaloMinutos}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary mr-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
