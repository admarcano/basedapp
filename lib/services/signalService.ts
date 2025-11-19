// Servicio para generar señales de trading basadas en estrategias

import { TradingSignal, TradingPair, StrategyType, PriceData } from '../types/trading';

export class SignalService {
  private priceHistory: Map<TradingPair, PriceData[]> = new Map();
  private readonly HISTORY_SIZE = 100;

  /**
   * Agrega un precio al historial
   */
  addPriceData(data: PriceData) {
    const history = this.priceHistory.get(data.symbol) || [];
    history.push(data);
    
    // Mantener solo los últimos N precios
    if (history.length > this.HISTORY_SIZE) {
      history.shift();
    }
    
    this.priceHistory.set(data.symbol, history);
  }

  /**
   * Obtiene el historial de precios
   */
  getPriceHistory(pair: TradingPair): PriceData[] {
    return this.priceHistory.get(pair) || [];
  }

  /**
   * Calcula la media móvil simple
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  /**
   * Calcula el RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));

    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Estrategia: Momentum
   * Detecta tendencias fuertes basadas en cambios de precio
   */
  async checkMomentum(pair: TradingPair): Promise<TradingSignal | null> {
    const history = this.getPriceHistory(pair);
    if (history.length < 20) return null;

    const prices = history.map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    const price5m = prices[prices.length - 5] || currentPrice;
    const price20m = prices[prices.length - 20] || currentPrice;

    const change5m = ((currentPrice - price5m) / price5m) * 100;
    const change20m = ((currentPrice - price20m) / price20m) * 100;

    // Señal de compra: momentum alcista fuerte
    if (change5m > 2 && change20m > 3) {
      return {
        id: `momentum-${Date.now()}`,
        pair,
        side: 'long',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'momentum',
        confidence: Math.min(90, 50 + Math.abs(change5m) * 5),
        reason: `Momentum alcista: +${change5m.toFixed(2)}% (5m), +${change20m.toFixed(2)}% (20m)`,
      };
    }

    // Señal de venta: momentum bajista fuerte
    if (change5m < -2 && change20m < -3) {
      return {
        id: `momentum-${Date.now()}`,
        pair,
        side: 'short',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'momentum',
        confidence: Math.min(90, 50 + Math.abs(change5m) * 5),
        reason: `Momentum bajista: ${change5m.toFixed(2)}% (5m), ${change20m.toFixed(2)}% (20m)`,
      };
    }

    return null;
  }

  /**
   * Estrategia: RSI
   * Detecta sobrecompra/sobreventa
   */
  async checkRSI(pair: TradingPair): Promise<TradingSignal | null> {
    const history = this.getPriceHistory(pair);
    if (history.length < 15) return null;

    const prices = history.map(h => h.price);
    const rsi = this.calculateRSI(prices);
    const currentPrice = prices[prices.length - 1];

    // Sobreventa: señal de compra
    if (rsi < 30) {
      return {
        id: `rsi-${Date.now()}`,
        pair,
        side: 'long',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'rsi',
        confidence: 85 - rsi, // Más bajo RSI = más confianza
        reason: `RSI sobreventa: ${rsi.toFixed(2)}`,
      };
    }

    // Sobrecompra: señal de venta
    if (rsi > 70) {
      return {
        id: `rsi-${Date.now()}`,
        pair,
        side: 'short',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'rsi',
        confidence: rsi - 30, // Más alto RSI = más confianza
        reason: `RSI sobrecompra: ${rsi.toFixed(2)}`,
      };
    }

    return null;
  }

  /**
   * Estrategia: Mean Reversion
   * Detecta cuando el precio se aleja de la media
   */
  async checkMeanReversion(pair: TradingPair): Promise<TradingSignal | null> {
    const history = this.getPriceHistory(pair);
    if (history.length < 20) return null;

    const prices = history.map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    const sma20 = this.calculateSMA(prices, 20);
    const deviation = ((currentPrice - sma20) / sma20) * 100;

    // Precio muy por debajo de la media: señal de compra
    if (deviation < -3) {
      return {
        id: `mean_reversion-${Date.now()}`,
        pair,
        side: 'long',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'mean_reversion',
        confidence: Math.min(85, 50 + Math.abs(deviation) * 5),
        reason: `Precio ${deviation.toFixed(2)}% por debajo de SMA20`,
      };
    }

    // Precio muy por encima de la media: señal de venta
    if (deviation > 3) {
      return {
        id: `mean_reversion-${Date.now()}`,
        pair,
        side: 'short',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'mean_reversion',
        confidence: Math.min(85, 50 + Math.abs(deviation) * 5),
        reason: `Precio ${deviation.toFixed(2)}% por encima de SMA20`,
      };
    }

    return null;
  }

  /**
   * Estrategia: Breakout
   * Detecta rupturas de niveles de resistencia/soporte
   */
  async checkBreakout(pair: TradingPair): Promise<TradingSignal | null> {
    const history = this.getPriceHistory(pair);
    if (history.length < 20) return null;

    const prices = history.map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    
    // Encontrar máximo y mínimo recientes
    const recentPrices = prices.slice(-20);
    const maxPrice = Math.max(...recentPrices);
    const minPrice = Math.min(...recentPrices);

    // Breakout alcista: precio rompe resistencia
    if (currentPrice > maxPrice * 0.98 && currentPrice > prices[prices.length - 2]) {
      return {
        id: `breakout-${Date.now()}`,
        pair,
        side: 'long',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'breakout',
        confidence: 75,
        reason: `Breakout alcista: precio rompe resistencia en ${maxPrice.toFixed(2)}`,
      };
    }

    // Breakout bajista: precio rompe soporte
    if (currentPrice < minPrice * 1.02 && currentPrice < prices[prices.length - 2]) {
      return {
        id: `breakout-${Date.now()}`,
        pair,
        side: 'short',
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'breakout',
        confidence: 75,
        reason: `Breakout bajista: precio rompe soporte en ${minPrice.toFixed(2)}`,
      };
    }

    return null;
  }

  /**
   * Genera señales para todas las estrategias activas
   */
  async generateSignals(pair: TradingPair, strategies: StrategyType[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const strategy of strategies) {
      let signal: TradingSignal | null = null;

      switch (strategy) {
        case 'momentum':
          signal = await this.checkMomentum(pair);
          break;
        case 'rsi':
          signal = await this.checkRSI(pair);
          break;
        case 'mean_reversion':
          signal = await this.checkMeanReversion(pair);
          break;
        case 'breakout':
          signal = await this.checkBreakout(pair);
          break;
      }

      if (signal) {
        signals.push(signal);
      }
    }

    return signals;
  }
}

export const signalService = new SignalService();

