"use client";

import { TradingSignal, TradingStrategy } from '@/lib/types/trading';
import { useTradingBot } from '@/lib/hooks/useTradingBot';

interface OrderButtonProps {
  signal: TradingSignal;
  strategy: TradingStrategy;
}

export function OrderButton({ signal, strategy }: OrderButtonProps) {
  const { createOrderFromSignal } = useTradingBot();

  const handleCreateOrder = () => {
    // Crear orden localmente primero
    const order = createOrderFromSignal(signal, strategy);
    console.log('Orden creada:', order);
    
    // Aquí podrías integrar con un contrato on-chain si lo necesitas
    // Por ahora, la orden se maneja localmente
  };

  // Si quieres usar transacciones on-chain, puedes usar TransactionButton
  // Por ahora, usamos un botón simple que crea la orden localmente
  return (
    <button
      onClick={handleCreateOrder}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors text-sm font-medium"
    >
      Ejecutar Orden
    </button>
  );
}

