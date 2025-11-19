// Calculadora de comisiones y fees para Based

/**
 * Estructura típica de comisiones en exchanges de futuros:
 * - Maker fee: 0.02% - 0.05% (creas liquidez)
 * - Taker fee: 0.04% - 0.075% (tomas liquidez)
 * - Funding rate: Variable según el mercado (cada 8 horas)
 * - Comisión de cierre: Generalmente igual a la de apertura
 */

export interface TradingFees {
  makerFee: number; // Porcentaje (0.02 = 0.02%)
  takerFee: number; // Porcentaje (0.04 = 0.04%)
  fundingRate: number; // Porcentaje por 8 horas
  minFee: number; // Fee mínimo en USD
}

export interface FeeCalculation {
  openFee: number; // Fee de apertura
  closeFee: number; // Fee de cierre
  fundingFee: number; // Fee de funding (si aplica)
  totalFees: number; // Total de fees
  netPnl: number; // PnL después de fees
  breakevenPrice: number; // Precio necesario para cubrir fees
}

export class FeeCalculator {
  // Comisiones estimadas para Based (ajustar según documentación real)
  private fees: TradingFees = {
    makerFee: 0.02, // 0.02% - Estrategia: intentar ser maker cuando sea posible
    takerFee: 0.04, // 0.04% - Usar solo cuando sea necesario
    fundingRate: 0.01, // 0.01% cada 8 horas (típico en mercados normales)
    minFee: 0.1, // $0.10 mínimo
  };

  /**
   * Calcula los fees totales de una operación
   */
  calculateFees(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    leverage: number,
    side: 'long' | 'short',
    isMaker: boolean = false,
    hoursOpen: number = 0
  ): FeeCalculation {
    const positionValue = quantity * entryPrice * leverage;
    
    // Fee de apertura
    const openFeeRate = isMaker ? this.fees.makerFee : this.fees.takerFee;
    const openFee = Math.max(
      this.fees.minFee,
      (positionValue * openFeeRate) / 100
    );

    // Fee de cierre
    const closeFee = Math.max(
      this.fees.minFee,
      (positionValue * openFeeRate) / 100
    );

    // Funding fee (solo si la posición está abierta más de 8 horas)
    const fundingPeriods = Math.floor(hoursOpen / 8);
    const fundingFee = fundingPeriods > 0
      ? (positionValue * this.fees.fundingRate * fundingPeriods) / 100
      : 0;

    const totalFees = openFee + closeFee + fundingFee;

    // Calcular PnL bruto
    const priceDiff = side === 'long'
      ? exitPrice - entryPrice
      : entryPrice - exitPrice;
    const grossPnl = priceDiff * quantity * leverage;

    // PnL neto (después de fees)
    const netPnl = grossPnl - totalFees;

    // Precio de breakeven (precio necesario para cubrir fees)
    const breakevenPrice = side === 'long'
      ? entryPrice + (totalFees / (quantity * leverage))
      : entryPrice - (totalFees / (quantity * leverage));

    return {
      openFee,
      closeFee,
      fundingFee,
      totalFees,
      netPnl,
      breakevenPrice,
    };
  }

  /**
   * Calcula el tamaño mínimo de operación para que sea rentable
   * Considerando que necesitamos cubrir fees + ganancia mínima
   */
  calculateMinProfitableSize(
    entryPrice: number,
    expectedMove: number, // Movimiento esperado en porcentaje
    leverage: number,
    minProfitPercent: number = 0.5 // Ganancia mínima deseada (0.5%)
  ): number {
    // Calcular fees estimados para $1 de posición
    const testPositionValue = 1;
    const estimatedFees = (testPositionValue * this.fees.takerFee * 2) / 100; // Apertura + cierre
    
    // Ganancia bruta necesaria = fees + ganancia mínima
    const requiredGrossProfit = estimatedFees + (testPositionValue * minProfitPercent / 100);
    
    // Movimiento necesario en precio
    const requiredPriceMove = requiredGrossProfit / leverage;
    const requiredMovePercent = (requiredPriceMove / entryPrice) * 100;

    // Si el movimiento esperado es menor que el requerido, no es rentable
    if (expectedMove < requiredMovePercent) {
      return 0; // No es rentable
    }

    // Calcular tamaño mínimo (ajustar según capital disponible)
    // Por ahora retornamos un tamaño mínimo razonable
    return 0.0001; // Mínimo técnico
  }

  /**
   * Verifica si una operación es rentable después de fees
   */
  isProfitable(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    leverage: number,
    side: 'long' | 'short',
    hoursOpen: number = 0
  ): boolean {
    const fees = this.calculateFees(
      entryPrice,
      exitPrice,
      quantity,
      leverage,
      side,
      false,
      hoursOpen
    );

    return fees.netPnl > 0;
  }

  /**
   * Obtiene la configuración de fees
   */
  getFees(): TradingFees {
    return { ...this.fees };
  }

  /**
   * Actualiza la configuración de fees
   */
  updateFees(fees: Partial<TradingFees>): void {
    this.fees = { ...this.fees, ...fees };
  }
}

export const feeCalculator = new FeeCalculator();

