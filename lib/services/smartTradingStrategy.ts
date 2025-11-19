// Estrategia inteligente que adapta según el régimen de mercado

import { TradingSignal, TradingPair, PriceData, OrderSide } from '../types/trading';
import { marketRegimeDetection, MarketRegime, RegimeAnalysis } from './marketRegimeDetection';
import { feeCalculator } from './feeCalculator';

export interface SmartSignal extends TradingSignal {
  regime: MarketRegime;
  optimalLeverage: number;
  optimalSize: number;
  expectedProfit: number;
  riskRewardRatio: number;
  urgency: number;
}

export class SmartTradingStrategy {
  /**
   * Genera señales inteligentes adaptadas al régimen de mercado
   */
  async generateSmartSignals(
    pair: TradingPair,
    priceHistory: PriceData[]
  ): Promise<SmartSignal[]> {
    if (priceHistory.length < 20) return [];

    // Detectar régimen actual
    const regimeAnalysis = marketRegimeDetection.detectRegime(pair, priceHistory);
    
    // Generar señales según el régimen
    let signals: SmartSignal[] = [];

    switch (regimeAnalysis.regime) {
      case 'ranging':
        signals = await this.tradeRange(pair, priceHistory, regimeAnalysis);
        break;
      case 'trending_up':
      case 'trending_down':
        signals = await this.tradeTrend(pair, priceHistory, regimeAnalysis);
        break;
      case 'breakout':
        signals = await this.tradeBreakout(pair, priceHistory, regimeAnalysis);
        break;
      case 'strong_impulse':
        signals = await this.tradeImpulse(pair, priceHistory, regimeAnalysis);
        break;
    }

    // Filtrar y ordenar por rentabilidad
    return signals
      .filter(s => s.expectedProfit > 0 && s.riskRewardRatio >= 1.5)
      .sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Estrategia para mercados laterales (ranging)
   * Grid Trading + Mean Reversion optimizado
   */
  private async tradeRange(
    pair: TradingPair,
    priceHistory: PriceData[],
    regime: RegimeAnalysis
  ): Promise<SmartSignal[]> {
    const signals: SmartSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    if (!regime.rangeTop || !regime.rangeBottom) return [];

    const rangeSize = regime.rangeTop - regime.rangeBottom;
    const rangeMid = (regime.rangeTop + regime.rangeBottom) / 2;
    const positionInRange = (currentPrice - regime.rangeBottom) / rangeSize;

    // Grid Trading: múltiples niveles
    const gridLevels = 7; // Más niveles para rangos
    const gridStep = rangeSize / gridLevels;

    for (let i = 0; i <= gridLevels; i++) {
      const gridPrice = regime.rangeBottom + (i * gridStep);
      const distance = Math.abs((currentPrice - gridPrice) / currentPrice) * 100;

      // Si el precio está cerca de un nivel de grid
      if (distance < 0.15) {
        // Si está en la mitad inferior del rango → comprar
        // Si está en la mitad superior → vender
        const side: OrderSide = positionInRange < 0.5 ? 'long' : 'short';
        const targetPrice = side === 'long' 
          ? gridPrice + (gridStep * 1.5)
          : gridPrice - (gridStep * 1.5);

        const expectedMove = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;
        const leverage = 3; // Leverage moderado para rangos
        const quantity = 0.001;

        const fees = feeCalculator.calculateFees(
          currentPrice,
          targetPrice,
          quantity,
          leverage,
          side
        );

        if (fees.netPnl > 0 && expectedMove > 0.2) {
          signals.push({
            id: `range-grid-${side}-${Date.now()}-${i}`,
            pair,
            side,
            price: currentPrice,
            timestamp: Date.now(),
            strategy: 'mean_reversion',
            confidence: 70 + (regime.confidence * 0.3),
            reason: `Grid ${side} en rango lateral, nivel ${i}/${gridLevels}`,
            regime: 'ranging',
            optimalLeverage: leverage,
            optimalSize: quantity,
            expectedProfit: fees.netPnl,
            riskRewardRatio: expectedMove / 0.3,
            urgency: 60,
          });
        }
      }
    }

    // Mean Reversion: cuando el precio toca los extremos
    const distanceToTop = ((regime.rangeTop - currentPrice) / regime.rangeTop) * 100;
    const distanceToBottom = ((currentPrice - regime.rangeBottom) / regime.rangeBottom) * 100;

    // Cerca del tope → vender (short)
    if (distanceToTop < 1) {
      const targetPrice = rangeMid;
      const expectedMove = distanceToTop;
      const leverage = 4;
      const quantity = 0.0015;

      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        quantity,
        leverage,
        'short'
      );

      if (fees.netPnl > 0) {
        signals.push({
          id: `range-reversion-short-${Date.now()}`,
          pair,
          side: 'short',
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'mean_reversion',
          confidence: 80,
          reason: `Reversión desde resistencia en rango lateral`,
          regime: 'ranging',
          optimalLeverage: leverage,
          optimalSize: quantity,
          expectedProfit: fees.netPnl,
          riskRewardRatio: expectedMove / 0.5,
          urgency: 75,
        });
      }
    }

    // Cerca del fondo → comprar (long)
    if (distanceToBottom < 1) {
      const targetPrice = rangeMid;
      const expectedMove = distanceToBottom;
      const leverage = 4;
      const quantity = 0.0015;

      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        quantity,
        leverage,
        'long'
      );

      if (fees.netPnl > 0) {
        signals.push({
          id: `range-reversion-long-${Date.now()}`,
          pair,
          side: 'long',
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'mean_reversion',
          confidence: 80,
          reason: `Reversión desde soporte en rango lateral`,
          regime: 'ranging',
          optimalLeverage: leverage,
          optimalSize: quantity,
          expectedProfit: fees.netPnl,
          riskRewardRatio: expectedMove / 0.5,
          urgency: 75,
        });
      }
    }

