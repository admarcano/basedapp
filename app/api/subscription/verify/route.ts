// API Route para verificar pago y activar suscripción

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, transactionHash, currency = 'EUR', paymentMethod = 'crypto' } = body;

    if (!userId || !transactionHash) {
      return NextResponse.json(
        { error: 'User ID y Transaction Hash requeridos' },
        { status: 400 }
      );
    }

    // Verificar pago
    const paymentVerified = await subscriptionService.verifyPayment(transactionHash);

    if (!paymentVerified) {
      return NextResponse.json(
        { error: 'Pago no verificado' },
        { status: 400 }
      );
    }

    // Crear suscripción
    const subscription = subscriptionService.createSubscription(
      userId,
      currency,
      paymentMethod,
      transactionHash
    );

    // TODO: Guardar suscripción en base de datos

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Error verificando pago:', error);
    return NextResponse.json(
      { error: 'Error verificando pago' },
      { status: 500 }
    );
  }
}

