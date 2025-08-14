import axios from 'axios';
import { Factura } from '../models/factura';

export interface LoyverseReceipt {
  id: string;
  receipt_number: string;
  receipt_type: string;
  created_at: string;
  updated_at: string;
  store_id: string;
  customer_id: string;
  employee_id: string;
  pos_device_id: string;
  total_money: {
    amount: number;
    currency: string;
  };
  total_tax: {
    amount: number;
    currency: string;
  };
  points_earned: number;
  points_used: number;
  points_balance: number;
  items: LoyverseReceiptItem[];
  payments: LoyversePayment[];
  customer?: LoyverseCustomer;
}

export interface LoyverseReceiptItem {
  id: string;
  line: number;
  item_id: string;
  item_name: string;
  variant_id: string;
  variant_name: string;
  modifiers: LoyverseModifier[];
  quantity: number;
  price: {
    amount: number;
    currency: string;
  };
  gross_price: {
    amount: number;
    currency: string;
  };
  discount: {
    amount: number;
    currency: string;
  };
  tax: {
    amount: number;
    currency: string;
  };
  tax_rate: number;
  taxes: LoyverseTax[];
  total: {
    amount: number;
    currency: string;
  };
  cost: {
    amount: number;
    currency: string;
  };
  note: string;
}

export interface LoyverseModifier {
  id: string;
  name: string;
  option_id: string;
  option_name: string;
  price: {
    amount: number;
    currency: string;
  };
}

export interface LoyverseTax {
  id: string;
  name: string;
  rate: number;
  amount: {
    amount: number;
    currency: string;
  };
}

export interface LoyversePayment {
  id: string;
  type: string;
  amount: {
    amount: number;
    currency: string;
  };
  paid_at: string;
  payment_details: {
    card_type?: string;
    card_number?: string;
    reference?: string;
  };
}

