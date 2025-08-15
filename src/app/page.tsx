import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Loyverse-SRI Integración</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de integración directa entre Loyverse y SRI para facturación electrónica
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-primary mb-4">Configuración</h2>
            <p className="text-gray-600 mb-6">
              Configure los parámetros de integración, suba su certificado digital y gestione sus datos fiscales.
            </p>
            <Link href="/configuracion" className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Ir a Configuración
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-primary mb-4">Dashboard de Facturas</h2>
            <p className="text-gray-600 mb-6">
              Gestione sus facturas electrónicas, verifique su estado y exporte reportes.
            </p>
            <Link href="/dashboard" className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Ir al Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-primary mb-4">Características Principales</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            <div className="p-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Integración Directa</h3>
              <p className="text-gray-600">Conexión directa entre Loyverse y SRI sin intermediarios.</p>
            </div>
            <div className="p-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Firma Digital</h3>
              <p className="text-gray-600">Firma electrónica segura de facturas con certificado digital.</p>
            </div>
            <div className="p-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Automatización</h3>
              <p className="text-gray-600">Proceso automático de facturación electrónica cada 15 minutos.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
