// API Route para crear sesión de pago

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currency = 'EUR', paymentMethod = 'crypto' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID requerido' },
        { status: 400 }
      );
    }

    const price = subscriptionService.getSubscriptionPrice(currency);

    // En producción, aquí crearías una sesión de pago con OnchainKit Checkout
    // o con otro proveedor de pagos
    return NextResponse.json({
      success: true,
      price,
      currency,
      paymentMethod,
      // En producción, incluir aquí la URL de checkout o datos de pago
    });
  } catch (error) {
    console.error('Error creando checkout:', error);
    return NextResponse.json(
      { error: 'Error creando checkout' },
      { status: 500 }
    );
  }
}

