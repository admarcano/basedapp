// Servicio para obtener precios de criptomonedas
// Usa CoinGecko API (gratuita) para datos de precios

import { TradingPair } from '../types/trading';

export interface PriceResponse {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
  };
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Mapeo de símbolos a IDs de CoinGecko
const SYMBOL_TO_ID: Record<string, string> = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
  'XRP/USD': 'ripple',
  'HYPE/USD': 'hyperliquid', // Ajustar si el ID es diferente
};

export class PriceService {
  private cache: Map<string, { price: number; timestamp: number }> = new Map();
  private cacheTTL = 5000; // 5 segundos

  /**
   * Obtiene el precio actual de un par de trading
   */
  async getPrice(pair: string): Promise<number> {
    const cacheKey = pair;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.price;
    }

    try {
      const coinId = SYMBOL_TO_ID[pair];
      if (!coinId) {
        throw new Error(`Par no soportado: ${pair}`);
      }

      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      );

      if (!response.ok) {
        throw new Error(`Error al obtener precio: ${response.statusText}`);
      }

      const data: PriceResponse = await response.json();
      const price = data[coinId]?.usd;

      if (!price) {
        throw new Error('Precio no encontrado');
      }

      // Actualizar cache
      this.cache.set(cacheKey, { price, timestamp: Date.now() });

      return price;
    } catch (error) {
      console.error('Error en PriceService.getPrice:', error);
      // Retornar precio cacheado si existe, o lanzar error
      if (cached) {
        return cached.price;
      }
      throw error;
    }
  }

  /**
   * Obtiene múltiples precios a la vez
   */
  async getPrices(pairs: TradingPair[]): Promise<Map<TradingPair, number>> {
    const prices = new Map<TradingPair, number>();
    
    await Promise.all(
      pairs.map(async (pair) => {
        try {
          const price = await this.getPrice(pair);
          prices.set(pair, price);
        } catch (error) {
          console.error(`Error obteniendo precio para ${pair}:`, error);
        }
      })
    );

    return prices;
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const priceService = new PriceService();

