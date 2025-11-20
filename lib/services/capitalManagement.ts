// Gestión inteligente de capital y volumen

import { TradingSignal } from '../types/trading';
import { MarketAnalysis } from '../services/adaptiveStrategy';

export interface CapitalConfig {
  initialCapital: number; // $10 por defecto
  maxRiskPerTrade: number; // Porcentaje máximo de riesgo por operación (ej: 2%)
  minTradeSize: number; // Tamaño mínimo de operación
  maxTradeSize: number; // Tamaño máximo de operación
  compounding: boolean; // Reinvertir ganancias
}

export interface TradeSize {
  quantity: number;
  capitalAllocated: number;
  riskAmount: number;
}

export class CapitalManagement {
  private config: CapitalConfig = {
    initialCapital: 10, // $10
    maxRiskPerTrade: 3, // 3% del capital (aumentado para más operaciones)
    minTradeSize: 0.0001,
    maxTradeSize: 0.02, // Aumentado para permitir más capital por operación
    compounding: true,
  };

  private currentCapital: number = this.config.initialCapital;

  /**
   * Calcula el tamaño de operación basado en:
   * - Capital disponible
   * - Probabilidad de la señal
   * - Análisis de mercado
   * - Riesgo máximo permitido
   */
  calculateTradeSize(
    signal: TradingSignal,
    marketAnalysis: MarketAnalysis,
    currentPrice: number,
    leverage: number
  ): TradeSize {
    // Calcular capital disponible
    const availableCapital = this.getAvailableCapital();

    // Calcular riesgo base (2% del capital)
    const baseRisk = availableCapital * (this.config.maxRiskPerTrade / 100);

    // Ajustar riesgo según confianza de la señal
    // Mayor confianza = más capital asignado
    const confidenceMultiplier = signal.confidence / 100;
    const adjustedRisk = baseRisk * (0.5 + confidenceMultiplier * 0.5); // Entre 0.5x y 1x

    // Ajustar según volatilidad (menos volatilidad = más capital)
    const volatilityMultiplier = 1 - (marketAnalysis.volatility * 0.3); // Reducir hasta 30%
    const finalRisk = adjustedRisk * volatilityMultiplier;

    // Ajustar según rendimiento reciente
    const performanceMultiplier = 0.7 + (marketAnalysis.recentPerformance + 1) / 2 * 0.3;
    const riskAmount = finalRisk * performanceMultiplier;

    // Calcular cantidad basada en stop loss
    // Si el stop loss es 5%, el riesgo es 5% del tamaño de la posición
    const stopLossPercent = 5; // Por defecto, se ajustará dinámicamente
    const positionSize = riskAmount / (stopLossPercent / 100);

    // Aplicar leverage
    const leveragedSize = positionSize * leverage;

    // Calcular cantidad en unidades de la cripto
    const quantity = leveragedSize / currentPrice;

    // Aplicar límites
    const finalQuantity = Math.max(
      this.config.minTradeSize,
      Math.min(this.config.maxTradeSize, quantity)
    );

    const capitalAllocated = finalQuantity * currentPrice / leverage;

    return {
      quantity: finalQuantity,
      capitalAllocated,
      riskAmount,
    };
  }

  /**
   * Obtiene el capital disponible
   */
  getAvailableCapital(): number {
    return this.currentCapital;
  }

  /**
   * Actualiza el capital (después de una operación)
   */
  updateCapital(pnl: number): void {
    if (this.config.compounding) {
      this.currentCapital += pnl;
    } else {
      // Sin compounding, solo actualizar si hay pérdidas
      if (pnl < 0) {
        this.currentCapital += pnl;
      }
    }
  }

  /**
   * Establece el capital inicial
   */
  setInitialCapital(amount: number): void {
    this.config.initialCapital = amount;
    this.currentCapital = amount;
  }

  /**
   * Obtiene estadísticas de capital
   */
  getCapitalStats() {
    return {
      currentCapital: this.currentCapital,
      initialCapital: this.config.initialCapital,
      totalReturn: this.currentCapital - this.config.initialCapital,
      totalReturnPercent: ((this.currentCapital - this.config.initialCapital) / this.config.initialCapital) * 100,
    };
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<CapitalConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): CapitalConfig {
    return { ...this.config };
  }
}

export const capitalManagement = new CapitalManagement();

