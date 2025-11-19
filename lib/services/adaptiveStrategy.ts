// Estrategia adaptativa que ajusta el apalancamiento dinámicamente

import { TradingPair, PriceData, TradingSignal } from '../types/trading';
import { signalService } from './signalService';

export interface AdaptiveStrategyConfig {
  minLeverage: number;
  maxLeverage: number;
  baseLeverage: number;
  volatilityMultiplier: number;
  confidenceMultiplier: number;
  performanceMultiplier: number;
}

export interface MarketAnalysis {
  volatility: number; // 0-1, donde 1 es muy volátil
  trendStrength: number; // 0-1, fuerza de la tendencia
  confidence: number; // 0-100, confianza en la señal
  recentPerformance: number; // -1 a 1, rendimiento reciente
  volume: number; // Volumen relativo
}

export class AdaptiveStrategy {
  private config: AdaptiveStrategyConfig = {
    minLeverage: 3, // Mínimo 3x para ser más agresivo
    maxLeverage: 20,
    baseLeverage: 8, // Base más alta para más ganancias
    volatilityMultiplier: 0.25, // Menos peso a volatilidad
    confidenceMultiplier: 0.5, // Más peso a confianza
    performanceMultiplier: 0.25, // Menos peso a rendimiento pasado
  };

  /**
   * Analiza el mercado y calcula métricas
   */
  analyzeMarket(pair: TradingPair, priceHistory: PriceData[]): MarketAnalysis {
    if (priceHistory.length < 20) {
      return {
        volatility: 0.5,
        trendStrength: 0.5,
        confidence: 50,
        recentPerformance: 0,
        volume: 0.5,
      };
    }

    const prices = priceHistory.map(h => h.price);
    const returns = [];
    
    // Calcular retornos
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    // Volatilidad (desviación estándar de retornos)
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const volatility = Math.min(1, Math.sqrt(variance) * 100); // Normalizar a 0-1

    // Fuerza de tendencia (correlación de precios con tiempo)
    const recentPrices = prices.slice(-20);
    const trend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
    const trendStrength = Math.min(1, Math.abs(trend) * 10);

    // Rendimiento reciente (últimos 10 períodos vs anteriores)
    const recent10 = prices.slice(-10);
    const previous10 = prices.slice(-20, -10);
    const recentAvg = recent10.reduce((a, b) => a + b, 0) / recent10.length;
    const previousAvg = previous10.reduce((a, b) => a + b, 0) / previous10.length;
    const recentPerformance = (recentAvg - previousAvg) / previousAvg;

    // Volumen (simulado por ahora, en producción usar datos reales)
    const volume = 0.5 + (volatility * 0.5);

    return {
      volatility,
      trendStrength,
      confidence: 70, // Se calculará con la señal
      recentPerformance,
      volume,
    };
  }

  /**
   * Calcula el apalancamiento óptimo basado en el análisis del mercado
   */
  calculateOptimalLeverage(
    signal: TradingSignal,
    marketAnalysis: MarketAnalysis
  ): number {
    // Actualizar confianza en el análisis
    marketAnalysis.confidence = signal.confidence;

    // Factores que aumentan el leverage:
    // 1. Alta confianza en la señal
    // 2. Baja volatilidad (menos riesgo)
    // 3. Tendencia fuerte
    // 4. Buen rendimiento reciente

    // Factores que disminuyen el leverage:
    // 1. Alta volatilidad (más riesgo)
    // 2. Baja confianza
    // 3. Rendimiento negativo reciente

    // Calcular score de leverage (0-1)
    const confidenceScore = marketAnalysis.confidence / 100;
    const volatilityScore = 1 - marketAnalysis.volatility; // Menos volatilidad = más leverage
    const trendScore = marketAnalysis.trendStrength;
    const performanceScore = (marketAnalysis.recentPerformance + 1) / 2; // Normalizar -1 a 1 -> 0 a 1

    // Ponderación de factores
    const leverageScore =
      confidenceScore * this.config.confidenceMultiplier +
      volatilityScore * this.config.volatilityMultiplier +
      trendScore * 0.2 +
      performanceScore * this.config.performanceMultiplier;

    // Calcular leverage dentro del rango
    const leverageRange = this.config.maxLeverage - this.config.minLeverage;
    const calculatedLeverage = this.config.minLeverage + (leverageScore * leverageRange);

    // Aplicar límites y redondear
    const finalLeverage = Math.max(
      this.config.minLeverage,
      Math.min(this.config.maxLeverage, Math.round(calculatedLeverage))
    );

    return finalLeverage;
  }

  /**
   * Genera una señal adaptativa con leverage calculado
   */
  async generateAdaptiveSignal(
    pair: TradingPair,
    baseSignals: TradingSignal[]
  ): Promise<TradingSignal & { optimalLeverage: number; marketAnalysis: MarketAnalysis } | null> {
    if (baseSignals.length === 0) return null;

    // Tomar la señal con mayor confianza
    const bestSignal = baseSignals.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // Obtener historial de precios
    const priceHistory = signalService.getPriceHistory(pair);
    if (priceHistory.length < 10) return null;

    // Analizar mercado
    const marketAnalysis = this.analyzeMarket(pair, priceHistory);

    // Calcular leverage óptimo
    const optimalLeverage = this.calculateOptimalLeverage(bestSignal, marketAnalysis);

    return {
      ...bestSignal,
      optimalLeverage,
      marketAnalysis,
    };
  }

  /**
   * Actualiza la configuración de la estrategia
   */
  updateConfig(config: Partial<AdaptiveStrategyConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): AdaptiveStrategyConfig {
    return { ...this.config };
  }
}

export const adaptiveStrategy = new AdaptiveStrategy();

