// Sistema de Stop Loss y Take Profit dinámicos

import { TradingOrder, TradingPair, PriceData } from '../types/trading';
import { MarketAnalysis } from './adaptiveStrategy';

export interface DynamicLevels {
  stopLoss: number; // Precio de stop loss
  takeProfit: number; // Precio de take profit
  stopLossPercent: number; // Porcentaje de stop loss
  takeProfitPercent: number; // Porcentaje de take profit
  trailingStop?: number; // Trailing stop (opcional)
}

export class DynamicStopLoss {
  /**
   * Calcula niveles dinámicos de Stop Loss y Take Profit basados en:
   * - Volatilidad del mercado
   * - Niveles de soporte/resistencia históricos
   * - Tendencias actuales
   * - Volumen
   */
  calculateDynamicLevels(
    order: TradingOrder,
    currentPrice: number,
    marketAnalysis: MarketAnalysis,
    priceHistory: PriceData[]
  ): DynamicLevels {
    const isLong = order.side === 'long';
    const entryPrice = order.entryPrice;

    // Calcular volatilidad reciente
    const volatility = marketAnalysis.volatility;
    
    // Stop Loss optimizado para muchas operaciones: más ajustado
    const baseStopLossPercent = 0.5 + (volatility * 2); // Entre 0.5% y 2.5% (más ajustado)
    const baseTakeProfitPercent = baseStopLossPercent * 3; // Ratio 1:3 (mejor risk/reward)

    // Ajustar según fuerza de tendencia
    // Tendencias fuertes = stop loss más ajustado, take profit más amplio
    const trendMultiplier = 1 - (marketAnalysis.trendStrength * 0.3);
    const adjustedStopLossPercent = baseStopLossPercent * trendMultiplier;
    const adjustedTakeProfitPercent = baseTakeProfitPercent * (1 + marketAnalysis.trendStrength * 0.5);

    // Ajustar según confianza (mayor confianza = stop loss más ajustado)
    const confidenceMultiplier = 1 - ((100 - marketAnalysis.confidence) / 100 * 0.2);
    const finalStopLossPercent = adjustedStopLossPercent * confidenceMultiplier;
    const finalTakeProfitPercent = adjustedTakeProfitPercent * (1 + (marketAnalysis.confidence / 100 * 0.3));

    // Buscar niveles de soporte/resistencia históricos
    const supportResistance = this.findSupportResistance(
      priceHistory,
      currentPrice,
      isLong
    );

    // Ajustar stop loss a nivel de soporte/resistencia más cercano
    let finalStopLoss = finalStopLossPercent;
    if (supportResistance.nearestLevel) {
      const levelDistance = Math.abs(supportResistance.nearestLevel - entryPrice) / entryPrice * 100;
      if (levelDistance < finalStopLossPercent * 1.5) {
        // Si hay un nivel cercano, usarlo como stop loss
        finalStopLoss = levelDistance * 0.9; // 90% de la distancia al nivel
      }
    }

    // Calcular precios absolutos
    const stopLossPrice = isLong
      ? entryPrice * (1 - finalStopLoss / 100)
      : entryPrice * (1 + finalStopLoss / 100);

    const takeProfitPrice = isLong
      ? entryPrice * (1 + finalTakeProfitPercent / 100)
      : entryPrice * (1 - finalTakeProfitPercent / 100);

    // Trailing stop (si la operación está en ganancia)
    let trailingStop: number | undefined;
    if (isLong && currentPrice > entryPrice) {
      // Si estamos en ganancia, trailing stop a 50% de la ganancia actual
      const profit = currentPrice - entryPrice;
      trailingStop = currentPrice - (profit * 0.5);
    } else if (!isLong && currentPrice < entryPrice) {
      const profit = entryPrice - currentPrice;
      trailingStop = currentPrice + (profit * 0.5);
    }

    return {
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      stopLossPercent: finalStopLoss,
      takeProfitPercent: finalTakeProfitPercent,
      trailingStop,
    };
  }

  /**
   * Encuentra niveles de soporte y resistencia históricos
   */
  private findSupportResistance(
    priceHistory: PriceData[],
    currentPrice: number,
    isLong: boolean
  ): { nearestLevel: number | null; levels: number[] } {
    if (priceHistory.length < 20) {
      return { nearestLevel: null, levels: [] };
    }

    const prices = priceHistory.map(h => h.price);
    
    // Encontrar máximos y mínimos locales
    const levels: number[] = [];
    const window = 10; // Ventana para encontrar máximos/mínimos

    for (let i = window; i < prices.length - window; i++) {
      const localMax = Math.max(...prices.slice(i - window, i + window));
      const localMin = Math.min(...prices.slice(i - window, i + window));

      // Si el precio actual es un máximo local, es resistencia
      if (Math.abs(prices[i] - localMax) < localMax * 0.001) {
        levels.push(localMax);
      }

      // Si el precio actual es un mínimo local, es soporte
      if (Math.abs(prices[i] - localMin) < localMin * 0.001) {
        levels.push(localMin);
      }
    }

    // Eliminar duplicados y ordenar
    const uniqueLevels = Array.from(new Set(levels)).sort((a, b) => a - b);

    // Encontrar el nivel más cercano relevante
    let nearestLevel: number | null = null;
    let minDistance = Infinity;

    for (const level of uniqueLevels) {
      const distance = Math.abs(level - currentPrice);
      if (distance < minDistance) {
        // Para longs, buscar soportes por debajo
        // Para shorts, buscar resistencias por encima
        if ((isLong && level < currentPrice) || (!isLong && level > currentPrice)) {
          minDistance = distance;
          nearestLevel = level;
        }
      }
    }

    return { nearestLevel, levels: uniqueLevels };
  }

  /**
   * Actualiza los niveles de una orden existente
   */
  updateOrderLevels(
    order: TradingOrder,
    currentPrice: number,
    marketAnalysis: MarketAnalysis,
    priceHistory: PriceData[]
  ): DynamicLevels {
    return this.calculateDynamicLevels(order, currentPrice, marketAnalysis, priceHistory);
  }

  /**
   * Verifica si se debe activar el stop loss o take profit
   */
  shouldCloseOrder(
    order: TradingOrder,
    currentPrice: number,
    levels: DynamicLevels
  ): { shouldClose: boolean; reason: 'stop_loss' | 'take_profit' | 'trailing_stop' | null } {
    const isLong = order.side === 'long';

    // Verificar stop loss
    if (isLong && currentPrice <= levels.stopLoss) {
      return { shouldClose: true, reason: 'stop_loss' };
    }
    if (!isLong && currentPrice >= levels.stopLoss) {
      return { shouldClose: true, reason: 'stop_loss' };
    }

    // Verificar take profit
    if (isLong && currentPrice >= levels.takeProfit) {
      return { shouldClose: true, reason: 'take_profit' };
    }
    if (!isLong && currentPrice <= levels.takeProfit) {
      return { shouldClose: true, reason: 'take_profit' };
    }

    // Verificar trailing stop
    if (levels.trailingStop) {
      if (isLong && currentPrice <= levels.trailingStop) {
        return { shouldClose: true, reason: 'trailing_stop' };
      }
      if (!isLong && currentPrice >= levels.trailingStop) {
        return { shouldClose: true, reason: 'trailing_stop' };
      }
    }

    return { shouldClose: false, reason: null };
  }
}

export const dynamicStopLoss = new DynamicStopLoss();

