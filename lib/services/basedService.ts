// Servicio para interactuar con Based API (app.based.one)

import { TradingPair, TradingOrder, OrderSide, StrategyType } from '../types/trading';

const BASED_API_BASE = 'https://api.based.one'; // Ajustar según la API real

export class BasedService {
  private accessToken: string | null = null;

  /**
   * Establece el token de acceso (desde OAuth)
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Autentica con Based API (legacy - usar OAuth en su lugar)
   * @deprecated Usar setAccessToken con token OAuth en su lugar
   */
  async authenticate(_apiKey: string, _apiSecret: string): Promise<boolean> {
    // Método legacy - ya no se usa. La autenticación se hace con OAuth
    // y el token se establece con setAccessToken
    console.warn('authenticate() es un método legacy. Usar setAccessToken() con token OAuth.');
    return false;
  }

  /**
   * Obtiene el balance de la cuenta
   */
  async getBalance(): Promise<number> {
    // En desarrollo o si no hay token, retornar balance simulado
    if (process.env.NODE_ENV === 'development' || !this.accessToken) {
      return 10000; // $10,000 simulado
    }

    try {
      const response = await fetch(`${BASED_API_BASE}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.balance || 0;
      }

      // Si falla, retornar valor por defecto en lugar de lanzar error
      console.warn('No se pudo obtener balance de Based, usando valor por defecto');
      return 10000; // $10,000 por defecto
    } catch (error) {
      // Silenciar el error y retornar valor por defecto
      // Los errores de red son esperados si la API no está disponible
      console.warn('Error obteniendo balance de Based, usando valor por defecto:', error);
      return 10000; // $10,000 por defecto
    }
  }

  /**
   * Crea una orden en Based
   */
  async createOrder(
    pair: TradingPair,
    side: OrderSide,
    quantity: number,
    leverage: number,
    price?: number,
    strategy: StrategyType = 'momentum'
  ): Promise<TradingOrder> {
    if (!this.accessToken) {
      throw new Error('No autenticado con Based');
    }

    try {
      const response = await fetch(`${BASED_API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          pair,
          side,
          quantity,
          leverage,
          price, // Si es undefined, será orden de mercado
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.orderId || `order-${Date.now()}`,
          pair,
          side,
          entryPrice: data.price || price || 0,
          currentPrice: data.price || price || 0,
          quantity,
          leverage,
          status: 'open',
          strategy,
          createdAt: Date.now(),
        };
      }

      throw new Error('Error creando orden');
    } catch (error) {
      console.error('Error creando orden:', error);
      throw error;
    }
  }

  /**
   * Cierra una orden
   */
  async closeOrder(orderId: string): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('No autenticado con Based');
    }

    try {
      const response = await fetch(`${BASED_API_BASE}/orders/${orderId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error cerrando orden:', error);
      return false;
    }
  }

  /**
   * Obtiene el precio actual de un par
   */
  async getPrice(pair: TradingPair): Promise<number> {
    try {
      const response = await fetch(`${BASED_API_BASE}/prices/${pair}`, {
        headers: {
          ...(this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.price || 0;
      }

      throw new Error('Error obteniendo precio');
    } catch (error) {
      console.error('Error obteniendo precio:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de órdenes
   */
  async getOrderHistory(limit: number = 50): Promise<TradingOrder[]> {
    if (!this.accessToken) {
      throw new Error('No autenticado con Based');
    }

    try {
      const response = await fetch(`${BASED_API_BASE}/orders?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.orders || [];
      }

      return [];
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Verifica si está autenticado
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Cierra la sesión
   */
  logout() {
    this.accessToken = null;
  }
}

export const basedService = new BasedService();

