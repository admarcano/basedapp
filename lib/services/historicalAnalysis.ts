// Análisis de puntos clave históricos para identificar mejores movimientos

import { TradingPair, PriceData } from '../types/trading';

export interface HistoricalPattern {
  timeOfDay: number; // Hora del día (0-23)
  dayOfWeek: number; // Día de la semana (0-6)
  averageMovement: number; // Movimiento promedio en ese momento
  successRate: number; // Tasa de éxito
  volatility: number; // Volatilidad típica
}

export interface BestEntryPoint {
  timeOfDay: number;
  dayOfWeek: number;
  expectedMovement: number;
  confidence: number;
  reason: string;
}

export class HistoricalAnalysis {
  private patterns: Map<TradingPair, HistoricalPattern[]> = new Map();

  /**
   * Analiza el historial de precios para encontrar patrones
   */
  analyzeHistoricalPatterns(
    pair: TradingPair,
    priceHistory: PriceData[]
  ): HistoricalPattern[] {
    if (priceHistory.length < 100) {
      return [];
    }

    const patterns: Map<string, {
      movements: number[];
      successes: number;
      total: number;
      volatilities: number[];
    }> = new Map();

    // Analizar cada punto de datos
    for (let i = 1; i < priceHistory.length; i++) {
      const current = priceHistory[i];
      const previous = priceHistory[i - 1];

      const date = new Date(current.timestamp);
      const timeOfDay = date.getUTCHours();
      const dayOfWeek = date.getUTCDay();
      const key = `${dayOfWeek}-${timeOfDay}`;

      const movement = (current.price - previous.price) / previous.price;
      const isSuccess = Math.abs(movement) > 0.01; // Movimiento > 1%

      if (!patterns.has(key)) {
        patterns.set(key, {
          movements: [],
          successes: 0,
          total: 0,
          volatilities: [],
        });
      }

      const pattern = patterns.get(key)!;
      pattern.movements.push(Math.abs(movement));
      pattern.total++;
      if (isSuccess) pattern.successes++;
      
      // Calcular volatilidad (desviación estándar de movimientos)
      if (pattern.movements.length > 1) {
        const avg = pattern.movements.reduce((a, b) => a + b, 0) / pattern.movements.length;
        const variance = pattern.movements.reduce((sum, m) => sum + Math.pow(m - avg, 2), 0) / pattern.movements.length;
        pattern.volatilities.push(Math.sqrt(variance));
      }
    }

    // Convertir a HistoricalPattern[]
    const result: HistoricalPattern[] = [];
    for (const [key, data] of patterns.entries()) {
      const [dayOfWeek, timeOfDay] = key.split('-').map(Number);
      const averageMovement = data.movements.reduce((a, b) => a + b, 0) / data.movements.length;
      const successRate = data.successes / data.total;
      const avgVolatility = data.volatilities.length > 0
        ? data.volatilities.reduce((a, b) => a + b, 0) / data.volatilities.length
        : 0;

      result.push({
        timeOfDay,
        dayOfWeek,
        averageMovement,
        successRate,
        volatility: avgVolatility,
      });
    }

    this.patterns.set(pair, result);
    return result;
  }

  /**
   * Encuentra los mejores momentos para entrar
   */
  findBestEntryPoints(pair: TradingPair): BestEntryPoint[] {
    const patterns = this.patterns.get(pair) || [];
    
    if (patterns.length === 0) {
      return [];
    }

    // Filtrar y ordenar por mejor combinación de movimiento y éxito
    const bestPoints = patterns
      .filter(p => p.successRate > 0.5 && p.averageMovement > 0.005) // Al menos 50% éxito y 0.5% movimiento
      .map(p => ({
        timeOfDay: p.timeOfDay,
        dayOfWeek: p.dayOfWeek,
        expectedMovement: p.averageMovement,
        confidence: p.successRate * (1 - p.volatility), // Mayor confianza = más éxito, menos volatilidad
        reason: `Movimiento promedio: ${(p.averageMovement * 100).toFixed(2)}%, Éxito: ${(p.successRate * 100).toFixed(0)}%`,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5

    return bestPoints;
  }

  /**
   * Verifica si es un buen momento para operar según el historial
   */
  isGoodTimeToTrade(pair: TradingPair): { isGood: boolean; reason: string; confidence: number } {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay();

    const patterns = this.patterns.get(pair) || [];
    const currentPattern = patterns.find(
      p => p.timeOfDay === currentHour && p.dayOfWeek === currentDay
    );

    if (!currentPattern) {
      return {
        isGood: true, // Si no hay datos, permitir trading
        reason: 'Sin datos históricos para este momento',
        confidence: 0.5,
      };
    }

    const isGood = currentPattern.successRate > 0.55 && currentPattern.averageMovement > 0.005;
    const confidence = currentPattern.successRate * (1 - currentPattern.volatility);

    return {
      isGood,
      reason: isGood
        ? `Momento histórico favorable: ${(currentPattern.successRate * 100).toFixed(0)}% éxito`
        : `Momento histórico desfavorable: ${(currentPattern.successRate * 100).toFixed(0)}% éxito`,
      confidence,
    };
  }

  /**
   * Obtiene el patrón actual
   */
  getCurrentPattern(pair: TradingPair): HistoricalPattern | null {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay();

    const patterns = this.patterns.get(pair) || [];
    return patterns.find(
      p => p.timeOfDay === currentHour && p.dayOfWeek === currentDay
    ) || null;
  }
}

export const historicalAnalysis = new HistoricalAnalysis();

