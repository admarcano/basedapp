// Estrategia agresiva optimizada para generar muchas operaciones rentables

import { TradingSignal, TradingPair, PriceData } from '../types/trading';
import { feeCalculator } from './feeCalculator';

export interface AggressiveSignal extends TradingSignal {
  expectedProfit: number; // Ganancia esperada después de fees
  riskRewardRatio: number; // Ratio riesgo/ganancia
  urgency: number; // 0-100, urgencia de ejecutar
}

export class AggressiveStrategy {
  /**
   * Genera señales agresivas optimizadas para muchas operaciones
   * Estrategias: Scalping + Grid Trading + Momentum
   */
  async generateAggressiveSignals(
    pair: TradingPair,
    priceHistory: PriceData[]
  ): Promise<AggressiveSignal[]> {
    const signals: AggressiveSignal[] = [];

    // 1. Scalping - Operaciones rápidas con pequeños movimientos
    const scalpingSignals = await this.scalpingStrategy(pair, priceHistory);
    signals.push(...scalpingSignals);

    // 2. Grid Trading - Múltiples niveles de entrada
    const gridSignals = await this.gridStrategy(pair, priceHistory);
    signals.push(...gridSignals);

    // 3. Momentum mejorado - Detectar movimientos tempranos
    const momentumSignals = await this.enhancedMomentum(pair, priceHistory);
    signals.push(...momentumSignals);

    // 4. Mean Reversion agresiva - Entrar más temprano
    const reversionSignals = await this.aggressiveMeanReversion(pair, priceHistory);
    signals.push(...reversionSignals);

    // Filtrar y ordenar por rentabilidad esperada
    return signals
      .filter(s => s.expectedProfit > 0 && s.riskRewardRatio >= 1.5)
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 10); // Top 10 señales
  }

  /**
   * Scalping: Operaciones rápidas con movimientos pequeños (0.1% - 0.5%)
   */
  private async scalpingStrategy(
    pair: TradingPair,
    priceHistory: PriceData[]
  ): Promise<AggressiveSignal[]> {
    if (priceHistory.length < 10) return [];

    const signals: AggressiveSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    // Detectar micro-movimientos (últimos 3-5 períodos)
    for (let i = 2; i <= 5; i++) {
      const pastPrice = prices[prices.length - i] || currentPrice;
      const change = ((currentPrice - pastPrice) / pastPrice) * 100;

      // Señal de compra: movimiento alcista pequeño pero consistente
      if (change > 0.1 && change < 0.8) {
        const expectedProfit = currentPrice * 0.003; // Esperar 0.3% más
        const risk = currentPrice * 0.001; // Stop loss 0.1%
        const fees = feeCalculator.calculateFees(
          currentPrice,
          currentPrice * 1.003,
          0.001, // cantidad ejemplo
          5, // leverage
          'long'
        );

        if (fees.netPnl > 0) {
          signals.push({
            id: `scalping-long-${Date.now()}-${i}`,
            pair,
            side: 'long',
            price: currentPrice,
            timestamp: Date.now(),
            strategy: 'momentum',
            confidence: 60 + (change * 10),
            reason: `Scalping alcista: +${change.toFixed(3)}% en ${i} períodos`,
            expectedProfit: fees.netPnl,
            riskRewardRatio: expectedProfit / risk,
            urgency: 85, // Alta urgencia en scalping
          });
        }
      }

      // Señal de venta: movimiento bajista pequeño pero consistente
      if (change < -0.1 && change > -0.8) {
        const expectedProfit = currentPrice * 0.003;
        const risk = currentPrice * 0.001;
        const fees = feeCalculator.calculateFees(
          currentPrice,
          currentPrice * 0.997,
          0.001,
          5,
          'short'
        );

        if (fees.netPnl > 0) {
          signals.push({
            id: `scalping-short-${Date.now()}-${i}`,
            pair,
            side: 'short',
            price: currentPrice,
            timestamp: Date.now(),
            strategy: 'momentum',
            confidence: 60 + (Math.abs(change) * 10),
            reason: `Scalping bajista: ${change.toFixed(3)}% en ${i} períodos`,
            expectedProfit: fees.netPnl,
            riskRewardRatio: expectedProfit / risk,
            urgency: 85,
          });
        }
      }
    }

    return signals;
  }

  /**
   * Grid Trading: Múltiples niveles de entrada alrededor del precio actual
   */
  private async gridStrategy(
    pair: TradingPair,
    priceHistory: PriceData[]
  ): Promise<AggressiveSignal[]> {
    if (priceHistory.length < 20) return [];

    const signals: AggressiveSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    // Calcular rango de trading reciente
    const recentPrices = prices.slice(-20);
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const range = high - low;
    const midPrice = (high + low) / 2;

    // Crear grid de niveles (5 niveles arriba y abajo)
    const gridLevels = 5;
    const gridStep = range / (gridLevels * 2);

    for (let i = -gridLevels; i <= gridLevels; i++) {
      const gridPrice = midPrice + (i * gridStep);
      const distance = Math.abs((currentPrice - gridPrice) / currentPrice) * 100;

      // Si el precio está cerca de un nivel de grid, crear señal
      if (distance < 0.2) {
        // Determinar dirección basada en posición del grid
        const side: 'long' | 'short' = i < 0 ? 'long' : 'short';
        const targetPrice = side === 'long' 
          ? gridPrice + (gridStep * 2) // Objetivo: siguiente nivel arriba
          : gridPrice - (gridStep * 2); // Objetivo: siguiente nivel abajo

        const expectedMove = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;
        const fees = feeCalculator.calculateFees(
          currentPrice,
          targetPrice,
          0.001,
          3, // Leverage moderado para grid
          side
        );

        if (fees.netPnl > 0 && expectedMove > 0.2) {
          signals.push({
            id: `grid-${side}-${Date.now()}-${i}`,
            pair,
            side,
            price: currentPrice,
            timestamp: Date.now(),
            strategy: 'mean_reversion',
            confidence: 65,
            reason: `Grid ${side} en nivel ${i}, objetivo: ${expectedMove.toFixed(2)}%`,
            expectedProfit: fees.netPnl,
            riskRewardRatio: expectedMove / 0.3, // Stop loss 0.3%
            urgency: 70,
          });
        }
      }
    }

    return signals;
  }

  /**
   * Momentum mejorado: Detectar movimientos tempranos
   */
  private async enhancedMomentum(
    pair: TradingPair,
    priceHistory: PriceData[]
  ): Promise<AggressiveSignal[]> {
    if (priceHistory.length < 15) return [];

    const signals: AggressiveSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    // Calcular momentum en múltiples timeframes
    const momentum3 = ((currentPrice - prices[prices.length - 3]) / prices[prices.length - 3]) * 100;
    const momentum5 = ((currentPrice - prices[prices.length - 5]) / prices[prices.length - 5]) * 100;

    // Detectar aceleración (momentum creciente)
    const acceleration = momentum3 - (momentum5 - momentum3);

    // Señal de compra: momentum positivo y acelerando
    if (momentum3 > 0.3 && momentum5 > 0.2 && acceleration > 0) {
      const expectedMove = Math.min(2, momentum3 * 2); // Esperar 2x el momentum actual
      const targetPrice = currentPrice * (1 + expectedMove / 100);
      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        0.001,
        8, // Leverage alto para momentum
        'long'
      );

      if (fees.netPnl > 0) {
        signals.push({
          id: `momentum-long-${Date.now()}`,
          pair,
          side: 'long',
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'momentum',
          confidence: 70 + Math.min(20, momentum3 * 5),
          reason: `Momentum alcista acelerando: +${momentum3.toFixed(2)}%`,
          expectedProfit: fees.netPnl,
          riskRewardRatio: expectedMove / 0.5,
          urgency: 80,
        });
      }
    }

    // Señal de venta: momentum negativo y acelerando
    if (momentum3 < -0.3 && momentum5 < -0.2 && acceleration < 0) {
      const expectedMove = Math.min(2, Math.abs(momentum3) * 2);
      const targetPrice = currentPrice * (1 - expectedMove / 100);
      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        0.001,
        8,
        'short'
      );

      if (fees.netPnl > 0) {
        signals.push({
          id: `momentum-short-${Date.now()}`,
          pair,
          side: 'short',
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'momentum',
          confidence: 70 + Math.min(20, Math.abs(momentum3) * 5),
          reason: `Momentum bajista acelerando: ${momentum3.toFixed(2)}%`,
          expectedProfit: fees.netPnl,
          riskRewardRatio: expectedMove / 0.5,
          urgency: 80,
        });
      }
    }

    return signals;
  }

  /**
   * Mean Reversion agresiva: Entrar antes de que el precio revierta
   */
  private async aggressiveMeanReversion(
    pair: TradingPair,
    priceHistory: PriceData[]
  ): Promise<AggressiveSignal[]> {
    if (priceHistory.length < 20) return [];

    const signals: AggressiveSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    // Calcular múltiples medias móviles
    const sma10 = this.calculateSMA(prices, 10);
    const sma20 = this.calculateSMA(prices, 20);

    // Desviación de las medias
    const dev10 = ((currentPrice - sma10) / sma10) * 100;
    const dev20 = ((currentPrice - sma20) / sma20) * 100;

    // Señal de compra: precio por debajo de medias (entrar temprano)
    if (dev10 < -1 && dev20 < -1.5 && currentPrice < sma10 && sma10 < sma20) {
      const targetPrice = sma20; // Objetivo: volver a la media
      const expectedMove = ((targetPrice - currentPrice) / currentPrice) * 100;
      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        0.001,
        5,
        'long'
      );

      if (fees.netPnl > 0 && expectedMove > 0.5) {
        signals.push({
          id: `reversion-long-${Date.now()}`,
          pair,
          side: 'long',
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'mean_reversion',
          confidence: 75 + Math.min(15, Math.abs(dev20) * 2),
          reason: `Reversión alcista: precio ${dev20.toFixed(2)}% bajo SMA20`,
          expectedProfit: fees.netPnl,
          riskRewardRatio: expectedMove / 1,
          urgency: 75,
        });
      }
    }

    // Señal de venta: precio por encima de medias
    if (dev10 > 1 && dev20 > 1.5 && currentPrice > sma10 && sma10 > sma20) {
      const targetPrice = sma20;
      const expectedMove = ((currentPrice - targetPrice) / currentPrice) * 100;
      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        0.001,
        5,
        'short'
      );

      if (fees.netPnl > 0 && expectedMove > 0.5) {
        signals.push({
          id: `reversion-short-${Date.now()}`,
          pair,
          side: 'short',
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'mean_reversion',
          confidence: 75 + Math.min(15, Math.abs(dev20) * 2),
          reason: `Reversión bajista: precio ${dev20.toFixed(2)}% sobre SMA20`,
          expectedProfit: fees.netPnl,
          riskRewardRatio: expectedMove / 1,
          urgency: 75,
        });
      }
    }

    return signals;
  }

  /**
   * Calcula la media móvil simple
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      // Si no hay suficientes datos, usar el promedio de lo disponible
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }
}

export const aggressiveStrategy = new AggressiveStrategy();

