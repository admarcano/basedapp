// API Route para gestionar estrategias de trading

import { NextRequest, NextResponse } from 'next/server';
import { TradingStrategy } from '@/lib/types/trading';

// En producción, esto debería estar en una base de datos
// Por ahora usamos un almacenamiento en memoria (se perderá al reiniciar)
let strategies: TradingStrategy[] = [];

export async function GET(request: NextRequest) {
  try {
    // En producción, obtener de la base de datos filtrado por usuario
    return NextResponse.json({ strategies });
  } catch (error) {
    console.error('Error obteniendo estrategias:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estrategias' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, pair, leverage, stopLoss, takeProfit, minConfidence, maxPositions } = body;

    // Validación básica
    if (!name || !type || !pair) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    const newStrategy: TradingStrategy = {
      id: `strategy-${Date.now()}`,
      name,
      type,
      enabled: true,
      pair,
      leverage: leverage || 5,
      stopLoss: stopLoss || 5,
      takeProfit: takeProfit || 10,
      minConfidence: minConfidence || 70,
      maxPositions: maxPositions || 3,
      createdAt: Date.now(),
      totalTrades: 0,
      winRate: 0,
      totalPnl: 0,
    };

    strategies.push(newStrategy);

    return NextResponse.json({ strategy: newStrategy }, { status: 201 });
  } catch (error) {
    console.error('Error creando estrategia:', error);
    return NextResponse.json(
      { error: 'Error creando estrategia' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      );
    }

    const index = strategies.findIndex(s => s.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Estrategia no encontrada' },
        { status: 404 }
      );
    }

    strategies[index] = { ...strategies[index], ...updates };

    return NextResponse.json({ strategy: strategies[index] });
  } catch (error) {
    console.error('Error actualizando estrategia:', error);
    return NextResponse.json(
      { error: 'Error actualizando estrategia' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      );
    }

    strategies = strategies.filter(s => s.id !== id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando estrategia:', error);
    return NextResponse.json(
      { error: 'Error eliminando estrategia' },
      { status: 500 }
    );
  }
}

