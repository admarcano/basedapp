"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Transaction, TransactionButton } from '@coinbase/onchainkit/transaction';
import { baseSepolia } from 'wagmi/chains';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { basedAuthService } from '@/lib/services/basedAuthService';

interface SubscriptionGateProps {
  children: React.ReactNode;
  userRole?: 'developer' | 'user';
}

export function SubscriptionGate({ children, userRole = 'user' }: SubscriptionGateProps) {
  const { address, isConnected } = useAccount();
  const { context } = useMiniKit();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [address, userRole]);

  const checkAccess = async () => {
    setChecking(true);
    
    // Obtener usuario de Based
    const basedUser = basedAuthService.getCurrentUser();
    
    if (!basedUser) {
      setHasAccess(false);
      setChecking(false);
      return;
    }

    // Verificar si es usuario gratis (albertodiazmarcano@gmail.com)
    if (basedAuthService.isFreeUser(basedUser.email)) {
      setHasAccess(true);
      setChecking(false);
      return;
    }

    // Desarrolladores tienen acceso gratis
    if (userRole === 'developer') {
      setHasAccess(true);
      setChecking(false);
      return;
    }

    // Verificar suscripción del usuario
    const userId = basedUser.id || address || context?.user?.fid?.toString() || '';
    
    // Por ahora, verificar en localStorage
    const subscriptionData = localStorage.getItem(`subscription_${userId}`);
    if (subscriptionData) {
      const subscription = JSON.parse(subscriptionData);
      const user = { 
        role: 'user' as const, 
        email: basedUser.email,
        subscription 
      };
      setHasAccess(subscriptionService.hasActiveAccess(user));
    } else {
      setHasAccess(false);
    }

    setChecking(false);
  };

  const handlePayment = async () => {
    // Crear checkout
    const response = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: address || context?.user?.fid?.toString(),
        currency: 'EUR',
        paymentMethod: 'crypto',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      setShowPayment(true);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Verificando acceso...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 text-center">
            <h2 className="text-3xl font-bold mb-4">Acceso Premium Requerido</h2>
            <p className="text-gray-400 mb-6">
              Para usar el bot de trading, necesitas una suscripción premium de 100€
            </p>

            {!isConnected && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-4">
                  Conecta tu wallet primero
                </p>
              </div>
            )}

            {isConnected && !showPayment && (
              <button
                onClick={handlePayment}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all"
              >
                Suscribirse por 100€
              </button>
            )}

            {showPayment && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Realiza el pago de 100€ (EUR) o equivalente en crypto
                </p>
                <p className="text-xs text-gray-500">
                  Envíanos el hash de la transacción después del pago
                </p>
                {/* Aquí integrarías OnchainKit Checkout o tu sistema de pago */}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-500">
              <p>La suscripción es válida por 30 días</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

