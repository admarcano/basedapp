// API Route para autenticación con Based

import { NextRequest, NextResponse } from 'next/server';
import { basedService } from '@/lib/services/basedService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, apiSecret } = body;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'API Key y API Secret requeridos' },
        { status: 400 }
      );
    }

    const authenticated = await basedService.authenticate(apiKey, apiSecret);

    if (authenticated) {
      return NextResponse.json({
        success: true,
        message: 'Autenticado con Based exitosamente',
      });
    }

    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error en autenticación Based:', error);
    return NextResponse.json(
      { error: 'Error en autenticación' },
      { status: 500 }
    );
  }
}