    return signals;
  }

  /**
   * Estrategia para tendencias
   * Seguir la tendencia con entradas escalonadas
   */
  private async tradeTrend(
    pair: TradingPair,
    priceHistory: PriceData[],
    regime: RegimeAnalysis
  ): Promise<SmartSignal[]> {
    const signals: SmartSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    if (!regime.trendDirection) return [];

    const side: OrderSide = regime.trendDirection === 'up' ? 'long' : 'short';

    // Calcular medias móviles para entradas
    const sma20 = this.calculateSMA(prices, 20);

    // Entrada cuando el precio retrocede a la media (pullback)
    const distanceToSMA20 = ((currentPrice - sma20) / sma20) * 100;
    const isPullback = side === 'long' 
      ? distanceToSMA20 < 0.5 && distanceToSMA20 > -1
      : distanceToSMA20 > -0.5 && distanceToSMA20 < 1;

    if (isPullback) {
      // Objetivo: continuación de la tendencia
      const targetPrice = side === 'long'
        ? currentPrice * (1 + (regime.strength * 0.02)) // 1-2% según fuerza
        : currentPrice * (1 - (regime.strength * 0.02));

      const expectedMove = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;
      const leverage = 5 + (regime.strength * 5); // 5x-10x según fuerza
      const quantity = 0.001;

      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        quantity,
        leverage,
        side
      );

      if (fees.netPnl > 0) {
        signals.push({
          id: `trend-${side}-${Date.now()}`,
          pair,
          side,
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'momentum',
          confidence: 75 + (regime.confidence * 0.2),
          reason: `Pullback en tendencia ${regime.trendDirection}, objetivo: ${expectedMove.toFixed(2)}%`,
          regime: regime.regime,
          optimalLeverage: Math.round(leverage),
          optimalSize: quantity,
          expectedProfit: fees.netPnl,
          riskRewardRatio: expectedMove / 0.8,
          urgency: 70,
        });
      }
    }

    // Entrada directa si la tendencia es muy fuerte
    if (regime.strength > 0.8 && regime.confidence > 80) {
      const targetPrice = side === 'long'
        ? currentPrice * 1.015
        : currentPrice * 0.985;

      const leverage = 8 + (regime.strength * 4); // 8x-12x
      const quantity = 0.0015;

      const fees = feeCalculator.calculateFees(
        currentPrice,
        targetPrice,
        quantity,
        leverage,
        side
      );

      if (fees.netPnl > 0) {
        signals.push({
          id: `trend-strong-${side}-${Date.now()}`,
          pair,
          side,
          price: currentPrice,
          timestamp: Date.now(),
          strategy: 'momentum',
          confidence: 85,
          reason: `Tendencia fuerte ${regime.trendDirection}, entrada directa`,
          regime: regime.regime,
          optimalLeverage: Math.round(leverage),
          optimalSize: quantity,
          expectedProfit: fees.netPnl,
          riskRewardRatio: 1.5 / 0.5,
          urgency: 85,
        });
      }
    }

    return signals;
  }

  /**
   * Estrategia para rupturas (breakouts)
   * Entrar rápido con alto leverage
   */
  private async tradeBreakout(
    pair: TradingPair,
    priceHistory: PriceData[],
    regime: RegimeAnalysis
  ): Promise<SmartSignal[]> {
    const signals: SmartSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    if (!regime.trendDirection) return [];

    const side: OrderSide = regime.trendDirection === 'up' ? 'long' : 'short';

    // En rupturas, entrar inmediatamente con leverage alto
    const targetPrice = side === 'long'
      ? currentPrice * (1 + (regime.strength * 0.03)) // 1.5%-3%
      : currentPrice * (1 - (regime.strength * 0.03));

    const expectedMove = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;
    const leverage = 10 + (regime.strength * 5); // 10x-15x
    const quantity = 0.002; // Tamaño mayor para rupturas

    const fees = feeCalculator.calculateFees(
      currentPrice,
      targetPrice,
      quantity,
      leverage,
      side
    );

    if (fees.netPnl > 0 && expectedMove > 1) {
      signals.push({
        id: `breakout-${side}-${Date.now()}`,
        pair,
        side,
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'breakout',
        confidence: 80 + (regime.confidence * 0.15),
        reason: `Ruptura ${regime.trendDirection}, fuerza: ${(regime.strength * 100).toFixed(0)}%`,
        regime: 'breakout',
        optimalLeverage: Math.round(leverage),
        optimalSize: quantity,
        expectedProfit: fees.netPnl,
        riskRewardRatio: expectedMove / 0.8,
        urgency: 90, // Alta urgencia en rupturas
      });
    }

    return signals;
  }

  /**
   * Estrategia para impulsos fuertes
   * Máximo leverage y tamaño para capturar el movimiento
   */
  private async tradeImpulse(
    pair: TradingPair,
    priceHistory: PriceData[],
    regime: RegimeAnalysis
  ): Promise<SmartSignal[]> {
    const signals: SmartSignal[] = [];
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[prices.length - 1];

    if (!regime.trendDirection || !regime.impulseStrength) return [];

    const side: OrderSide = regime.trendDirection === 'up' ? 'long' : 'short';

    // En impulsos fuertes, usar máximo leverage y tamaño
    const targetPrice = side === 'long'
      ? currentPrice * (1 + (regime.impulseStrength * 0.04)) // 2.8%-4%
      : currentPrice * (1 - (regime.impulseStrength * 0.04));

    const expectedMove = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;
    const leverage = 15 + (regime.impulseStrength * 5); // 15x-20x
    const quantity = 0.0025; // Tamaño máximo

    const fees = feeCalculator.calculateFees(
      currentPrice,
      targetPrice,
      quantity,
      leverage,
      side
    );

    if (fees.netPnl > 0 && expectedMove > 2) {
      signals.push({
        id: `impulse-${side}-${Date.now()}`,
        pair,
        side,
        price: currentPrice,
        timestamp: Date.now(),
        strategy: 'momentum',
        confidence: 90 + (regime.impulseStrength * 10),
        reason: `Impulso fuerte ${regime.trendDirection}, fuerza: ${(regime.impulseStrength * 100).toFixed(0)}%`,
        regime: 'strong_impulse',
        optimalLeverage: Math.round(leverage),
        optimalSize: quantity,
        expectedProfit: fees.netPnl,
        riskRewardRatio: expectedMove / 1,
        urgency: 95, // Máxima urgencia
      });
    }

    return signals;
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }
}

export const smartTradingStrategy = new SmartTradingStrategy();

