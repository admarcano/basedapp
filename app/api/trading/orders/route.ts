// API Route para gestionar órdenes de trading

import { NextRequest, NextResponse } from 'next/server';
import { TradingOrder } from '@/lib/types/trading';

// En producción, esto debería estar en una base de datos
const orders: TradingOrder[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let filteredOrders = orders;
    if (status) {
      filteredOrders = orders.filter(o => o.status === status);
    }

    return NextResponse.json({ orders: filteredOrders });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return NextResponse.json(
      { error: 'Error obteniendo órdenes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pair, side, entryPrice, quantity, leverage, strategy, stopLoss, takeProfit } = body;

    // Validación
    if (!pair || !side || !entryPrice || !quantity) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    const newOrder: TradingOrder = {
      id: `order-${Date.now()}`,
      pair,
      side,
      entryPrice,
      currentPrice: entryPrice,
      quantity,
      leverage: leverage || 1,
      status: 'open',
      strategy: strategy || 'momentum',
      createdAt: Date.now(),
      stopLoss,
      takeProfit,
    };

    orders.push(newOrder);

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creando orden:', error);
    return NextResponse.json(
      { error: 'Error creando orden' },
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

    const index = orders.findIndex(o => o.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    orders[index] = { ...orders[index], ...updates };

    return NextResponse.json({ order: orders[index] });
  } catch (error) {
    console.error('Error actualizando orden:', error);
    return NextResponse.json(
      { error: 'Error actualizando orden' },
      { status: 500 }
    );
  }
}

