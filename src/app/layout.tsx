import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Loyverse-SRI Integración',
  description: 'Sistema de integración entre Loyverse y SRI para facturación electrónica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <header className="bg-primary text-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="font-bold text-xl">Loyverse-SRI</div>
            <nav>
              <ul className="flex space-x-6">
                <li><a href="/" className="hover:text-blue-200 transition-colors">Inicio</a></li>
                <li><a href="/configuracion" className="hover:text-blue-200 transition-colors">Configuración</a></li>
                <li><a href="/dashboard" className="hover:text-blue-200 transition-colors">Dashboard</a></li>
              </ul>
            </nav>
          </div>
        </header>
        {children}
        <footer className="bg-gray-100 border-t">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-gray-600">
              <p>© {new Date().getFullYear()} Loyverse-SRI Integración. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