export interface LoyverseCustomer {
  id: string;
  customer_code: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  note: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export class LoyverseService {
  private baseUrl: string;
  private token: string;

  constructor(token: string) {
    this.baseUrl = 'https://api.loyverse.com/v1.0';
    this.token = token;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Obtiene las facturas (receipts) de Loyverse
   * @param desde Fecha desde la cual obtener las facturas (formato ISO)
   * @param hasta Fecha hasta la cual obtener las facturas (formato ISO)
   * @param limit Límite de resultados (máximo 250)
   * @param cursor Cursor para paginación
   */
  async getReceipts(desde?: string, hasta?: string, limit: number = 100, cursor?: string): Promise<{ receipts: LoyverseReceipt[], cursor?: string }> {
    try {
      let url = `${this.baseUrl}/receipts?limit=${limit}`;
      
      if (desde) {
        url += `&created_at_min=${desde}`;
      }
      
      if (hasta) {
        url += `&created_at_max=${hasta}`;
      }
      
      if (cursor) {
        url += `&cursor=${cursor}`;
      }
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      return {
        receipts: response.data.receipts,
        cursor: response.data.cursor
      };
    } catch (error) {
      console.error('Error al obtener facturas de Loyverse:', error);
      throw new Error('Error al obtener facturas de Loyverse');
    }
  }

  /**
   * Obtiene una factura (receipt) específica de Loyverse
   * @param receiptId ID de la factura en Loyverse
   */
  async getReceipt(receiptId: string): Promise<LoyverseReceipt> {
    try {
      const response = await axios.get(`${this.baseUrl}/receipts/${receiptId}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error al obtener factura ${receiptId} de Loyverse:`, error);
      throw new Error(`Error al obtener factura ${receiptId} de Loyverse`);
    }
  }

  /**
   * Obtiene un cliente específico de Loyverse
   * @param customerId ID del cliente en Loyverse
   */
  async getCustomer(customerId: string): Promise<LoyverseCustomer> {
    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error al obtener cliente ${customerId} de Loyverse:`, error);
      throw new Error(`Error al obtener cliente ${customerId} de Loyverse`);
    }
  }

  /**
   * Convierte una factura de Loyverse al formato requerido por el SRI
   * @param loyverseReceipt Factura de Loyverse
   */
  mapToSRIFactura(loyverseReceipt: LoyverseReceipt): Partial<Factura> {
    // Verificar que la factura tenga un cliente asociado
    if (!loyverseReceipt.customer) {
      throw new Error('La factura no tiene un cliente asociado');
    }

    // Verificar que el cliente tenga un código de cliente (RUC)
    if (!loyverseReceipt.customer.customer_code) {
      throw new Error('El cliente no tiene un RUC asociado');
    }

    // Extraer fecha en formato YYYY-MM-DD
    const fechaEmision = loyverseReceipt.created_at.split('T')[0];

    // Mapear los detalles de los productos
    const detalles = loyverseReceipt.items.map((item, index) => {
      const precioUnitario = item.price.amount;
      const cantidad = item.quantity;
      const descuento = item.discount.amount;
      const precioTotalSinImpuesto = item.gross_price.amount - item.tax.amount;
      
      return {
        codigo: item.item_id,
        descripcion: item.item_name + (item.variant_name ? ` - ${item.variant_name}` : ''),
        cantidad,
        precioUnitario,
        descuento,
        precioTotalSinImpuesto,
        impuestos: [{
          codigo: '2', // IVA (este código siempre es 2 para IVA)
          codigoPorcentaje: Math.round(item.tax_rate).toString(), // Usar directamente el porcentaje como código
          tarifa: item.tax_rate, // Usar la tasa real del impuesto
          baseImponible: precioTotalSinImpuesto,
          valor: item.tax.amount
        }]
      };
    });

    // Calcular totales
    const totalSinImpuestos = loyverseReceipt.items.reduce((total, item) => 
      total + (item.gross_price.amount - item.tax.amount), 0);
    
    const totalImpuesto = loyverseReceipt.total_tax.amount;
    const totalDescuento = loyverseReceipt.items.reduce((total, item) => 
      total + item.discount.amount, 0);
    const importeTotal = loyverseReceipt.total_money.amount;

    // Crear la estructura de la factura para el SRI
    return {
      loyverseId: loyverseReceipt.id,
      ambiente: '2', // Por defecto producción, se ajustará según configuración
      tipoEmision: '1', // Emisión normal
      razonSocial: '', // Se completará con la configuración
      nombreComercial: '', // Se completará con la configuración
      ruc: '', // Se completará con la configuración
      codDoc: '01', // Factura
      estab: '001', // Se puede ajustar según configuración
      ptoEmi: '001', // Se puede ajustar según configuración
      secuencial: loyverseReceipt.receipt_number.replace(/\D/g, '').padStart(9, '0'), // Extraer solo números
      dirMatriz: '', // Se completará con la configuración
      fechaEmision,
      dirEstablecimiento: '', // Se completará con la configuración
      contribuyenteEspecial: 'NO',
      obligadoContabilidad: 'SI', // Se puede ajustar según configuración
      tipoIdentificacionComprador: '04', // 04 para RUC
      cliente: {
        ruc: loyverseReceipt.customer.customer_code,
        razonSocial: loyverseReceipt.customer.name,
        direccion: loyverseReceipt.customer.address || '',
        telefono: loyverseReceipt.customer.phone_number || '',
        email: loyverseReceipt.customer.email || ''
      },
      totalSinImpuestos,
      totalDescuento,
      totalConImpuestos: [{
        codigo: '2', // IVA (este código siempre es 2 para IVA)
        codigoPorcentaje: Math.round(loyverseReceipt.items[0]?.tax_rate || 0).toString(), // Usar directamente el porcentaje como código
        baseImponible: totalSinImpuestos,
        valor: totalImpuesto
      }],
      propina: 0,
      importeTotal,
      moneda: 'DOLAR',
      detalles,
      infoAdicional: [
        {
          nombre: 'Email',
          valor: loyverseReceipt.customer.email || 'N/A'
        },
        {
          nombre: 'Teléfono',
          valor: loyverseReceipt.customer.phone_number || 'N/A'
        }
      ],
      estado: 'Pendiente'
    };
  }
}
