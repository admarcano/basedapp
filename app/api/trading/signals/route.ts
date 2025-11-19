// API Route para obtener señales de trading

import { NextRequest, NextResponse } from 'next/server';
import { signalService } from '@/lib/services/signalService';
import { priceService } from '@/lib/services/priceService';
import { TradingPair, StrategyType } from '@/lib/types/trading';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair') as TradingPair | null;
    const strategies = searchParams.get('strategies')?.split(',') as StrategyType[] | null;

    if (!pair) {
      return NextResponse.json(
        { error: 'Par requerido' },
        { status: 400 }
      );
    }

    // Obtener precio actual
    const price = await priceService.getPrice(pair);
    signalService.addPriceData({
      symbol: pair,
      price,
      timestamp: Date.now(),
    });

    // Generar señales
    const activeStrategies = strategies || ['momentum', 'rsi', 'mean_reversion', 'breakout'];
    const signals = await signalService.generateSignals(pair, activeStrategies);

    return NextResponse.json({ signals });
  } catch (error) {
    console.error('Error generando señales:', error);
    return NextResponse.json(
      { error: 'Error generando señales' },
      { status: 500 }
    );
  }
}

