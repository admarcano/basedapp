// Detección inteligente de regímenes de mercado

import { TradingPair, PriceData } from '../types/trading';

export type MarketRegime = 'trending_up' | 'trending_down' | 'ranging' | 'breakout' | 'strong_impulse';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number; // 0-100
  strength: number; // 0-1, fuerza del régimen
  supportLevel?: number;
  resistanceLevel?: number;
  trendDirection?: 'up' | 'down';
  impulseStrength?: number; // 0-1, fuerza del impulso
  rangeTop?: number;
  rangeBottom?: number;
}

export class MarketRegimeDetection {
  /**
   * Detecta el régimen actual del mercado
   */
  detectRegime(pair: TradingPair, priceHistory: PriceData[]): RegimeAnalysis {
    if (priceHistory.length < 50) {
      return {
        regime: 'ranging',
        confidence: 50,
        strength: 0.5,
      };
    }

    const prices = priceHistory.map(h => h.price);

    // 1. Detectar tendencia
    const trendAnalysis = this.analyzeTrend(prices);
    
    // 2. Detectar rango lateral
    const rangeAnalysis = this.analyzeRange(prices);
    
    // 3. Detectar ruptura
    const breakoutAnalysis = this.analyzeBreakout(prices, rangeAnalysis);
    
    // 4. Detectar impulso fuerte
    const impulseAnalysis = this.analyzeImpulse(prices);

    // Determinar régimen dominante
    if (impulseAnalysis.impulseStrength > 0.7) {
      return {
        regime: 'strong_impulse',
        confidence: 85 + (impulseAnalysis.impulseStrength * 15),
        strength: impulseAnalysis.impulseStrength,
        trendDirection: impulseAnalysis.direction,
        impulseStrength: impulseAnalysis.impulseStrength,
        supportLevel: rangeAnalysis.support,
        resistanceLevel: rangeAnalysis.resistance,
      };
    }

    if (breakoutAnalysis.isBreakout && breakoutAnalysis.confidence > 70) {
      return {
        regime: 'breakout',
        confidence: breakoutAnalysis.confidence,
        strength: breakoutAnalysis.strength,
        supportLevel: rangeAnalysis.support,
        resistanceLevel: rangeAnalysis.resistance,
        trendDirection: breakoutAnalysis.direction,
      };
    }

    if (rangeAnalysis.isRanging && rangeAnalysis.confidence > 60) {
      return {
        regime: 'ranging',
        confidence: rangeAnalysis.confidence,
        strength: rangeAnalysis.strength,
        rangeTop: rangeAnalysis.resistance,
        rangeBottom: rangeAnalysis.support,
        supportLevel: rangeAnalysis.support,
        resistanceLevel: rangeAnalysis.resistance,
      };
    }

    if (trendAnalysis.strength > 0.6) {
      return {
        regime: trendAnalysis.direction === 'up' ? 'trending_up' : 'trending_down',
        confidence: trendAnalysis.confidence,
        strength: trendAnalysis.strength,
        trendDirection: trendAnalysis.direction === 'neutral' ? undefined : trendAnalysis.direction,
        supportLevel: trendAnalysis.support,
        resistanceLevel: trendAnalysis.resistance,
      };
    }

    // Default: rango
    return {
      regime: 'ranging',
      confidence: 50,
      strength: 0.5,
      rangeTop: rangeAnalysis.resistance,
      rangeBottom: rangeAnalysis.support,
    };
  }

  /**
   * Analiza la tendencia del mercado
   */
  private analyzeTrend(prices: number[]): {
    direction: 'up' | 'down' | 'neutral';
    strength: number;
    confidence: number;
    support: number;
    resistance: number;
  } {
    // Calcular múltiples medias móviles
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = prices.length >= 50 ? this.calculateSMA(prices, 50) : sma20;
    const sma100 = prices.length >= 100 ? this.calculateSMA(prices, 100) : sma50;

    const currentPrice = prices[prices.length - 1];
    
    // Determinar dirección
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (currentPrice > sma20 && sma20 > sma50 && sma50 > sma100) {
      direction = 'up';
    } else if (currentPrice < sma20 && sma20 < sma50 && sma50 < sma100) {
      direction = 'down';
    }

    // Calcular fuerza de la tendencia
    const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;
    const strength = Math.min(1, Math.abs(priceChange) / 10); // Normalizar

    // Calcular confianza
    const alignment = direction === 'up' 
      ? (currentPrice - sma20) / sma20
      : (sma20 - currentPrice) / currentPrice;
    const confidence = Math.min(95, 50 + (alignment * 1000));

    // Niveles de soporte y resistencia
    const support = Math.min(...prices.slice(-20));
    const resistance = Math.max(...prices.slice(-20));

    return {
      direction,
      strength,
      confidence,
      support,
      resistance,
    };
  }

