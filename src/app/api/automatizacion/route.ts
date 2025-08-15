import { NextRequest, NextResponse } from 'next/server';
import { AutomatizacionService } from '@/services/automatizacionService';
import { ValidacionService } from '@/services/validacionService';
import { Configuracion } from '@/models/configuracion';

// Instancia global del servicio de automatización
let automatizacionService: AutomatizacionService | null = null;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { accion, configuracion } = data;

    // Validar configuración
    const validacionService = new ValidacionService();
    const validacionResult = validacionService.validarConfiguracion(configuracion);

    if (!validacionResult.valido) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Configuración inválida', 
          errores: validacionResult.errores 
        },
        { status: 400 }
      );
    }

    // Inicializar o actualizar servicio de automatización
    if (!automatizacionService) {
      automatizacionService = new AutomatizacionService(configuracion);
    } else {
      automatizacionService.actualizarConfiguracion(configuracion);
    }

    // Procesar la acción solicitada
    switch (accion) {
      case 'iniciar':
        automatizacionService.iniciarAutomatizacion();
        return NextResponse.json({
          success: true,
          message: `Automatización iniciada con intervalo de ${configuracion.intervaloMinutos} minutos`
        });

      case 'detener':
        automatizacionService.detenerAutomatizacion();
        return NextResponse.json({
          success: true,
          message: 'Automatización detenida correctamente'
        });

      case 'ejecutar_manual':
        const facturas = await automatizacionService.ejecutarProcesoManual();
        return NextResponse.json({
          success: true,
          message: `Proceso manual completado. Se procesaron ${facturas.length} facturas`,
          facturas
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Acción no reconocida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en API de automatización:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al procesar la solicitud', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verificar si la automatización está activa
    const estado = automatizacionService ? 'activo' : 'inactivo';
    
    return NextResponse.json({
      success: true,
      estado
    });
  } catch (error) {
    console.error('Error al obtener estado de automatización:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al obtener estado', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
