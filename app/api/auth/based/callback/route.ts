// API Route para manejar el callback de OAuth de Based

import { NextRequest, NextResponse } from 'next/server';

const BASED_CLIENT_ID = process.env.NEXT_PUBLIC_BASED_CLIENT_ID || '';
const BASED_CLIENT_SECRET = process.env.BASED_CLIENT_SECRET || '';
const BASED_TOKEN_URL = 'https://app.based.one/oauth/token'; // Ajustar según la URL real

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorización requerido' },
        { status: 400 }
      );
    }

    // Intercambiar código por token
    const tokenResponse = await fetch(BASED_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/based/callback`,
        client_id: BASED_CLIENT_ID,
        client_secret: BASED_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: 'Error obteniendo token' },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Obtener información del usuario
    const userResponse = await fetch('https://app.based.one/api/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Error obteniendo información del usuario' },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();

    return NextResponse.json({
      success: true,
      user: {
        email: userData.email,
        id: userData.id,
        name: userData.name,
        walletAddress: userData.walletAddress,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Error en callback OAuth:', error);
    return NextResponse.json(
      { error: 'Error en autenticación' },
      { status: 500 }
    );
  }
}