  /**
   * Analiza si el mercado está en rango lateral
   */
  private analyzeRange(prices: number[]): {
    isRanging: boolean;
    confidence: number;
    strength: number;
    support: number;
    resistance: number;
  } {
    const recentPrices = prices.slice(-30);
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const range = high - low;
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const rangePercent = (range / avgPrice) * 100;

    // Calcular volatilidad
    const returns = [];
    for (let i = 1; i < recentPrices.length; i++) {
      returns.push(Math.abs((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]));
    }
    const volatility = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Está en rango si:
    // 1. El rango es pequeño (< 5%)
    // 2. La volatilidad es baja
    // 3. El precio oscila entre niveles
    const isRanging = rangePercent < 5 && volatility < 0.02;

    // Calcular fuerza del rango (cuántas veces toca soporte/resistencia)
    let touches = 0;
    const tolerance = avgPrice * 0.01; // 1% de tolerancia
    for (const price of recentPrices) {
      if (Math.abs(price - high) < tolerance || Math.abs(price - low) < tolerance) {
        touches++;
      }
    }
    const strength = Math.min(1, touches / 10);

    const confidence = isRanging ? 60 + (strength * 30) : 30;

    return {
      isRanging,
      confidence,
      strength,
      support: low,
      resistance: high,
    };
  }

  /**
   * Analiza rupturas de tendencia/rango
   */
  private analyzeBreakout(
    prices: number[],
    rangeAnalysis: { support: number; resistance: number }
  ): {
    isBreakout: boolean;
    confidence: number;
    strength: number;
    direction: 'up' | 'down';
  } {
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];
    const resistance = rangeAnalysis.resistance;
    const support = rangeAnalysis.support;

    // Ruptura alcista
    const breakoutUp = currentPrice > resistance && previousPrice <= resistance;
    // Ruptura bajista
    const breakoutDown = currentPrice < support && previousPrice >= support;

    if (!breakoutUp && !breakoutDown) {
      return {
        isBreakout: false,
        confidence: 0,
        strength: 0,
        direction: 'up',
      };
    }

    const direction = breakoutUp ? 'up' : 'down';
    const breakoutDistance = breakoutUp
      ? ((currentPrice - resistance) / resistance) * 100
      : ((support - currentPrice) / support) * 100;

    // Confianza basada en distancia de ruptura y volumen (simulado)
    const confidence = Math.min(95, 70 + (breakoutDistance * 10));
    const strength = Math.min(1, breakoutDistance / 2);

    return {
      isBreakout: true,
      confidence,
      strength,
      direction,
    };
  }

  /**
   * Analiza impulsos fuertes
   */
  private analyzeImpulse(prices: number[]): {
    impulseStrength: number;
    direction: 'up' | 'down';
  } {
    if (prices.length < 10) {
      return { impulseStrength: 0, direction: 'up' };
    }

    const currentPrice = prices[prices.length - 1];
    
    // Calcular momentum en múltiples timeframes
    const momentum3 = ((currentPrice - prices[prices.length - 3]) / prices[prices.length - 3]) * 100;
    const momentum5 = ((currentPrice - prices[prices.length - 5]) / prices[prices.length - 5]) * 100;

    // Calcular aceleración (cambio en momentum)
    const acceleration3 = momentum3 - momentum5;

    // Impulso fuerte: momentum alto + aceleración positiva
    const isUpImpulse = momentum3 > 1 && momentum5 > 0.8 && acceleration3 > 0;
    const isDownImpulse = momentum3 < -1 && momentum5 < -0.8 && acceleration3 < 0;

    if (!isUpImpulse && !isDownImpulse) {
      return { impulseStrength: 0, direction: 'up' };
    }

    const direction = isUpImpulse ? 'up' : 'down';
    const avgMomentum = (Math.abs(momentum3) + Math.abs(momentum5)) / 2;
    const impulseStrength = Math.min(1, avgMomentum / 3); // Normalizar

    return {
      impulseStrength,
      direction,
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }
}

export const marketRegimeDetection = new MarketRegimeDetection();

